import { useParams, useNavigate } from 'react-router-dom';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  type KeyboardEvent,
} from 'react';
import { messagesApi } from '../api/messages';
import { useAuthStore } from '../store/auth';
import { useToastStore } from '../store/toast';
import { useSocketEvent, useSocketSend } from '../hooks/useSocket';
import { formatDateHeader, getErrorMessage } from '../utils';
import Avatar from '../components/Avatar';
import AudioPlayer from '../components/AudioPlayer';
import VoiceRecorder from '../components/VoiceRecorder';
import type { Message, Conversation } from '../types';

/* ────────────────────────────────────────────── */

export default function ChatWindow() {
  const { userId } = useParams<{ userId: string }>();
  const me = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const qc = useQueryClient();

  /* ── peer username from conversations cache ── */
  const peerName = useMemo(() => {
    const convs = qc.getQueryData<Conversation[]>(['conversations']);
    return convs?.find((c) => c.userId === userId)?.username ?? 'Chat';
  }, [qc, userId]);

  /* ── messages infinite query (newest-first pages) ── */
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['messages', userId],
    queryFn: ({ pageParam }) =>
      messagesApi.getMessages(userId!, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return undefined;
      return lastPage[lastPage.length - 1].id; // oldest in this page
    },
    enabled: !!userId,
  });

  /* flatten & reverse → chronological */
  const messages = useMemo(() => {
    if (!data) return [];
    const flat = data.pages.flatMap((p) => p);
    // Remove duplicates (optimistic + server echoes)
    const seen = new Set<string>();
    const deduped: Message[] = [];
    for (const m of flat) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        deduped.push(m);
      }
    }
    return deduped.slice().reverse(); // oldest first
  }, [data]);

  /* ── optimistic messages ── */
  const [pendingMessages, setPendingMessages] = useState<
    { tempId: string; content: string; createdAt: string; status: 'pending' | 'failed' }[]
  >([]);

  /* ── banner state ── */
  const [banner, setBanner] = useState<string | null>(null);

  /* ── scroll refs ── */
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isNearBottom = useRef(true);
  const prevScrollHeight = useRef(0);

  /* keep track of "near bottom" */
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const threshold = 120;
    isNearBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  /* auto-scroll to bottom on new messages when near bottom */
  useEffect(() => {
    if (isNearBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, pendingMessages.length]);

  /* restore scroll when loading older messages */
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (prevScrollHeight.current > 0 && !isNearBottom.current) {
      el.scrollTop = el.scrollHeight - prevScrollHeight.current;
    }
    prevScrollHeight.current = 0;
  }, [data?.pages.length]);

  /* load older when scrolling to top */
  const handleScrollToTop = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (el.scrollTop < 50 && hasNextPage && !isFetchingNextPage) {
      prevScrollHeight.current = el.scrollHeight;
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  /* combine scroll handlers */
  const onScroll = useCallback(() => {
    handleScroll();
    handleScrollToTop();
  }, [handleScroll, handleScrollToTop]);

  /* initial scroll to bottom */
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      bottomRef.current?.scrollIntoView();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  /* ── mark read on open & on new incoming ── */
  const markReadMut = useMutation({
    mutationFn: () => messagesApi.markRead(userId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  useEffect(() => {
    if (userId && !isLoading) markReadMut.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isLoading]);

  /* ── socket: new message ── */
  useSocketEvent<Message>('message:new', (msg) => {
    if (msg.senderId === userId || msg.receiverId === userId) {
      // Refresh this conversation
      qc.invalidateQueries({ queryKey: ['messages', userId] });
      // Mark as read if the message is from the peer
      if (msg.senderId === userId) {
        markReadMut.mutate();
      }
    }
  });

  /* ── socket: read receipt ── */
  useSocketEvent<{ byUserId: string }>('message:read', (payload) => {
    if (payload.byUserId === userId) {
      qc.invalidateQueries({ queryKey: ['messages', userId] });
    }
  });

  /* ── send text ── */
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const socketSend = useSocketSend();

  const sendText = useCallback(async () => {
    const content = text.trim();
    if (!content || !userId || sending) return;

    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();

    setPendingMessages((prev) => [
      ...prev,
      { tempId, content, createdAt: now, status: 'pending' },
    ]);
    setText('');
    setSending(true);
    isNearBottom.current = true;

    try {
      // Try socket first
      const ackPromise = socketSend(userId, content);
      if (ackPromise) {
        const ack = await ackPromise;
        if (ack.ok) {
          setPendingMessages((prev) => prev.filter((m) => m.tempId !== tempId));
          qc.invalidateQueries({ queryKey: ['messages', userId] });
          qc.invalidateQueries({ queryKey: ['conversations'] });
          setSending(false);
          return;
        }
        // If ack not ok, check for user unavailable
        if (ack.error) {
          if (ack.error.includes('not found') || ack.error.includes('403')) {
            setBanner('This user is no longer available.');
          }
          setPendingMessages((prev) =>
            prev.map((m) => (m.tempId === tempId ? { ...m, status: 'failed' as const } : m)),
          );
          setSending(false);
          return;
        }
      }
      // Socket unavailable → REST fallback
      await messagesApi.sendText({ receiverId: userId, content });
      setPendingMessages((prev) => prev.filter((m) => m.tempId !== tempId));
      qc.invalidateQueries({ queryKey: ['messages', userId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      if (msg.includes('not found') || msg.includes('Forbidden')) {
        setBanner('This user is no longer available.');
      }
      setPendingMessages((prev) =>
        prev.map((m) => (m.tempId === tempId ? { ...m, status: 'failed' as const } : m)),
      );
    } finally {
      setSending(false);
    }
  }, [text, userId, sending, socketSend, qc]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  };

  /* ── retry failed message ── */
  const retryMessage = useCallback(
    async (tempId: string, content: string) => {
      if (!userId) return;
      setPendingMessages((prev) =>
        prev.map((m) => (m.tempId === tempId ? { ...m, status: 'pending' as const } : m)),
      );
      try {
        await messagesApi.sendText({ receiverId: userId, content });
        setPendingMessages((prev) => prev.filter((m) => m.tempId !== tempId));
        qc.invalidateQueries({ queryKey: ['messages', userId] });
        qc.invalidateQueries({ queryKey: ['conversations'] });
      } catch {
        setPendingMessages((prev) =>
          prev.map((m) => (m.tempId === tempId ? { ...m, status: 'failed' as const } : m)),
        );
      }
    },
    [userId, qc],
  );

  /* ── send audio ── */
  const audioMut = useMutation({
    mutationFn: (vars: { audio: Blob; durationSec: number }) =>
      messagesApi.sendAudio({ audio: vars.audio, receiverId: userId!, durationSec: vars.durationSec }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', userId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (err: unknown) => addToast('error', getErrorMessage(err)),
  });

  /* ── group messages by day ── */
  const grouped = useMemo(() => {
    const groups: { date: string; items: (Message | typeof pendingMessages[number])[] }[] = [];
    const all: (Message | typeof pendingMessages[number])[] = [
      ...messages,
      ...pendingMessages,
    ];
    for (const m of all) {
      const dateStr = new Date(m.createdAt).toDateString();
      const last = groups[groups.length - 1];
      if (last && last.date === dateStr) {
        last.items.push(m);
      } else {
        groups.push({ date: dateStr, items: [m] });
      }
    }
    return groups;
  }, [messages, pendingMessages]);

  if (!userId) return null;

  return (
    <div className="flex flex-col h-[100dvh] md:h-[calc(100dvh-4rem)] bg-slate-50 dark:bg-slate-950">
      {/* ── Header ── */}
      <header className="flex items-center gap-3 px-4 h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 shrink-0 z-10">
        <button
          onClick={() => navigate('/chats')}
          className="md:hidden p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          aria-label="Back to chats"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <Avatar name={peerName} size="sm" />
        <span className="font-semibold text-slate-900 dark:text-white truncate">{peerName}</span>
      </header>

      {/* ── Banner ── */}
      {banner && (
        <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm px-4 py-2 text-center">
          {banner}
        </div>
      )}

      {/* ── Messages area ── */}
      <div
        ref={scrollContainerRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-1"
      >
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && messages.length === 0 && pendingMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
            <p className="text-slate-400 dark:text-slate-500 font-medium">No messages yet</p>
            <p className="text-sm text-slate-400 dark:text-slate-600">Say hello! 👋</p>
          </div>
        )}

        {grouped.map((group) => (
          <div key={group.date}>
            <div className="flex items-center justify-center my-4">
              <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                {formatDateHeader(group.items[0].createdAt)}
              </span>
            </div>
            {group.items.map((m) => {
              const isPending = 'tempId' in m;
              const isMine = isPending || (m as Message).senderId === me?.id;
              const msg = m as Message;

              return (
                <div
                  key={isPending ? m.tempId : msg.id}
                  className={`flex mb-1.5 ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm relative group ${
                      isMine
                        ? 'bg-brand-500 text-white rounded-br-md'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-md shadow-sm border border-slate-100 dark:border-slate-700/50'
                    } ${isPending && (m as typeof pendingMessages[number]).status === 'pending' ? 'opacity-60' : ''}`}
                  >
                    {/* Text */}
                    {(!isPending && msg.type === 'text') && (
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    )}

                    {/* Pending text */}
                    {isPending && (
                      <p className="whitespace-pre-wrap break-words">
                        {(m as typeof pendingMessages[number]).content}
                      </p>
                    )}

                    {/* Audio */}
                    {(!isPending && msg.type === 'audio') && (
                      <AudioPlayer
                        messageId={msg.id}
                        audioUrl={msg.audioUrl}
                        durationSec={msg.audioDurationSec}
                      />
                    )}

                    {/* Meta row */}
                    <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <span className={`text-[10px] ${isMine ? 'text-white/60' : 'text-slate-400'}`}>
                        {new Date(isPending ? (m as typeof pendingMessages[number]).createdAt : msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {/* Read ticks for my messages */}
                      {isMine && !isPending && (
                        <span className={`text-[10px] ${msg.readAt ? 'text-white' : 'text-white/40'}`}>
                          {msg.readAt ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>

                    {/* Failed message retry */}
                    {isPending && (m as typeof pendingMessages[number]).status === 'failed' && (
                      <button
                        onClick={() =>
                          retryMessage(
                            (m as typeof pendingMessages[number]).tempId,
                            (m as typeof pendingMessages[number]).content,
                          )
                        }
                        className="absolute -bottom-5 right-0 text-[10px] text-rose-400 hover:text-rose-300 font-medium"
                      >
                        Failed – tap to retry
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* ── Input area ── */}
      <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg px-3 py-2 safe-area-bottom">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <VoiceRecorder
            onSend={(blob, dur) => audioMut.mutate({ audio: blob, durationSec: dur })}
            disabled={sending || audioMut.isPending}
          />

          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={(e) => {
                if (e.target.value.length <= 2000) setText(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              disabled={sending}
              rows={1}
              placeholder="Type a message…"
              className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition max-h-32 overflow-y-auto disabled:opacity-50"
              style={{ minHeight: '40px' }}
              aria-label="Message input"
            />
            {text.length > 1800 && (
              <span className="absolute bottom-1 right-2 text-[10px] text-slate-400">
                {text.length}/2000
              </span>
            )}
          </div>

          <button
            onClick={sendText}
            disabled={!text.trim() || sending}
            className="p-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition-colors disabled:opacity-40 shrink-0"
            aria-label="Send message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

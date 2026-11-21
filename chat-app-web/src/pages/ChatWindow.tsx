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

export default function ChatWindow() {
  const { userId } = useParams<{ userId: string }>();
  const me = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const qc = useQueryClient();

  // Resolves the counterpart's username from cached conversation summaries
  const peerName = useMemo(() => {
    const convs = qc.getQueryData<Conversation[]>(['conversations']);
    return convs?.find((c) => c.userId === userId)?.username ?? 'Chat';
  }, [qc, userId]);

  // Paginated cursor-based message history query (fetching from newest backwards)
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
      return lastPage[lastPage.length - 1].id;
    },
    enabled: !!userId,
  });

  // Flatten paged responses and deduplicate against potential optimistic client echoes
  const messages = useMemo(() => {
    if (!data) return [];
    const flat = data.pages.flatMap((p) => p);
    const seen = new Set<string>();
    const deduped: Message[] = [];
    for (const m of flat) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        deduped.push(m);
      }
    }
    return deduped.slice().reverse();
  }, [data]);

  // Temporary optimistic entries displayed immediately while network dispatch is inflight
  const [pendingMessages, setPendingMessages] = useState<
    { tempId: string; content: string; createdAt: string; status: 'pending' | 'failed' }[]
  >([]);

  const [banner, setBanner] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isNearBottom = useRef(true);
  const prevScrollHeight = useRef(0);

  // Tracks whether the user is viewing the latest message to determine whether to auto-scroll
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const threshold = 120;
    isNearBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  // Smoothly scroll down when a new message arrives if user was already at the bottom
  useEffect(() => {
    if (isNearBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, pendingMessages.length]);

  // Maintain viewport scroll position when older message pages are prepended at the top
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (prevScrollHeight.current > 0 && !isNearBottom.current) {
      el.scrollTop = el.scrollHeight - prevScrollHeight.current;
    }
    prevScrollHeight.current = 0;
  }, [data?.pages.length]);

  // Infinite scroll trigger when user reaches top of conversation history
  const handleScrollToTop = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (el.scrollTop < 50 && hasNextPage && !isFetchingNextPage) {
      prevScrollHeight.current = el.scrollHeight;
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const onScroll = useCallback(() => {
    handleScroll();
    handleScrollToTop();
  }, [handleScroll, handleScrollToTop]);

  // Scroll to bottom on initial mount once initial message query resolves
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      bottomRef.current?.scrollIntoView();
    }
  }, [isLoading]);

  // Acknowledges incoming messages as read upon conversation mount and focus
  const markReadMut = useMutation({
    mutationFn: () => messagesApi.markRead(userId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  useEffect(() => {
    if (userId && !isLoading) markReadMut.mutate();
  }, [userId, isLoading]);

  // Handles real-time push events from WebSocket for new messages
  useSocketEvent<Message>('message:new', (msg) => {
    if (msg.senderId === userId || msg.receiverId === userId) {
      qc.invalidateQueries({ queryKey: ['messages', userId] });
      if (msg.senderId === userId) {
        markReadMut.mutate();
      }
    }
  });

  // Updates delivery status indicators when recipient reads messages
  useSocketEvent<{ byUserId: string }>('message:read', (payload) => {
    if (payload.byUserId === userId) {
      qc.invalidateQueries({ queryKey: ['messages', userId] });
    }
  });

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const socketSend = useSocketSend();

  // Sends message with Socket.IO first for zero latency, falling back to REST if disconnected
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

  // Uploads binary audio recordings captured by the voice recorder component
  const audioMut = useMutation({
    mutationFn: (vars: { audio: Blob; durationSec: number }) =>
      messagesApi.sendAudio({ audio: vars.audio, receiverId: userId!, durationSec: vars.durationSec }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', userId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (err: unknown) => addToast('error', getErrorMessage(err)),
  });

  // Groups chronological items into date sections for calendar day dividers
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

  if (isLoading) {
    return (
      <div className="flex flex-col h-[100dvh] md:h-full bg-white dark:bg-[#111] items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#131313] dark:border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] md:h-full bg-white dark:bg-[#111]">
      <header className="flex items-center justify-between px-6 h-[72px] bg-white dark:bg-[#111] border-b border-[#E3E3E3] dark:border-[#2a2a2a] shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/chats')}
            className="md:hidden bg-[#F8F8F8] dark:bg-[#202020] border border-[#E3E3E3] dark:border-[#333] rounded-[14px] size-9 flex items-center justify-center hover:bg-[#EFEFEF] dark:hover:bg-[#2a2a2a] transition-colors"
            aria-label="Back to chats"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#131313] dark:text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <Avatar name={peerName} size="sm" />
          <span className="font-medium text-[#131313] dark:text-white text-base truncate">{peerName}</span>
        </div>

        <div className="flex items-center gap-2">
          <button className="bg-[#F8F8F8] dark:bg-[#202020] border border-[#E3E3E3] dark:border-[#333] rounded-[14px] size-9 flex items-center justify-center hover:bg-[#EFEFEF] dark:hover:bg-[#2a2a2a] transition-colors" aria-label="Search conversation">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#292929] dark:text-[#ccc]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </button>
          <button className="bg-[#F8F8F8] dark:bg-[#202020] border border-[#E3E3E3] dark:border-[#333] rounded-[14px] size-9 flex items-center justify-center hover:bg-[#EFEFEF] dark:hover:bg-[#2a2a2a] transition-colors" aria-label="More options">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#292929] dark:text-[#ccc]" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="4" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="10" cy="16" r="1.5" />
            </svg>
          </button>
        </div>
      </header>

      {banner && (
        <div className="bg-[#FFEAEA] dark:bg-[#3d1f1f] text-[#131313] dark:text-white text-sm px-4 py-2 text-center border-b border-[#E3E3E3] dark:border-[#2a2a2a]">
          {banner}
        </div>
      )}

      <div
        ref={scrollContainerRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto px-4 py-4 bg-white dark:bg-[#111]"
      >
        {isFetchingNextPage && (
          <div className="flex justify-center py-3">
            <div className="w-5 h-5 border-2 border-[#131313] dark:border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && messages.length === 0 && pendingMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2 py-16">
            <p className="text-[#868686] font-medium text-sm">No messages yet</p>
            <p className="text-xs text-[#868686]">Say hello to start the conversation! 👋</p>
          </div>
        )}

        {grouped.map((group) => (
          <div key={group.date}>
            <div className="flex items-center justify-center my-4">
              <span className="bg-[#F8F8F8] dark:bg-[#202020] border border-[#E3E3E3] dark:border-[#333] rounded-[14px] px-3 h-8 flex items-center text-[#868686] text-xs font-medium">
                {formatDateHeader(group.items[0].createdAt)}
              </span>
            </div>

            <div className="space-y-3">
              {group.items.map((m) => {
                const isPending = 'tempId' in m;
                const isMine = isPending || (m as Message).senderId === me?.id;
                const msg = m as Message;
                const pending = m as typeof pendingMessages[number];

                return (
                  <div
                    key={isPending ? pending.tempId : msg.id}
                    className={`flex items-end gap-2.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div className="shrink-0 mb-1">
                      <Avatar
                        name={isMine ? (me?.username ?? 'Me') : peerName}
                        size="sm"
                      />
                    </div>

                    <div className={`flex flex-col max-w-[72%] ${isMine ? 'items-end' : 'items-start'}`}>
                      <span className="text-[12px] text-[#868686] mb-0.5 px-1">
                        {isMine ? (me?.username ?? 'Me') : peerName}
                      </span>

                      <div
                        className={`relative rounded-[12px] px-3.5 py-2.5 text-[14px] leading-relaxed ${
                          isMine
                            ? 'bg-[#FFEAEA] dark:bg-[#3d1f1f] text-[#131313] dark:text-white'
                            : 'bg-[#F8F8F8] dark:bg-[#202020] text-[#131313] dark:text-white'
                        } ${isPending && pending.status === 'pending' ? 'opacity-60' : ''}`}
                      >
                        {(!isPending && msg.type === 'text') && (
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        )}

                        {isPending && (
                          <p className="whitespace-pre-wrap break-words">{pending.content}</p>
                        )}

                        {(!isPending && msg.type === 'audio') && (
                          <AudioPlayer
                            messageId={msg.id}
                            audioUrl={msg.audioUrl}
                            durationSec={msg.audioDurationSec}
                          />
                        )}

                        {isPending && pending.status === 'failed' && (
                          <button
                            onClick={() => retryMessage(pending.tempId, pending.content)}
                            className="mt-1 text-[10px] text-rose-500 hover:text-rose-400 font-medium"
                          >
                            Failed – tap to retry
                          </button>
                        )}
                      </div>

                      <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                        <span className="text-[10px] text-[#868686]">
                          {new Date(isPending ? pending.createdAt : msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isMine && !isPending && (
                          <span className="text-[10px] text-[#868686]">
                            {msg.readAt ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 bg-[#EFEFEF] dark:bg-[#1a1a1a] pt-3 px-3 pb-3 rounded-t-2xl safe-area-bottom">
        <div className="bg-white dark:bg-[#222222] border border-[#E3E3E3] dark:border-[#333] rounded-2xl shadow-[0px_12px_24px_rgba(53,53,53,0.1)] h-[64px] px-3.5 flex items-center gap-2.5">
          <VoiceRecorder
            onSend={(blob, dur) => audioMut.mutate({ audio: blob, durationSec: dur })}
            disabled={sending || audioMut.isPending}
          />

          <div className="w-px h-5 bg-[#E3E3E3] dark:bg-[#333] shrink-0" />

          <textarea
            value={text}
            onChange={(e) => {
              if (e.target.value.length <= 2000) setText(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            disabled={sending}
            rows={1}
            placeholder="Type a message…"
            className="flex-1 text-[15px] text-[#131313] dark:text-white placeholder-[#868686] outline-none resize-none bg-transparent border-none max-h-[50px] overflow-y-auto disabled:opacity-50"
            style={{ minHeight: '26px' }}
            aria-label="Message input"
          />

          {text.length > 1800 && (
            <span className="text-[10px] text-[#868686] shrink-0">
              {text.length}/2000
            </span>
          )}

          <div className="w-px h-5 bg-[#E3E3E3] dark:bg-[#333] shrink-0" />

          <button
            onClick={sendText}
            disabled={!text.trim() || sending}
            className="bg-[#131313] text-white dark:bg-white dark:text-[#131313] rounded-[14px] size-9 flex items-center justify-center shrink-0 disabled:opacity-40 hover:opacity-85 transition-opacity"
            aria-label="Send message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

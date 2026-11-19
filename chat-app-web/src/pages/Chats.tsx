import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { messagesApi } from '../api/messages';
import { formatRelativeTime, getErrorMessage } from '../utils';
import Avatar from '../components/Avatar';
import { SkeletonList } from '../components/Skeleton';

export default function Chats() {
  const navigate = useNavigate();

  const { data: conversations, isLoading, isError, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: messagesApi.getConversations,
    refetchInterval: 30_000,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Chats</h1>

      {isLoading && <SkeletonList count={6} />}

      {isError && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-4 py-3 text-sm" role="alert">
          {getErrorMessage(error)}
        </div>
      )}

      {!isLoading && !isError && conversations?.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
            </svg>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">No conversations yet</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Find people on the Nearby page and start chatting!
          </p>
        </div>
      )}

      <div className="space-y-1">
        {conversations?.map((c) => (
          <button
            key={c.userId}
            onClick={() => navigate(`/chats/${c.userId}`)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/70 dark:hover:bg-slate-800/70 transition-colors text-left group"
          >
            <Avatar name={c.username} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white truncate text-sm">
                  {c.username}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 ml-2">
                  {formatRelativeTime(c.lastMessage.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {c.lastMessage.type === 'audio'
                    ? '🎤 Voice message'
                    : c.lastMessage.content ?? ''}
                </span>
                {c.unreadCount > 0 && (
                  <span className="ml-2 shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-brand-500 text-white text-[11px] font-bold px-1.5">
                    {c.unreadCount > 99 ? '99+' : c.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { messagesApi } from '../api/messages';
import { formatRelativeTime, getErrorMessage } from '../utils';
import Avatar from '../components/Avatar';
import { SkeletonList } from '../components/Skeleton';

/**
 * Chats page component.
 * Displays the authenticated user's active direct conversations, unread message badges,
 * and the latest activity timestamp, periodically polling for updates.
 */
export default function Chats() {
  const navigate = useNavigate();

  // Queries all user conversations, polling every 30 seconds to update previews and badge counts
  const { data: conversations, isLoading, isError, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: messagesApi.getConversations,
    refetchInterval: 30_000,
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#131313] dark:text-white">Messages</h1>
          <p className="text-sm text-[#868686] mt-1">Direct conversations and recent activity</p>
        </div>
      </div>

      {isLoading && <SkeletonList count={5} />}

      {isError && (
        <div
          className="rounded-2xl bg-[#FFF0F0] border border-[#FFDADA] text-[#DD0000] px-4 py-3 text-sm"
          role="alert"
        >
          {getErrorMessage(error)}
        </div>
      )}

      {!isLoading && !isError && conversations?.length === 0 && (
        <div className="bg-white dark:bg-[#1a1a1a] border border-[#E3E3E3] dark:border-[#2a2a2a] rounded-3xl text-center py-16 px-6 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F8F8F8] dark:bg-[#252525] border border-[#E3E3E3] dark:border-[#333] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#868686]" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
            </svg>
          </div>
          <p className="text-base font-medium text-[#131313] dark:text-white">No conversations yet</p>
          <p className="text-sm text-[#868686] max-w-sm mx-auto">
            Discover nearby people and start a conversation from the Nearby tab.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-2 inline-flex items-center justify-center h-10 px-5 rounded-[14px] bg-[#131313] text-white dark:bg-white dark:text-[#131313] text-sm font-medium hover:opacity-85 transition-opacity"
          >
            Explore Nearby
          </button>
        </div>
      )}

      {conversations && conversations.length > 0 && (
        <div className="bg-white dark:bg-[#1a1a1a] border border-[#E3E3E3] dark:border-[#2a2a2a] rounded-3xl overflow-hidden divide-y divide-[#E3E3E3] dark:divide-[#2a2a2a] shadow-sm">
          {conversations.map((c) => (
            <button
              key={c.userId}
              onClick={() => navigate(`/chats/${c.userId}`)}
              className="w-full flex items-center gap-4 p-4 hover:bg-[#F8F8F8] dark:hover:bg-[#222222] transition-colors text-left group"
            >
              <Avatar name={c.username} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#131313] dark:text-white truncate text-sm">
                    {c.username}
                  </span>
                  <span className="text-xs text-[#868686] shrink-0">
                    {formatRelativeTime(c.lastMessage.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-[#5D5D5D] dark:text-[#aaaaaa] truncate">
                    {c.lastMessage.type === 'audio'
                      ? '🎤 Voice message'
                      : c.lastMessage.content ?? ''}
                  </span>
                  {c.unreadCount > 0 && (
                    <span className="ml-2 shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-[#131313] text-white dark:bg-white dark:text-[#131313] text-[11px] font-bold px-1.5">
                      {c.unreadCount > 99 ? '99+' : c.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

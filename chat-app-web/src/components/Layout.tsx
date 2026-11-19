import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useThemeStore } from '../store/theme';
import { useSocketSetup } from '../hooks/useSocket';
import { useQuery } from '@tanstack/react-query';
import { messagesApi } from '../api/messages';

export default function Layout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { isDark, toggle } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Socket lifecycle
  useSocketSetup();

  // Total unread badge
  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: messagesApi.getConversations,
    refetchInterval: 30_000,
  });
  const totalUnread = conversations?.reduce((sum, c) => sum + c.unreadCount, 0) ?? 0;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Hide bottom nav on mobile when inside a chat window
  const isChatWindow = /^\/chats\/[^/]+$/.test(location.pathname);
  const isAdmin = user?.role === 'admin';

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col md:flex-row items-center gap-0.5 md:gap-2 px-3 py-2 rounded-xl text-xs md:text-sm font-medium transition-colors ${
      isActive
        ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40'
        : 'text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* ─── Top bar (desktop) ─── */}
      <header className="hidden md:flex items-center justify-between px-6 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="flex items-center gap-1">
          <span className="text-xl font-bold bg-gradient-to-r from-brand-500 to-violet-500 bg-clip-text text-transparent mr-4">
            NearbyChat
          </span>
          <NavLink to="/" className={navLinkClass} end>
            <NearbyIcon /> Nearby
          </NavLink>
          <NavLink to="/chats" className={navLinkClass}>
            <ChatsIcon />
            Chats
            {totalUnread > 0 && <Badge count={totalUnread} />}
          </NavLink>
          {isAdmin && (
            <>
              <NavLink to="/admin/users" className={navLinkClass}>
                <UsersIcon /> Users
              </NavLink>
              <NavLink to="/admin/settings" className={navLinkClass}>
                <SettingsIcon /> Settings
              </NavLink>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ─── Content ─── */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* ─── Bottom tab bar (mobile) ─── */}
      {!isChatWindow && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 py-1 z-30 safe-area-bottom">
          <NavLink to="/" className={navLinkClass} end>
            <NearbyIcon /> Nearby
          </NavLink>
          <NavLink to="/chats" className={navLinkClass}>
            <div className="relative">
              <ChatsIcon />
              {totalUnread > 0 && <Badge count={totalUnread} mobile />}
            </div>
            Chats
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin/users" className={navLinkClass}>
              <UsersIcon /> Admin
            </NavLink>
          )}
          <button onClick={toggle} className="flex flex-col items-center gap-0.5 px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
            {isDark ? <SunIcon /> : <MoonIcon />}
            Theme
          </button>
          <button onClick={handleLogout} className="flex flex-col items-center gap-0.5 px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
            <LogoutIcon />
            Logout
          </button>
        </nav>
      )}
    </div>
  );
}

/* ─── Inline icons ─── */

function Badge({ count, mobile }: { count: number; mobile?: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 ${
        mobile ? 'absolute -top-1.5 -right-2.5' : 'ml-1'
      }`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

function NearbyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
  );
}

function ChatsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
    </svg>
  );
}

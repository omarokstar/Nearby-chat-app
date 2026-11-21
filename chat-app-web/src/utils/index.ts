/**
 * Returns uppercase initial character from a display name or username.
 */
export function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

const palette = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500',
  'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500',
  'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
  'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500',
  'bg-pink-500', 'bg-rose-500',
];

/**
 * Computes a deterministic background color from a username string for avatars.
 */
export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

/**
 * Formats a metric distance into readable meters (< 1km) or kilometers.
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Formats an ISO date timestamp into relative human-readable time (e.g. "just now", "5m ago").
 */
export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/**
 * Formats a date string into calendar headers: 'Today', 'Yesterday', or weekday and date.
 */
export function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return 'Today';
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

/**
 * Formats duration seconds into mm:ss audio timer display.
 */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Extracts descriptive error message string from Axios errors or unknown thrown exceptions.
 */
export function getErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const axErr = error as { response?: { data?: { message?: string | string[] } } };
    const msg = axErr.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

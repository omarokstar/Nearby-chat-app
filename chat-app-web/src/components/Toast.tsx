import { useToastStore } from '../store/toast';

/**
 * Global toast notification viewport.
 * Renders active success, error, and informational feedback toasts fixed at the top-right corner.
 */
export default function Toast() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 w-84 max-w-[calc(100vw-2.5rem)]"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-slide-down rounded-2xl px-4 py-3.5 shadow-[0px_10px_25px_rgba(0,0,0,0.12)] border text-sm font-medium flex items-start gap-3 backdrop-blur-md
            ${
              t.type === 'success'
                ? 'bg-white/95 dark:bg-[#1a1a1a]/95 border-emerald-200 dark:border-emerald-900/50 text-[#131313] dark:text-white'
                : t.type === 'error'
                ? 'bg-white/95 dark:bg-[#1a1a1a]/95 border-rose-200 dark:border-rose-900/50 text-[#131313] dark:text-white'
                : 'bg-white/95 dark:bg-[#1a1a1a]/95 border-[#E3E3E3] dark:border-[#333] text-[#131313] dark:text-white'
            }
          `}
        >
          {t.type === 'success' && (
            <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shrink-0 text-xs">
              ✓
            </span>
          )}
          {t.type === 'error' && (
            <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 shrink-0 text-xs">
              ✕
            </span>
          )}
          {t.type === 'info' && (
            <span className="w-5 h-5 rounded-full bg-[#EFEFEF] dark:bg-[#252525] flex items-center justify-center text-[#5D5D5D] shrink-0 text-xs">
              i
            </span>
          )}
          <span className="flex-1 leading-snug">{t.message}</span>
          <button
            onClick={() => remove(t.id)}
            className="shrink-0 text-[#868686] hover:text-[#131313] dark:hover:text-white transition-colors text-xs"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

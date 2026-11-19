import { useToastStore } from '../store/toast';

export default function Toast() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-slide-down rounded-xl px-4 py-3 shadow-lg backdrop-blur-md text-sm font-medium flex items-start gap-2
            ${t.type === 'success' ? 'bg-emerald-500/90 text-white' : ''}
            ${t.type === 'error' ? 'bg-rose-500/90 text-white' : ''}
            ${t.type === 'info' ? 'bg-brand-500/90 text-white' : ''}
          `}
        >
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => remove(t.id)}
            className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

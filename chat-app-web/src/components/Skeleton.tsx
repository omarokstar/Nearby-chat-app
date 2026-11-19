interface SkeletonProps {
  className?: string;
  count?: number;
}

export function SkeletonLine({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse-soft rounded-lg bg-slate-200 dark:bg-slate-700 ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/60 dark:bg-slate-800/60">
      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse-soft" />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="h-4 w-1/3" />
        <SkeletonLine className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 5 }: SkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

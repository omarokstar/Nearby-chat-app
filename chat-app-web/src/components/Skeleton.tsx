/**
 * Loading skeleton placeholder components providing smooth visual feedback during data queries.
 */
interface SkeletonProps {
  className?: string;
  count?: number;
}

/** Single animated pulse line placeholder */
export function SkeletonLine({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse-soft rounded-xl bg-[#F0F0F0] dark:bg-[#252525] ${className}`}
    />
  );
}

/** Card-style skeleton representing a user list item with avatar and text lines */
export function SkeletonCard() {
  return (
    <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-[#E3E3E3] dark:border-[#2a2a2a]">
      <div className="w-10 h-10 rounded-full bg-[#F0F0F0] dark:bg-[#252525] animate-pulse-soft shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="h-4 w-1/3" />
        <SkeletonLine className="h-3 w-2/3" />
      </div>
    </div>
  );
}

/** Renders a list of skeleton cards to mirror loading lists */
export function SkeletonList({ count = 5 }: SkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

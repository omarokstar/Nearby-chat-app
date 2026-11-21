import { useEffect, useRef, useState } from 'react';

/**
 * Hook leveraging IntersectionObserver to detect when a sentinel element enters the viewport.
 * Used for triggering automated infinite scroll pagination.
 */
export function useIntersection(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, options);
    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return { ref, isVisible };
}

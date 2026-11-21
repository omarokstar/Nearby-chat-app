import { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/**
 * Accessible Modal dialog wrapper utilizing HTML5 <dialog>.
 * Manages modal focus trap, ESC key dismissal, and backdrop click detection.
 */
export default function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Synchronizes component open prop with native HTML dialog modal state
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // Listens for native modal close event (e.g. Escape key press)
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const handler = () => onClose();
    el.addEventListener('close', handler);
    return () => el.removeEventListener('close', handler);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-black/40 backdrop:backdrop-blur-xs bg-transparent p-0 m-auto max-w-lg w-[calc(100%-2rem)] outline-none"
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#1a1a1a] border border-[#E3E3E3] dark:border-[#2a2a2a] rounded-3xl shadow-2xl p-6 sm:p-8 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[#131313] dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[12px] bg-[#F8F8F8] dark:bg-[#252525] border border-[#E3E3E3] dark:border-[#333] flex items-center justify-center text-[#5D5D5D] dark:text-[#aaa] hover:text-[#131313] dark:hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

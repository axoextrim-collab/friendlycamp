import { useEffect, useRef, type ReactNode } from 'react';
import { restoreDialogFocus } from '../utils/dialogFocus';

/** Native modality keeps background controls out of the keyboard sequence. */
export function DialogSurface({ label, onClose, children, className = '', busy = false }: { label: string; onClose: () => void; children: ReactNode; className?: string; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = ref.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    element?.querySelector<HTMLElement>('[data-dialog-autofocus]')?.focus({ preventScroll: true });
    return () => { element?.close(); document.body.style.overflow = overflow; restoreDialogFocus(previous); };
  }, []);
  return <dialog ref={ref} className={`fc-modal-surface ${className}`} dir="rtl" aria-label={label} tabIndex={-1} onCancel={event => { event.preventDefault(); event.stopPropagation(); if (!busy) onClose(); }} onKeyDown={event => { if (event.key === 'Escape') event.stopPropagation(); }} onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>{children}</dialog>;
}

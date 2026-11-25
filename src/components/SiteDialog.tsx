import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import './site-tools.css';

export function SiteDialog({ title, description = '', onClose, children, drawer = false }: { title: string; description?: string; onClose: () => void; children: React.ReactNode; drawer?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null); const id = useId();
  useEffect(() => { const element = ref.current; const previous = document.activeElement as HTMLElement | null; const fallback=previous?.getAttribute('data-dialog-fallback'); element?.showModal(); element?.querySelector<HTMLElement>('[data-dialog-autofocus]')?.focus({ preventScroll: true }); return () => { element?.close(); if (previous?.isConnected) previous.focus({ preventScroll: true }); else if(fallback)document.querySelector<HTMLElement>(fallback)?.focus({preventScroll:true}); }; }, []);
  return <dialog ref={ref} dir="rtl" className={`fc-tool-dialog${drawer ? ' fc-tool-drawer' : ''}`} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={event => { event.preventDefault(); onClose(); }} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); } }} onClick={event => { if (event.target !== event.currentTarget) return; const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); }}><header className="fc-tool-header"><div><h2 id={`${id}-title`}>{title}</h2><p id={`${id}-description`}>{description}</p></div><button type="button" className="fc-tool-icon" aria-label={`بستن ${title}`} onClick={onClose}><X size={20} /></button></header>{children}</dialog>;
}

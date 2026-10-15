'use client';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useLocale } from '@/lib/i18n';

export function Modal({ open, onClose, title, eyebrow, wide, children }: { open: boolean; onClose: () => void; title: string; eyebrow?: string; wide?: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useLocale();
  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const old = document.body.style.overflow;
    ref.current?.showModal(); document.body.style.overflow = 'hidden';
    return () => { ref.current?.close(); document.body.style.overflow = old; trigger?.focus({ preventScroll: true }); };
  }, [open]);
  return <dialog ref={ref} className={`studio-dialog ${wide ? 'studio-dialog-wide' : ''}`} aria-label={title} onCancel={onClose} onClose={() => { if (!ref.current?.open) onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="studio-modal-head"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label={t('Kapat')} autoFocus><X size={20} /></button></div>
    <div className="studio-modal-body">{children}</div>
  </dialog>;
}

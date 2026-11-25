import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, LoaderCircle, Save, X } from 'lucide-react';

export function Panel({ title, description, children, action, className = '' }: { title: string; description?: string; children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return <section className={`fp-panel ${className}`}><div className="fp-panel-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>{children}</section>;
}

export function Field({ label, hint, children, wide = false }: { label: string; hint?: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={`fp-field ${wide ? 'fp-field-wide' : ''}`}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export function SecretField({ label, autoComplete, name, value, onChange, hint, minLength = 1 }: { label: string; autoComplete: string; name: string; value: string; onChange: (value: string) => void; hint?: string; minLength?: number }) {
  const [visible, setVisible] = useState(false);
  return <div className="fp-field"><label htmlFor={`fp-${name}`}>{label}</label><div className="fp-secret"><input id={`fp-${name}`} name={name} value={value} onChange={event => onChange(event.target.value)} type={visible ? 'text' : 'password'} dir="ltr" required minLength={minLength} maxLength={128} autoComplete={autoComplete} /><button type="button" aria-label={visible ? `پنهان کردن ${label}` : `نمایش ${label}`} aria-pressed={visible} aria-controls={`fp-${name}`} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{hint && <small>{hint}</small>}</div>;
}

export function Toggle({ title, description, checked, onChange }: { key?: React.Key; title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="fp-toggle"><span><strong>{title}</strong><small>{description}</small></span><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} /><i aria-hidden="true" /></label>;
}

export function FormActions({ busy, label = 'ذخیره تغییرات', children }: { busy: boolean; label?: string; children?: React.ReactNode }) {
  return <div className="fp-form-actions"><button className="fp-button fp-button-primary" type="submit" disabled={busy}>{busy ? <LoaderCircle size={17} className="fp-spin" /> : <Save size={16} />}{busy ? 'در حال ثبت…' : label}</button>{children || <span>اطلاعات در حساب کاربری ذخیره می‌شود.</span>}</div>;
}

export function Empty({ icon: Icon, title, text, children }: { icon: React.ElementType; title: string; text: string; children?: React.ReactNode }) {
  return <div className="fp-empty"><span><Icon size={29} strokeWidth={1.3} /></span><h3>{title}</h3><p>{text}</p>{children}</div>;
}

export function ConfirmDialog({ title, text, action, busy, onConfirm, onClose }: { title: string; text: string; action: string; busy: boolean; onConfirm: () => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = ref.current; const previous = document.activeElement as HTMLElement | null; const overflow = document.body.style.overflow;
    element?.showModal(); document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} className="fp-confirm" dir="rtl" aria-labelledby="fp-confirm-title" aria-describedby="fp-confirm-text" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}><button type="button" aria-label="بستن پیام" className="fp-icon-button" disabled={busy} onClick={onClose}><X size={19} /></button><h2 id="fp-confirm-title">{title}</h2><p id="fp-confirm-text">{text}</p><div><button type="button" className="fp-button" disabled={busy} autoFocus onClick={onClose}>انصراف</button><button type="button" className="fp-button fp-button-danger" disabled={busy} onClick={onConfirm}>{busy ? 'در حال انجام…' : action}</button></div></dialog>;
}

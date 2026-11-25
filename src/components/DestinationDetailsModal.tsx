import React, { useEffect, useRef } from 'react';
import { MapPin, X, Leaf } from 'lucide-react';
import type { Destination } from '../types';

interface DestinationDetailsModalProps {
  destination: Destination | null;
  onClose: () => void;
  onRequestInfo: () => void;
}

export function DestinationDetailsModal({ destination, onClose, onRequestInfo }: DestinationDetailsModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!destination) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); previousFocus?.focus({ preventScroll: true }); };
  }, [destination]);

  if (!destination) return null;
  return (
    <dialog ref={dialog} className="iran-destination-dialog" dir="rtl" aria-labelledby="destination-dialog-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="iran-destination-dialog-inner">
        <button type="button" className="iran-destination-close" onClick={onClose} aria-label="بستن معرفی مقصد" autoFocus><X size={21} /></button>
        <div className="iran-destination-dialog-image"><img loading="lazy" decoding="async" src={destination.image} alt={destination.title} data-motion="off" style={{ objectPosition: destination.imagePosition }} /></div>
        <div className="iran-destination-dialog-copy"><p className="iran-destination-category">{destination.categoryLabel}</p><h2 id="destination-dialog-title">{destination.title}</h2><p className="iran-destination-dialog-location"><MapPin size={16} />{destination.province}، ایران</p><p className="iran-destination-dialog-description">{destination.description}</p><h3>چه چیزی اینجا را دیدنی می‌کند؟</h3><ul>{destination.highlights?.map(item => <li key={item}><Leaf size={15} strokeWidth={1.5} />{item}</li>)}</ul><p className="iran-destination-dialog-note">برای اطلاع از برنامه‌های قابل اجرا، زمان حرکت و هزینهٔ سفر به این مقصد، با فرندلی کمپ گفت‌وگو کن.</p><button type="button" className="iran-destination-inquiry" onClick={onRequestInfo}>پرسش دربارهٔ این مقصد</button>
          {destination.imageCredit && <p className="iran-destination-dialog-credit">عکس: <bdi>{destination.imageCredit.author}</bdi> · <a href={destination.imageCredit.source} target="_blank" rel="noreferrer">منبع</a> · <a href={destination.imageCredit.licenseUrl} target="_blank" rel="noreferrer"><bdi>{destination.imageCredit.license}</bdi></a></p>}
        </div>
      </div>
    </dialog>
  );
}

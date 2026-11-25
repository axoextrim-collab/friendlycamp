import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpenText, Camera, FileAudio, Image, Pencil, Plus, Search, Trash2, UploadCloud } from 'lucide-react';
import { profileApi, type TravelProfile } from '../../api/profile';
import { profileDate, validateMediaFile } from '../../utils/profileForm';
import { Empty, Field, FormActions, Panel } from './ProfileUI';

export type Story = TravelProfile['stories'][number];
export type StoryDraft = { id?: string; title: string; destination: string; date: string; body: string };
export const emptyStory = (): StoryDraft => ({ title: '', destination: '', date: '', body: '' });

export function StoriesPanel({ profile, onEdit, onNew, onDelete }: { profile: TravelProfile; onEdit: (story: Story) => void; onNew: () => void; onDelete: (story: Story) => void }) {
  const [query, setQuery] = useState('');
  const stories = profile.stories.filter(story => `${story.title} ${story.destination}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <Panel title="دفتر سفر تو" description="این روایت‌ها در حساب شخصی ذخیره می‌شوند و انتشار عمومی ندارند." action={<button className="fp-button fp-button-primary" type="button" onClick={onNew}><Plus size={16} />سفرنامه تازه</button>}>
    <label className="fp-search"><Search size={17} /><input type="search" aria-label="جستجوی سفرنامه" placeholder="جستجو در عنوان یا مقصد" value={query} onChange={event => setQuery(event.target.value)} /></label>
    {!stories.length ? <Empty icon={BookOpenText} title={profile.stories.length ? 'سفرنامه‌ای پیدا نشد' : 'اولین صفحه هنوز سفید است.'} text={profile.stories.length ? 'عنوان یا مقصد دیگری را جستجو کن.' : 'از یک مسیر، یک لحظه یا یک تجربه به‌یادماندنی بنویس.'}>{!profile.stories.length && <button className="fp-button" type="button" onClick={onNew}>شروع نوشتن<ArrowLeft size={15} /></button>}</Empty> : <div className="fp-story-list">{stories.map(story => <article key={story.id}><div className="fp-story-meta"><span>{story.destination || 'مقصد ثبت نشده'}</span><span>{profileDate(story.date || story.createdAt, profile.settings.preferences.calendar)}</span><span className="fp-badge">ذخیره‌شده در حساب</span></div><h3>{story.title}</h3><p>{story.body}</p><div><button className="fp-button" type="button" onClick={() => onEdit(story)}><Pencil size={14} />خواندن و ویرایش</button><button className="fp-icon-button fp-danger-text" type="button" onClick={() => onDelete(story)} aria-label={`حذف سفرنامه ${story.title}`}><Trash2 size={16} /></button></div></article>)}</div>}
  </Panel>;
}

export function StoryForm({ draft, onChange, onSave, busy, onList }: { draft: StoryDraft; onChange: (draft: StoryDraft) => void; onSave: () => Promise<void>; busy: boolean; onList: () => void }) {
  const update = (key: keyof StoryDraft, value: string) => onChange({ ...draft, [key]: value });
  return <Panel title={draft.id ? 'ویرایش سفرنامه' : 'یک روایت تازه از سفر'} description="تا وقتی ذخیره نکنی، متن فقط در همین پنل باز می‌ماند. محتوای ذخیره‌شده انتشار عمومی ندارد."><form onSubmit={event => { event.preventDefault(); void onSave(); }}><fieldset disabled={busy}><div className="fp-fields"><Field label="عنوان سفرنامه" wide><input required minLength={2} maxLength={160} value={draft.title} onChange={event => update('title', event.target.value)} placeholder="مثلاً: صبحی که جنگل از خواب بیدار شد" /></Field><Field label="مقصد"><input maxLength={120} value={draft.destination} onChange={event => update('destination', event.target.value)} placeholder="نام شهر، منطقه یا مسیر" /></Field><Field label="تاریخ سفر (اختیاری)"><input type="date" value={draft.date} onChange={event => update('date', event.target.value)} /></Field><Field label="روایت سفر" wide hint={`${draft.body.length.toLocaleString('fa-IR')} از ۱۰٬۰۰۰ نویسه؛ دست‌کم ۱۰ نویسه`}><textarea rows={12} required minLength={10} maxLength={10000} value={draft.body} onChange={event => update('body', event.target.value)} placeholder="از جایی شروع کن که هنوز در خاطرت مانده…" /></Field></div></fieldset><FormActions busy={busy} label="ذخیره سفرنامه در حساب"><button type="button" className="fp-text-button" disabled={busy} onClick={onList}>فهرست سفرنامه‌ها</button></FormActions></form></Panel>;
}

type Media = TravelProfile['media'][number];
function safeMediaUrl(value: string) {
  if (/^\/uploads\/[A-Za-z0-9._-]+$/.test(value)) return value;
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; }
}

export function MediaPanel({ profile, busy, onSave, onDelete, reportError, onDraftChange }: { profile: TravelProfile; busy: boolean; onSave: (media: Media[], upload: () => Promise<Media>) => Promise<boolean>; onDelete: (media: Media) => void; reportError: (message: string) => void; onDraftChange: (dirty: boolean) => void }) {
  const [title, setTitle] = useState(''); const [file, setFile] = useState<File | null>(null); const [filter, setFilter] = useState<'all' | 'photo' | 'podcast'>('all');
  const [preview, setPreview] = useState(''); const uploadedRef = useRef<Media | null>(null); const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { onDraftChange(Boolean(title || file)); }, [title, file, onDraftChange]);
  useEffect(() => {
    setPreview('');
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(typeof reader.result === 'string' ? reader.result : '');
    reader.readAsDataURL(file);
    return () => { if (reader.readyState === FileReader.LOADING) reader.abort(); };
  }, [file]);
  const rows = profile.media.filter(item => filter === 'all' || item.kind === filter);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (!file) return reportError('یک فایل انتخاب کن.');
    if (!title.trim()) return reportError('عنوان فایل را وارد کن.');
    const error = validateMediaFile(file); if (error) return reportError(error);
    const success = await onSave(profile.media, async () => {
      if (!uploadedRef.current) {
        const response = await profileApi.upload(file);
        uploadedRef.current = { id: crypto.randomUUID(), kind: file.type.startsWith('audio/') ? 'podcast' : 'photo', title: title.trim(), url: response.url, mimeType: response.mimeType, createdAt: new Date().toISOString() };
      }
      return { ...uploadedRef.current, title: title.trim() };
    });
    if (success) { setTitle(''); setFile(null); uploadedRef.current = null; if (inputRef.current) inputRef.current.value = ''; }
  }
  return <div className="fp-stack"><Panel title="یک تکه از سفر را نگه دار" description="عکس یا فایل صوتی، حداکثر ۱۲ مگابایت. فایل‌ها با حساب ذخیره می‌شوند و در صفحه اصلی منتشر نمی‌شوند."><form onSubmit={submit}><fieldset disabled={busy}><div className="fp-upload-layout"><label className="fp-upload"><input ref={inputRef} type="file" required aria-label="انتخاب عکس یا پادکست" accept="image/jpeg,image/png,image/webp,audio/mpeg,audio/wav,audio/ogg,audio/mp4" onChange={event => { const selected = event.target.files?.[0] || null; uploadedRef.current = null; if (selected) { const error = validateMediaFile(selected); if (error) { reportError(error); event.target.value = ''; setFile(null); return; } } setFile(selected); }} />{preview ? <img loading="lazy" decoding="async" src={preview} alt="پیش‌نمایش فایل انتخابی" /> : file ? <FileAudio size={35} strokeWidth={1.3} /> : <UploadCloud size={35} strokeWidth={1.3} />}<strong>{file ? file.name : 'انتخاب فایل از دستگاه'}</strong><small>{file ? `${(file.size / 1024 / 1024).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} مگابایت` : 'JPG · PNG · WebP · MP3 · WAV · OGG · M4A'}</small></label><div><Field label="عنوان فایل"><input value={title} onChange={event => setTitle(event.target.value)} required maxLength={120} placeholder="یک عنوان کوتاه و مشخص" /></Field><p className="fp-muted fp-spaced">فقط فایل‌هایی را بارگذاری کن که اجازه نگهداری و استفاده از آن‌ها را داری.</p></div></div></fieldset><FormActions busy={busy} label="بارگذاری و ذخیره در حساب" /></form></Panel>
    <Panel title="رسانه‌های من" description={`${profile.media.length.toLocaleString('fa-IR')} فایل در حساب`}><div className="fp-segmented" role="group" aria-label="نوع رسانه">{([['all', 'همه فایل‌ها'], ['photo', 'عکس‌ها'], ['podcast', 'پادکست‌ها']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>{!rows.length ? <Empty icon={Camera} title="فایلی در این فهرست نیست" text="پس از بارگذاری موفق، فایل‌ها در این بخش نمایش داده می‌شوند." /> : <div className="fp-media-grid">{rows.map(item => <article key={item.id}><div className="fp-media-preview">{item.kind === 'photo' && safeMediaUrl(item.url) ? <img decoding="async" src={safeMediaUrl(item.url)} alt={item.title} loading="lazy" onError={event => { event.currentTarget.style.visibility = 'hidden'; }} /> : <FileAudio size={35} strokeWidth={1.3} />}{item.kind === 'podcast' && safeMediaUrl(item.url) && <audio controls preload="none" src={safeMediaUrl(item.url)} aria-label={item.title} />}</div><div className="fp-media-caption"><div><h3>{item.title}</h3><small>{profileDate(item.createdAt, profile.settings.preferences.calendar)}</small></div><button className="fp-icon-button fp-danger-text" type="button" disabled={busy} onClick={() => onDelete(item)} aria-label={`حذف ${item.title} از فهرست حساب`}><Trash2 size={16} /></button></div>{safeMediaUrl(item.url) && <a className="fp-media-link" href={safeMediaUrl(item.url)} target="_blank" rel="noopener noreferrer">باز کردن فایل<ArrowLeft size={13} /></a>}</article>)}</div>}</Panel>
  </div>;
}

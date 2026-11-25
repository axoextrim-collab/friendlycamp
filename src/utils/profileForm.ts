import type { TravelProfile } from '../api/profile';

export function profileChecklist(profile: TravelProfile) {
  return [
    { id: 'contact' as const, title: 'مشخصات فردی', description: 'شهر محل سکونت و تاریخ تولد', done: Boolean(profile.city.trim() && profile.birthDate) },
    { id: 'contact' as const, title: 'تماس اضطراری', description: 'شماره فردی که در مواقع ضروری پاسخ‌گو باشد', done: Boolean(profile.emergencyContact.trim()) },
    { id: 'interests' as const, title: 'علاقه‌مندی‌های سفر', description: 'حداقل یک سبک یا فعالیت مورد علاقه', done: profile.interests.length > 0 },
    { id: 'equipment' as const, title: 'تجهیزات همراه', description: 'وسایلی که در سفر همراه داری', done: Boolean(profile.professional.equipmentNotes.trim()) },
  ];
}

export function profileCompletion(profile: TravelProfile) {
  const checklist = profileChecklist(profile);
  return Math.round(checklist.filter(item => item.done).length / checklist.length * 100);
}

export function safeCsvCell(value: string | number) {
  const text = String(value);
  const safe = /^[\s]*[=+@\-\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function walletCsv(transactions: TravelProfile['wallet']['transactions']) {
  return '\uFEFF' + [['reference', 'date', 'title', 'type', 'amount', 'status'], ...transactions.map(item => [item.reference, item.date, item.title, item.type, item.amount, item.status])].map(row => row.map(safeCsvCell).join(',')).join('\r\n');
}

export function validateMediaFile(file: Pick<File, 'size' | 'type'>): string | null {
  if (!['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'].includes(file.type)) return 'فایل JPG، PNG، WebP یا فایل صوتی MP3، WAV، OGG یا M4A انتخاب کن.';
  if (!file.size || file.size > 12 * 1024 * 1024) return 'حجم فایل باید بیشتر از صفر و حداکثر ۱۲ مگابایت باشد.';
  return null;
}

export function profileDate(value: string, calendar: 'jalali' | 'gregorian' = 'jalali') {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'ثبت نشده';
  return new Intl.DateTimeFormat(calendar === 'jalali' ? 'fa-IR' : 'fa-IR-u-ca-gregory', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Tehran' }).format(new Date(value));
}

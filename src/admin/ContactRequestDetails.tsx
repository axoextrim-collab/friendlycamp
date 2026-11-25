import React from 'react';
import type { AdminRecord } from './adminApi';

export function ContactRequestDetails({ record }: { record: AdminRecord }) {
  return <section className="mt-5 rounded-[26px] border bg-white p-5"><h4 className="text-sm font-black">درخواست ثبت‌شده از صفحه تماس</h4><dl className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-slate-400">شماره تماس</dt><dd className="mt-1"><a href={`tel:${String(record.phone || '')}`}><bdi>{String(record.phone || '—')}</bdi></a></dd></div><div><dt className="text-slate-400">ایمیل</dt><dd className="mt-1 break-words"><bdi>{String(record.email || 'ثبت نشده')}</bdi></dd></div><div><dt className="text-slate-400">تاریخ ثبت</dt><dd className="mt-1">{new Date(String(record.createdAt || record.updatedAt)).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })}</dd></div></dl><p className="mt-5 whitespace-pre-wrap break-words border-t pt-4 text-sm leading-8 text-slate-700">{String(record.message || record.description || '')}</p></section>;
}

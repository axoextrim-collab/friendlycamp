import React, { useEffect, useState } from 'react';

export function PendingScreen() {
  const [expired, setExpired] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => setExpired(true), 20_000); return () => window.clearTimeout(timer); }, []);
  return <div dir="rtl" className="grid min-h-[70vh] place-items-center bg-[#edf3ee] p-6 text-[#14241f]"><div role={expired ? 'alert' : 'status'} className="max-w-md text-center"><p className="text-base leading-8">{expired ? 'دریافت صفحه طول کشید. اتصال را بررسی کن و دوباره تلاش کن.' : 'در حال دریافت صفحه…'}</p>{expired && <div className="mt-5 flex flex-wrap justify-center gap-3"><button type="button" className="min-h-11 rounded-xl bg-[#0c443b] px-5 text-white" onClick={() => window.location.reload()}>دوباره تلاش کن</button><a className="inline-flex min-h-11 items-center px-4" href="tel:09215014474">تماس با پشتیبانی</a></div>}</div></div>;
}

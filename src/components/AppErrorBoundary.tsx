import React from 'react';

export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  declare props: Readonly<{ children: React.ReactNode }>;
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) { console.error('Application render failure', error, info.componentStack); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="min-h-screen grid place-items-center bg-slate-50 p-6" dir="rtl"><section role="alert" className="max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl"><h1 className="text-xl font-black text-slate-900">نمایش صفحه با مشکل روبه‌رو شد</h1><p className="mt-3 text-sm text-slate-600">اطلاعات شما حذف نشده است. صفحه را دوباره بارگذاری کنید و اگر مشکل ادامه داشت با پشتیبانی تماس بگیرید.</p><button type="button" className="mt-6 rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white" onClick={() => location.reload()}>بارگذاری دوباره</button></section></main>;
  }
}

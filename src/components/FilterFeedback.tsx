import type { ReactNode } from 'react';
import { AlertCircle, Check, LoaderCircle, RotateCcw, Search } from 'lucide-react';
import './filter-feedback.css';

export function FilterSummary({ labels, onReset, onRefresh, loading = false }: { labels: string[]; onReset: () => void; onRefresh?: () => void; loading?: boolean }) {
  return <div className="fc-filter-summary"><p><Check size={17} aria-hidden="true"/><span>{labels.length ? `انتخاب‌ها: ${labels.join(' · ')}` : 'همهٔ گزینه‌ها؛ بدون فیلتر'}</span></p><div><button type="button" onClick={onReset} disabled={!labels.length}><RotateCcw size={16} aria-hidden="true"/>بازنشانی فیلترها</button>{onRefresh && <button type="button" onClick={onRefresh} disabled={loading}>{loading ? 'در حال دریافت…' : 'تازه‌سازی نتایج'}</button>}</div></div>;
}

export function FilterResults({ id, loading = false, error = '', count, filtered = false, emptyTitle = 'نتیجه‌ای با این انتخاب‌ها پیدا نشد.', emptyText = 'فیلترها را تغییر بده یا به همهٔ گزینه‌ها برگرد.', onReset, onRetry, emptyActions, children }: { id?: string; loading?: boolean; error?: string; count: number; filtered?: boolean; emptyTitle?: string; emptyText?: string; onReset?: () => void; onRetry?: () => void; emptyActions?: ReactNode; children?: ReactNode }) {
  const state = loading ? 'loading' : error ? 'error' : count === 0 ? 'empty' : 'ready';
  return <div id={id} className="fc-filter-results" data-state={state} aria-busy={loading}>
    {state === 'loading' ? <div className="fc-filter-feedback" role="status"><LoaderCircle size={28} aria-hidden="true"/><h3>در حال دریافت نتایج…</h3><p>نتیجه‌ها پس از دریافت اطلاعات نمایش داده می‌شوند.</p></div>
      : state === 'error' ? <div className="fc-filter-feedback is-error" role="alert"><AlertCircle size={28} aria-hidden="true"/><h3>دریافت نتایج انجام نشد.</h3><p>{error}</p>{onRetry && <button type="button" onClick={onRetry}>تلاش دوباره</button>}</div>
      : state === 'empty' ? <div className="fc-filter-feedback" role="status"><Search size={28} aria-hidden="true"/><h3>{emptyTitle}</h3><p>{emptyText}</p><div className="fc-filter-empty-actions">{emptyActions}{filtered && onReset && <button type="button" onClick={onReset}>بازنشانی و نمایش همه</button>}</div></div> : children}
  </div>;
}

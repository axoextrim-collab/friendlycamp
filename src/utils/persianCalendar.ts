const partsFormatter = new Intl.DateTimeFormat('en-US-u-ca-persian', { year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC' });
const monthCache = new Map<string, Date[]>();
export const WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
export const persianNumber = (value: number) => value.toLocaleString('fa-IR', { useGrouping: false });

/** Resolve actual dates, month length and weekdays via Intl's Persian calendar. */
export function getPersianMonth(year: number, month: number): Date[] {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) throw new RangeError('Invalid Persian month');
  const key = `${year}-${month}`;
  const cached = monthCache.get(key);
  if (cached) return cached;
  const dates: Date[] = [];
  for (let offset = 0; offset < 450; offset++) {
    const date = new Date(Date.UTC(year + 621, 0, 1 + offset, 12));
    const parts = partsFormatter.formatToParts(date);
    const part = (name: string) => Number(parts.find(item => item.type === name)?.value);
    if (part('year') === year && part('month') === month) dates.push(date);
    else if (dates.length) break;
  }
  if (!dates.length) throw new RangeError('Persian month outside supported date range');
  monthCache.set(key, dates);
  return dates;
}

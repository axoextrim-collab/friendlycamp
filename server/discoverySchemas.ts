import { z } from 'zod';
const text = (max = 500) => z.string().trim().max(max);
const required = (max = 500) => text(max).min(2);
const url = z.string().max(1000).refine(value => {
    try {
        return ['https:', 'http:'].includes(new URL(value).protocol);
    }
    catch {
        return false;
    }
}, 'نشانی کامل و معتبر وارد کن.');
const date = z.union([z.literal(''), z.string().datetime()]);
export const leaderSchema = z.object({ name: required(100), bio: required(6000), qualifications: required(4000), image: z.union([z.literal(''), z.string().regex(/^\/(images|uploads)\/[\w./-]+$/).refine(value => !value.includes('..'))]), languages: z.array(text(80)).max(15), credentials: z.array(z.object({ title: required(200), issuer: required(200), number: required(150), source: url, validUntil: date, noExpiry: z.boolean() }).strict().refine(value => !!value.validUntil || value.noExpiry, 'تاریخ اعتبار یا تصریح بدون انقضا را ثبت کن.')).min(1).max(30), status: z.enum(['draft', 'review', 'published', 'archived']) }).strict();
export const routeSchema = z.object({ points: z.array(z.object({ lat: z.number().min(-85.0511).max(85.0511), lng: z.number().min(-180).max(180), elevation: z.number().min(-500).max(9000).optional() }).strict()).max(2000), sourceLabel: text(1000), sourceUrl: z.union([z.literal(''), url]), assessedBy: text(200), method: text(3000), assessedAt: date, validUntil: date, assessments: z.array(z.object({ from: z.number().int().min(0), to: z.number().int().min(1), level: z.enum(['low', 'caution', 'restricted']), note: required(2000), source: url }).strict()).max(200) }).strict().superRefine((value, context) => {
    if (value.points.length === 1 || value.points.length > 0 && value.sourceLabel.length < 3)
        context.addIssue({ code: 'custom', message: 'مسیر به حداقل دو نقطه و شرح منبع GPS نیاز دارد.' });
    if (value.assessments.length && (!value.assessedBy || !value.method || !value.assessedAt || !value.validUntil || Date.parse(value.validUntil) <= Date.parse(value.assessedAt)))
        context.addIssue({ code: 'custom', message: 'ارزیابی مسیر به مسئول، روش، زمان و پایان اعتبار نیاز دارد.' });
    const used = new Set<number>();
    for (const item of value.assessments) {
        if (item.to <= item.from || item.to >= value.points.length)
            context.addIssue({ code: 'custom', message: 'بازه نقاط ارزیابی معتبر نیست.' });
        for (let edge = item.from; edge < item.to; edge++) {
            if (used.has(edge))
                context.addIssue({ code: 'custom', message: 'ارزیابی‌های مسیر نباید روی هم بیفتند.' });
            used.add(edge);
        }
    }
});

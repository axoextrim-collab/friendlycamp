import { z } from 'zod';
import { leaderSchema, routeSchema } from './discoverySchemas';
import { normalizePhone } from '../src/utils/authForm';
import { POLICY_KEYS } from '../src/types/travel';
const text = (max = 200) => z.string().trim().max(max);
const required = (max = 200) => text(max).min(2);
const url = text(1000).refine(value => {
    try {
        return ['https:', 'http:'].includes(new URL(value).protocol);
    }
    catch {
        return false;
    }
}, 'نشانی کامل http یا https وارد کن.');
const image = text(1000).refine(value => /^\/(images|uploads)\/[\w./-]+$/.test(value) && !value.includes('..') || /^https:\/\/images\.unsplash\.com\//.test(value), 'تصویر معتبر انتخاب کن.');
const publication = z.enum(['draft', 'review', 'published', 'archived']);
const strings = z.array(text(500)).max(50);
const weather = { weatherEnabled: z.boolean().default(false), temperature: z.number().min(-70).max(65).nullable().default(null), condition: text(150).default(''), weatherSource: z.union([z.literal(''), url]).default(''), observedAt: z.union([z.literal(''), z.string().datetime()]).default(''), expiresAt: z.union([z.literal(''), z.string().datetime()]).default('') };
const optionalDate = z.union([z.literal(''), z.string().datetime()]).default('');
const travelSchema = z.object({ leaderId: text(100).default(''), difficulty: z.enum(['', 'easy', 'moderate', 'hard', 'very_hard']).default(''), fitnessRequirements: text(4000).default(''), equipment: strings.default([]), minAge: z.number().int().min(0).max(120).nullable().default(null), maxAge: z.number().int().min(0).max(120).nullable().default(null), ageConditions: text(2000).default(''), medicalRestrictions: text(4000).default(''), leaderName: text().default(''), leaderQualifications: text(4000).default(''), leaderIssuer: text().default(''), leaderCredential: text().default(''), leaderSource: z.union([z.literal(''), url]).default(''), faqs: z.array(z.object({ question: required(500), answer: required(5000) }).strict()).max(40).default([]), insurance: z.object({ provider: text().default(''), policyNumber: text().default(''), coverage: text(4000).default(''), exclusions: text(4000).default(''), validFrom: optionalDate, validUntil: optionalDate, source: z.union([z.literal(''), url]).default('') }).strict().default({ provider: '', policyNumber: '', coverage: '', exclusions: '', validFrom: '', validUntil: '', source: '' }) }).strict().superRefine((value, ctx) => {
    if (value.minAge !== null && value.maxAge !== null && value.minAge > value.maxAge)
        ctx.addIssue({ code: 'custom', message: 'حداقل سن نباید بیشتر از حداکثر سن باشد.' });
});
export const controlSchemas = {
    leaders: leaderSchema,
    tours: z.object({ title: required(), code: required(80), destination: required(), country: required(80).default('ایران'), durationDays: z.number().int().min(1).max(365), summary: required(6000), heroImage: image, gallery: z.array(z.object({ url: image, alt: required(200), credit: text(), source: z.union([z.literal(''), url]) }).strict()).max(30).default([]), included: text(4000).default(''), excluded: text(4000).default(''), itinerary: z.array(z.object({ title: required(), description: required(4000) }).strict()).max(60).default([]), leader: text(), travel: travelSchema.optional(), route: routeSchema.optional(), status: publication }).strict(),
    destinations: z.object({ title: required(), country: required().default('ایران'), province: required(), city: required(), category: z.enum(['forest', 'coast', 'desert', 'water', 'mountain']), categoryLabel: required(), image, description: required(6000), highlights: strings.default([]), status: publication, ...weather }).strict().superRefine((value, ctx) => {
        if (value.weatherEnabled && (!value.weatherSource || value.temperature === null || !value.condition || !value.observedAt || !value.expiresAt || Date.parse(value.expiresAt) <= Date.parse(value.observedAt) || Date.parse(value.expiresAt) - Date.parse(value.observedAt) > 7 * 86400000))
            ctx.addIssue({ code: 'custom', message: 'آب‌وهوا به منبع، دما، شرح، زمان مشاهده و اعتبار حداکثر هفت‌روزه نیاز دارد.' });
    }),
    authors: z.object({ name: required(100), bio: text(2000), status: z.enum(['active', 'inactive']) }).strict(),
    articles: z.object({ title: required(), slug: required(160).regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/), category: required(100), summary: required(2000), image, imageAlt: required(), authorId: required(100), publishedAt: z.string().datetime(), sections: z.array(z.object({ title: required(), body: required(15000) }).strict()).min(1).max(50), status: publication }).strict(),
    comments: z.object({ status: z.enum(['pending', 'published', 'rejected']), moderationNote: text(2000) }).strict(),
    coupons: z.object({ title: required(), code: z.string().trim().toUpperCase().min(3).max(40).regex(/^[A-Z0-9_-]+$/), kind: z.enum(['percent', 'fixed']), value: z.number().int().min(1).max(1000000000), minAmount: z.number().int().min(0).max(1000000000), maxUses: z.number().int().min(1).max(1000000), validFrom: z.string().datetime(), validUntil: z.string().datetime(), tourIds: z.array(z.string().max(100)).max(100), enabled: z.boolean() }).strict().superRefine((value, ctx) => {
        if (value.kind === 'percent' && value.value > 80 || Date.parse(value.validUntil) <= Date.parse(value.validFrom))
            ctx.addIssue({ code: 'custom', message: 'درصد حداکثر ۸۰ و پایان اعتبار پس از آغاز آن است.' });
    }),
    licenses: z.object({ title: required(), issuer: required(), number: required(), holder: required(), scope: required(2000), source: url, expiresAt: z.union([z.literal(''), z.string().datetime()]), status: publication }).strict(),
    contact: z.object({ title: required(), phone: z.string().transform(normalizePhone).pipe(z.string().regex(/^09\d{9}$/)), email: z.union([z.literal(''), z.email()]), address: text(2000), hours: text(500) }).strict(),
    social: z.object({ title: required(), network: z.enum(['instagram', 'linkedin', 'facebook', 'twitter', 'telegram', 'youtube']), url, enabled: z.boolean() }).strict().superRefine((value, ctx) => {
        const domains: Record<string, string[]> = { instagram: ['instagram.com'], linkedin: ['linkedin.com'], facebook: ['facebook.com'], twitter: ['twitter.com', 'x.com'], telegram: ['t.me', 'telegram.me'], youtube: ['youtube.com', 'youtu.be'] };
        const parsed = new URL(value.url);
        const host = parsed.hostname.replace(/^www\./, '');
        if (!domains[value.network].includes(host) || parsed.pathname === '/' || parsed.hash)
            ctx.addIssue({ code: 'custom', message: 'نشانی مستقیم حساب همان شبکه و بدون # وارد کن.' });
    }),
    policies: z.object({ kind: z.enum(POLICY_KEYS), title: required(), body: required(30000), effectiveAt: optionalDate, approvedForSale: z.boolean(), organizationName: text(), registrationNumber: text(), status: publication }).strict().superRefine((value, ctx) => {
        if (value.status === 'published' && !value.effectiveAt)
            ctx.addIssue({ code: 'custom', message: 'تاریخ شروع اعتبار سند را ثبت کن.' });
        if (value.kind === 'legal' && value.approvedForSale && (!value.organizationName || !value.registrationNumber))
            ctx.addIssue({ code: 'custom', message: 'نام برگزارکننده و شناسه ثبت یا فعالیت را تکمیل کن.' });
    }),
    homeText: z.object({ value: text(6000), status: publication.default('draft') }).strict(),
};
export const recordEnvelope = z.object({ values: z.record(z.string(), z.unknown()), expectedRevision: z.string().max(100).nullable() }).strict();
export const commentSubmission = z.object({ targetType: z.enum(['tour', 'article']), targetId: z.string().min(1).max(100), body: required(3000), consent: z.literal(true) }).strict();

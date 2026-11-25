import { z } from 'zod';
import { normalizePhone } from '../src/utils/authForm';
const id = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
const money = z.number().int().min(0).max(1000000000);
const option = z.object({ id, title: z.string().trim().min(2).max(100), price: money }).strict();
export const departureSchema = z.object({
    id: id.optional(), tourId: id, startsAt: z.string().datetime({ offset: true }), capacity: z.number().int().min(1).max(1000), externalSold: z.number().int().min(0).max(1000), price: money.min(1000), active: z.boolean(), movementStatus: z.enum(['scheduled', 'confirmed', 'cancelled', 'completed']).optional(),
    returnAt: z.union([z.literal(''), z.string().datetime({ offset: true })]).optional(), returnPoint: z.string().trim().max(300).optional(), cancellationDetails: z.string().trim().max(6000).optional(),
    origins: z.array(option.extend({ meetingPoint: z.string().trim().max(300).optional(), departureTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).optional() })).min(1).max(15), tents: z.array(option.extend({ capacity: z.number().int().min(1).max(20) })).min(1).max(15), extras: z.array(option.extend({ maxQuantity: z.number().int().min(1).max(100) })).max(30),
    groupDiscount: z.object({ minimum: z.number().int().min(2).max(20), percent: z.number().int().min(0).max(80) }).strict(),
    cancellation: z.object({ enabled: z.boolean(), cutoffHours: z.number().int().min(0).max(8760), feePercent: z.number().int().min(0).max(100) }).strict(), revision: z.string().max(80).optional(),
}).strict().superRefine((value, context) => {
    if (value.externalSold > value.capacity)
        context.addIssue({ code: 'custom', message: 'فروش بیرونی بیشتر از ظرفیت است.' });
    for (const group of [value.origins, value.tents, value.extras])
        if (new Set(group.map(item => item.id)).size !== group.length)
            context.addIssue({ code: 'custom', message: 'شناسه گزینه‌ها نباید تکراری باشد.' });
});
export const selectionSchema = z.object({ couponCode: z.string().trim().toUpperCase().min(3).max(40).regex(/^[A-Z0-9_-]+$/).optional(), departureId: id, guests: z.number().int().min(1).max(20), originId: id, tentId: id, extras: z.array(z.object({ id, quantity: z.number().int().min(1).max(100) }).strict()).max(30) }).strict().refine(value => new Set(value.extras.map(item => item.id)).size === value.extras.length, 'خدمت تکراری مجاز نیست.');
const digits = (value: string) => value.replace(/[۰-۹٠-٩]/g, digit => String(digit.charCodeAt(0) - (digit >= '۰' ? 1776 : 1632)));
export const passengerSchema = z.object({ fullName: z.string().trim().min(3).max(100), birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value && Date.parse(value) < Date.now(), 'تاریخ تولد معتبر نیست.').optional(), nationalCode: z.string().transform(digits).pipe(z.string().regex(/^\d{10}$/)).refine(code => {
        if (/^(\d)\1+$/.test(code))
            return false;
        const sum = code.slice(0, 9).split('').reduce((sum, digit, index) => sum + Number(digit) * (10 - index), 0) % 11;
        return Number(code[9]) === (sum < 2 ? sum : 11 - sum);
    }, 'کد ملی معتبر نیست.') }).strict();
export const reservationSchema = z.object({ selection: selectionSchema, quoteRevision: z.string().length(64), passengers: z.array(passengerSchema).min(1).max(20), contact: z.object({ fullName: z.string().trim().min(3).max(100), phone: z.string().max(25).transform(normalizePhone).pipe(z.string().regex(/^09\d{9}$/)), email: z.union([z.literal(''), z.string().trim().toLowerCase().email().max(254)]) }).strict(), consent: z.literal(true), requestKey: z.string().uuid() }).strict().superRefine((value, context) => {
    if (value.passengers.length !== value.selection.guests || new Set(value.passengers.map(item => item.nationalCode)).size !== value.passengers.length)
        context.addIssue({ code: 'custom', message: 'تعداد یا کد ملی مسافران صحیح نیست.' });
});
export const bookingAccessSchema = z.object({ reference: z.string().regex(/^FCB-[A-F0-9]{16}$/), token: z.string().min(40).max(100) }).strict();
export const paymentAccessSchema = bookingAccessSchema.extend({ paymentId: z.string().uuid() });
export const sandboxResultSchema = paymentAccessSchema.extend({ result: z.enum(['paid', 'failed', 'cancelled']) });

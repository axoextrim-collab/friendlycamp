import crypto from 'node:crypto';
import { z } from 'zod';
import { normalizePhone } from '../src/utils/authForm';
import { createAdminRecord } from './adminStore';
export const contactRequestSchema = z.object({
    fullName: z.string().trim().min(3).max(100),
    phone: z.string().max(25).transform(normalizePhone).pipe(z.string().regex(/^09\d{9}$/)),
    email: z.union([z.literal(''), z.string().trim().toLowerCase().email().max(254)]).default(''),
    subject: z.string().trim().min(3).max(180),
    message: z.string().trim().min(10).max(3000),
    consent: z.literal(true),
}).strict();
export async function saveContactRequest(input: z.infer<typeof contactRequestSchema>) {
    const reference = `FC-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    await createAdminRecord('tickets', { reference, subject: input.subject, customer: input.fullName, phone: input.phone, email: input.email, message: input.message, description: input.message, channel: 'website', status: 'open', priority: 'normal', owner: 'تخصیص‌نیافته', consentAt: new Date().toISOString() }, 'website-contact');
    return reference;
}

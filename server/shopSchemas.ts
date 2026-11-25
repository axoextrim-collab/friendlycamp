import { z } from 'zod';
import { normalizePhone } from '../src/utils/authForm';
const text = (max: number) => z.string().trim().max(max);
const cartItem = z.object({ productId: z.string().min(1).max(120), quantity: z.number().int().min(1).max(9) }).strict();
export const shopCartSchema = z.object({ items: z.array(cartItem).min(1).max(30) }).strict();
export const shopCustomerSchema = z.object({
    fullName: text(100).min(3), phone: z.string().transform(normalizePhone).pipe(z.string().regex(/^09\d{9}$/)), email: text(254).toLowerCase().pipe(z.email().or(z.literal(''))),
    province: text(60).min(2), city: text(100).min(2), address: text(500).min(10), postalCode: z.string().transform(normalizePhone).pipe(z.string().regex(/^\d{10}$/)), notes: text(1000),
}).strict();
export const shopOrderSchema = shopCartSchema.extend({ customer: shopCustomerSchema, consent: z.literal(true), quoteRevision: z.string().regex(/^[a-f0-9]{64}$/), requestKey: z.uuid() }).strict();
export const shopTrackingSchema = z.object({ reference: z.string().min(10).max(60), trackingToken: z.string().min(20).max(100) }).strict();
export const shopOrderUpdateSchema = z.object({ status: z.enum(['awaiting_confirmation', 'confirmed', 'preparing', 'dispatched', 'completed', 'cancelled']), note: text(500), trackingNumber: text(100) }).strict();
export const shopInventorySchema = z.object({
    id: z.string().max(120).optional(), sku: text(80).min(2), title: text(200).min(3), category: z.enum(['shelter', 'sleep', 'packs', 'kitchen', 'lighting', 'trail']),
    brand: text(80), model: text(100), price: z.number().int().min(1).max(1e12).nullable(), stock: z.number().int().min(0).max(1e6).nullable(),
    status: z.enum(['active', 'inactive']), image: text(500).refine(value => !value || (/^\/(images|uploads)\/[A-Za-z0-9_./-]+$/.test(value) && !value.includes('..'))), description: text(2000),
    warranty: text(2000).default(''), salesEnabled: z.boolean().default(false),
}).strict();

import { z } from 'zod';
const phone = z.string().regex(/^09\d{9}$/, 'شماره همراه معتبر نیست');
export const registerSchema = z.object({
    fullName: z.string().trim().min(3).max(100), phone,
    email: z.string().trim().email().max(254), nationalCode: z.string().regex(/^\d{10}$/).optional().or(z.literal('')),
    password: z.string().min(10).max(128).regex(/[A-Za-z]/).regex(/\d/), agreeTerms: z.literal(true)
});
export const loginSchema = z.object({ identifier: z.string().trim().min(3).max(254), password: z.string().min(1).max(128), remember: z.boolean().optional() });
export const accountSchema = registerSchema.omit({ password: true, agreeTerms: true }).extend({ currentPassword: z.string().min(1).max(128) });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(128), newPassword: registerSchema.shape.password });
const mediaSchema = z.object({ id: z.string().max(80), kind: z.enum(['photo', 'podcast']), title: z.string().trim().min(1).max(120), url: z.string().max(500), mimeType: z.string().max(100), createdAt: z.string() });
const storySchema = z.object({ id: z.string().max(80), title: z.string().trim().min(2).max(160), destination: z.string().trim().max(120), date: z.string().max(20), body: z.string().trim().min(10).max(10000), coverUrl: z.string().max(500).optional(), createdAt: z.string() });
export const profileSchema = z.object({
    userId: z.string().optional(), bio: z.string().max(1000), birthDate: z.string().max(20), city: z.string().max(100), emergencyContact: z.string().max(100),
    interests: z.array(z.string().max(50)).max(20), travelStyle: z.string().max(80), experienceLevel: z.string().max(50), dietaryNotes: z.string().max(500),
    wallet: z.object({ balance: z.number(), lockedBalance: z.number().optional(), currency: z.literal('تومان'), transactions: z.array(z.any()).max(100), paymentMethods: z.array(z.any()).max(10).optional() }),
    club: z.object({ points: z.number(), tier: z.enum(['برنزی', 'نقره‌ای', 'طلایی']), cards: z.array(z.any()).max(30) }),
    stories: z.array(storySchema).max(100), media: z.array(mediaSchema).max(200),
    privacy: z.object({ profileVisible: z.boolean(), showTrips: z.boolean(), allowCompanionRequests: z.boolean() }),
    professional: z.object({ occupation: z.string().max(100), languages: z.array(z.string().max(40)).max(10), fitnessLevel: z.string().max(40), insuranceProvider: z.string().max(100), insuranceExpiry: z.string().max(20), passportReady: z.boolean(), equipmentNotes: z.string().max(500) }),
    settings: z.object({ appearance: z.object({ theme: z.enum(['system', 'light', 'dark']), fontScale: z.enum(['normal', 'large']), reducedMotion: z.boolean(), highContrast: z.boolean() }), notifications: z.object({ email: z.boolean(), sms: z.boolean(), push: z.boolean(), booking: z.boolean(), priceAlerts: z.boolean(), club: z.boolean(), community: z.boolean() }), preferences: z.object({ language: z.enum(['fa', 'en']), calendar: z.enum(['jalali', 'gregorian']), currency: z.literal('IRR'), autoPlayMedia: z.boolean() }), security: z.object({ loginAlerts: z.boolean(), twoFactorRequested: z.boolean(), hideSensitiveAmounts: z.boolean() }) }), updatedAt: z.string().optional()
});
export const walletOperationSchema = z.object({ action: z.enum(['topup', 'withdraw']), amount: z.number().int().min(10000).max(500000000), sourceLabel: z.string().trim().min(2).max(80) });

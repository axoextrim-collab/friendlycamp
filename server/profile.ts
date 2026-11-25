import { databaseBackend, readDocument, writeDocument, documentMutation } from './database';
import { dataFile } from './runtimePaths';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const PROFILES_FILE = dataFile('profiles.json');
export type TravelProfile = {
    userId: string;
    bio: string;
    birthDate: string;
    city: string;
    emergencyContact: string;
    interests: string[];
    travelStyle: string;
    experienceLevel: string;
    dietaryNotes: string;
    wallet: {
        balance: number;
        lockedBalance: number;
        currency: 'تومان';
        transactions: WalletTransaction[];
        paymentMethods: Array<{
            id: string;
            label: string;
            masked: string;
            type: 'card' | 'iban';
            isDefault: boolean;
        }>;
    };
    club: {
        points: number;
        tier: 'برنزی' | 'نقره‌ای' | 'طلایی';
        cards: Array<{
            id: string;
            title: string;
            value: string;
            status: 'فعال' | 'استفاده‌شده';
        }>;
    };
    stories: Array<{
        id: string;
        title: string;
        destination: string;
        date: string;
        body: string;
        coverUrl?: string;
        createdAt: string;
    }>;
    media: Array<{
        id: string;
        kind: 'photo' | 'podcast';
        title: string;
        url: string;
        mimeType: string;
        createdAt: string;
    }>;
    privacy: {
        profileVisible: boolean;
        showTrips: boolean;
        allowCompanionRequests: boolean;
    };
    professional: {
        occupation: string;
        languages: string[];
        fitnessLevel: string;
        insuranceProvider: string;
        insuranceExpiry: string;
        passportReady: boolean;
        equipmentNotes: string;
    };
    settings: {
        appearance: {
            theme: 'system' | 'light' | 'dark';
            fontScale: 'normal' | 'large';
            reducedMotion: boolean;
            highContrast: boolean;
        };
        notifications: {
            email: boolean;
            sms: boolean;
            push: boolean;
            booking: boolean;
            priceAlerts: boolean;
            club: boolean;
            community: boolean;
        };
        preferences: {
            language: 'fa' | 'en';
            calendar: 'jalali' | 'gregorian';
            currency: 'IRR';
            autoPlayMedia: boolean;
        };
        security: {
            loginAlerts: boolean;
            twoFactorRequested: boolean;
            hideSensitiveAmounts: boolean;
        };
    };
    updatedAt: string;
};
export type WalletTransaction = {
    id: string;
    title: string;
    amount: number;
    date: string;
    type: 'credit' | 'debit';
    status: 'موفق' | 'در انتظار' | 'ناموفق';
    category: 'شارژ' | 'رزرو' | 'بازگشت وجه' | 'برداشت' | 'پاداش';
    reference: string;
};
async function readAll(): Promise<Record<string, TravelProfile>> {
    if (databaseBackend() === 'postgres')
        return await readDocument('profiles') || {};
    try {
        return JSON.parse(await fs.readFile(PROFILES_FILE, 'utf8'));
    }
    catch (error: any) {
        if (error?.code === 'ENOENT')
            return {};
        throw error;
    }
}
async function writeAll(profiles: Record<string, TravelProfile>) {
    if (databaseBackend() === 'postgres')
        return await writeDocument('profiles', profiles);
    await fs.mkdir(path.dirname(PROFILES_FILE), { recursive: true });
    const temporary = `${PROFILES_FILE}.${process.pid}.tmp`;
    await fs.writeFile(temporary, JSON.stringify(profiles, null, 2), { encoding: 'utf8', mode: 0o600 });
    await fs.rename(temporary, PROFILES_FILE);
}
export function createDefaultProfile(userId: string): TravelProfile {
    return {
        userId, bio: '', birthDate: '', city: '', emergencyContact: '', interests: [], travelStyle: 'طبیعت‌گردی', experienceLevel: 'مبتدی', dietaryNotes: '',
        wallet: { balance: 0, lockedBalance: 0, currency: 'تومان', transactions: [], paymentMethods: [] },
        club: { points: 0, tier: 'برنزی', cards: [{ id: 'welcome', title: 'کارت عضویت همسفر', value: 'عضویت پایه', status: 'فعال' }] },
        stories: [], media: [], privacy: { profileVisible: true, showTrips: true, allowCompanionRequests: true },
        professional: { occupation: '', languages: ['فارسی'], fitnessLevel: 'متوسط', insuranceProvider: '', insuranceExpiry: '', passportReady: false, equipmentNotes: '' },
        settings: { appearance: { theme: 'system', fontScale: 'normal', reducedMotion: false, highContrast: false }, notifications: { email: true, sms: true, push: true, booking: true, priceAlerts: true, club: true, community: false }, preferences: { language: 'fa', calendar: 'jalali', currency: 'IRR', autoPlayMedia: true }, security: { loginAlerts: true, twoFactorRequested: false, hideSensitiveAmounts: false } }, updatedAt: new Date().toISOString()
    };
}
export async function getProfile(userId: string) {
    const profiles = await readAll();
    const profile = profiles[userId] || createDefaultProfile(userId);
    return normalizeProfile(profile);
}
export async function saveProfile(userId: string, profile: TravelProfile) {
    return await documentMutation(async () => {
        const profiles = await readAll();
        const existing = normalizeProfile(profiles[userId] || createDefaultProfile(userId));
        const safeProfile = { ...profile, userId, wallet: existing.wallet, club: existing.club, updatedAt: new Date().toISOString() };
        profiles[userId] = safeProfile;
        await writeAll(profiles);
        return safeProfile;
    });
}
function normalizeProfile(profile: TravelProfile): TravelProfile {
    const wallet = profile.wallet as TravelProfile['wallet'];
    const defaults = createDefaultProfile(profile.userId);
    return { ...defaults, ...profile, professional: { ...defaults.professional, ...profile.professional }, settings: { appearance: { ...defaults.settings.appearance, ...profile.settings?.appearance }, notifications: { ...defaults.settings.notifications, ...profile.settings?.notifications }, preferences: { ...defaults.settings.preferences, ...profile.settings?.preferences }, security: { ...defaults.settings.security, ...profile.settings?.security } }, wallet: { balance: Number(wallet?.balance) || 0, lockedBalance: Number(wallet?.lockedBalance) || 0, currency: 'تومان', paymentMethods: wallet?.paymentMethods || [], transactions: (wallet?.transactions || []).map(transaction => ({ status: 'موفق', category: transaction.type === 'credit' ? 'شارژ' : 'رزرو', reference: transaction.id.slice(0, 12).toUpperCase(), ...transaction })) } };
}
export async function applyWalletOperation(userId: string, input: {
    action: 'topup' | 'withdraw';
    amount: number;
    sourceLabel: string;
}) {
    const profiles = await readAll();
    const profile = normalizeProfile(profiles[userId] || createDefaultProfile(userId));
    if (input.action === 'withdraw' && input.amount > profile.wallet.balance)
        throw new Error('INSUFFICIENT_BALANCE');
    const reference = `FC-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const safeSourceLabel = input.action === 'topup' ? 'درگاه بانکی امن' : `حساب مقصد •••• ${input.sourceLabel.slice(-4)}`;
    const transaction: WalletTransaction = {
        id: crypto.randomUUID(), title: input.action === 'topup' ? `شارژ کیف پول از ${safeSourceLabel}` : `برداشت به ${safeSourceLabel}`,
        amount: input.amount, date: new Date().toISOString(), type: input.action === 'topup' ? 'credit' : 'debit', status: 'موفق', category: input.action === 'topup' ? 'شارژ' : 'برداشت', reference
    };
    profile.wallet.balance += input.action === 'topup' ? input.amount : -input.amount;
    profile.wallet.transactions.unshift(transaction);
    profile.updatedAt = new Date().toISOString();
    profiles[userId] = profile;
    await writeAll(profiles);
    return { wallet: profile.wallet, transaction };
}

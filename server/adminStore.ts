import { databaseBackend, readDocument, writeDocument, documentMutation } from './database';
import { dataFile } from './runtimePaths';
import fs from 'node:fs/promises';
import { isLegacySampleRecord } from './legacySampleRecords';
import path from 'node:path';
import crypto from 'node:crypto';
import type { ShopOrder } from '../src/types/shop';
export type AdminResource = 'tours' | 'bookings' | 'products' | 'customers' | 'content' | 'tickets';
export type AdminRecord = Record<string, unknown> & {
    id: string;
    updatedAt: string;
};
export type AdminSettings = {
    typography: {
        headingFont: string;
        bodyFont: string;
        baseSize: number;
        headingWeight: number;
        bodyWeight: number;
        lineHeight: number;
        letterSpacing: number;
    };
    image: {
        width: number;
        height: number;
        quality: number;
        format: string;
        fit: string;
        focalPoint: string;
        brightness: number;
        contrast: number;
        saturation: number;
        overlay: number;
        borderRadius: number;
    };
    slider: {
        autoplay: boolean;
        interval: number;
        transition: string;
        transitionDuration: number;
        pauseOnHover: boolean;
        showArrows: boolean;
        showDots: boolean;
        kenBurns: boolean;
        reducedMotionFallback: boolean;
    };
    channels: Record<string, {
        enabled: boolean;
        title: string;
        width: number;
        height: number;
        interval: number;
        transition: string;
        overlay: number;
        focalPoint: string;
    }>;
};
export type AdminDatabase = Record<AdminResource, AdminRecord[]> & {
    audit: AdminRecord[];
    settings: AdminSettings;
    shopOrders?: ShopOrder[];
};
const FILE = dataFile('admin.json');
const now = () => new Date().toISOString();
const item = (data: Record<string, unknown>): AdminRecord => ({ id: crypto.randomUUID(), updatedAt: now(), ...data });
let initializing: Promise<AdminDatabase> | undefined;
let mutationQueue: Promise<unknown> = Promise.resolve();
function seed(): AdminDatabase {
    return { tours: [], bookings: [], products: [], customers: [], content: [], tickets: [], audit: [], settings: defaultSettings() };
}
function defaultSettings(): AdminSettings { return { typography: { headingFont: 'Vazirmatn', bodyFont: 'Vazirmatn', baseSize: 16, headingWeight: 900, bodyWeight: 400, lineHeight: 1.8, letterSpacing: 0 }, image: { width: 1920, height: 1080, quality: 86, format: 'webp', fit: 'cover', focalPoint: 'center', brightness: 100, contrast: 105, saturation: 92, overlay: 32, borderRadius: 0 }, slider: { autoplay: true, interval: 5000, transition: 'fade', transitionDuration: 900, pauseOnHover: true, showArrows: true, showDots: true, kenBurns: true, reducedMotionFallback: true }, channels: { hero: { enabled: true, title: 'اسلایدر اصلی صفحه', width: 1920, height: 1080, interval: 5000, transition: 'fade', overlay: 35, focalPoint: 'center' }, shop: { enabled: true, title: 'بنرهای فروشگاه', width: 1920, height: 760, interval: 6500, transition: 'slide', overlay: 24, focalPoint: 'center' }, destinations: { enabled: true, title: 'مقاصد منتخب', width: 1200, height: 900, interval: 5000, transition: 'slide', overlay: 15, focalPoint: 'center' }, tours: { enabled: true, title: 'تورهای پیشنهادی', width: 1200, height: 900, interval: 5000, transition: 'slide', overlay: 18, focalPoint: 'center' }, testimonials: { enabled: true, title: 'روایت و رضایت مسافران', width: 900, height: 900, interval: 7000, transition: 'fade', overlay: 10, focalPoint: 'center' } } }; }
;
async function read(): Promise<AdminDatabase> {
    try {
        const data = (databaseBackend() === 'postgres' ? await readDocument('admin') || seed() : JSON.parse(await fs.readFile(FILE, 'utf8'))) as AdminDatabase;
        for (const resource of ['tours', 'bookings', 'products', 'customers', 'content', 'tickets'] as const)
            data[resource] = (data[resource] || []).filter(row => !isLegacySampleRecord(row));
        return { ...data, settings: { ...defaultSettings(), ...(data.settings || {}), typography: { ...defaultSettings().typography, ...data.settings?.typography }, image: { ...defaultSettings().image, ...data.settings?.image }, slider: { ...defaultSettings().slider, ...data.settings?.slider }, channels: { ...defaultSettings().channels, ...data.settings?.channels } } };
    }
    catch (error: any) {
        if (error?.code === 'ENOENT') {
            if (!initializing)
                initializing = (async () => { const data = seed(); await write(data); return data; })().finally(() => { initializing = undefined; });
            return initializing;
        }
        throw error;
    }
}
async function write(data: AdminDatabase) {
    if (databaseBackend() === 'postgres')
        return await writeDocument('admin', data);
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    const temporary = `${FILE}.${process.pid}.tmp`;
    await fs.writeFile(temporary, JSON.stringify(data, null, 2), { encoding: 'utf8', mode: 0o600 });
    await fs.rename(temporary, FILE);
}
export async function adminSnapshot() {
    const data = await read();
    const paid = data.bookings.filter(v => v.status === 'paid');
    const revenue = paid.reduce((sum, v) => sum + Number(v.amount || 0), 0);
    const seats = data.tours.reduce((sum, v) => sum + Number(v.capacity || 0), 0);
    const sold = data.tours.reduce((sum, v) => sum + Number(v.sold || 0), 0);
    return { generatedAt: now(), metrics: { revenue, bookings: data.bookings.length, paidBookings: paid.length, occupancy: seats ? Math.round(sold / seats * 100) : 0, customers: data.customers.length, lowStock: data.products.filter(v => Number(v.stock) <= Number(v.reorderPoint)).length, openTickets: data.tickets.filter(v => v.status !== 'closed').length, publishedTours: data.tours.filter(v => v.status === 'published').length }, resources: { tours: data.tours, bookings: data.bookings, products: data.products, customers: data.customers, content: data.content, tickets: data.tickets }, settings: data.settings, audit: data.audit.slice(0, 30) };
}
export async function updateAdminSettings(payload: Partial<AdminSettings>, actor: string) { return await mutateAdminDatabase(data => { data.settings = { ...data.settings, ...payload, typography: { ...data.settings.typography, ...payload.typography }, image: { ...data.settings.image, ...payload.image }, slider: { ...data.settings.slider, ...payload.slider }, channels: { ...data.settings.channels, ...payload.channels } }; data.audit.unshift(item({ action: 'settings.update', resource: 'site-design', recordId: 'global', actor, changes: Object.keys(payload) })); return data.settings; }); }
export async function publicDesignSettings() { return (await read()).settings; }
export const readAdminDatabase = read;
export async function mutateAdminDatabase<T>(mutate: (data: AdminDatabase) => T | Promise<T>): Promise<Promise<T>> {
    const result = mutationQueue.then(async () => await documentMutation(async () => { const data = await read(); const value = await mutate(data); await write(data); return value; }));
    mutationQueue = result.catch(() => undefined);
    return result;
}
export async function createAdminRecord(resource: AdminResource, payload: Record<string, unknown>, actor: string) {
    return await mutateAdminDatabase(data => {
        const record = item(payload);
        data[resource].unshift(record);
        data.audit.unshift(item({ action: 'create', resource, recordId: record.id, actor }));
        return record;
    });
}
export async function updateAdminRecord(resource: AdminResource, id: string, payload: Record<string, unknown>, actor: string) {
    return await mutateAdminDatabase(data => {
        const index = data[resource].findIndex(v => v.id === id);
        if (index < 0)
            return null;
        const current = data[resource][index];
        const record = { ...current, ...payload, id, updatedAt: now() };
        data[resource][index] = record;
        data.audit.unshift(item({ action: 'update', resource, recordId: id, actor, changes: Object.keys(payload), before: current, after: record }));
        return record;
    });
}

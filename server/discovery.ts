import {asyncMap} from './asyncCollections';

import type express from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { bookingDb, bookingTransaction, expireBookingHolds } from './database';
import { controlDb, publishedTours } from './controlStore';
import { bookingTours, publicDeparture } from './bookingCatalog';
import { requireUser } from './auth';
import { resolvedTravel } from './leaderCatalog';
import { publicMapSettings } from './mapSettings';
import { routeSchema } from './discoverySchemas';
let initialized: ReturnType<typeof bookingDb> | undefined;
async function db() {
    const value = await controlDb();
    if (initialized !== value) {
        value.exec(`CREATE TABLE IF NOT EXISTS tour_favorites(user_id TEXT NOT NULL,tour_id TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(user_id,tour_id));
 CREATE TABLE IF NOT EXISTS capacity_watches(user_id TEXT NOT NULL,departure_id TEXT NOT NULL,tour_id TEXT NOT NULL,title TEXT NOT NULL,threshold INTEGER NOT NULL,last_remaining INTEGER NOT NULL,enabled INTEGER NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(user_id,departure_id));
 CREATE TABLE IF NOT EXISTS capacity_alerts(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,departure_id TEXT NOT NULL,tour_id TEXT NOT NULL,title TEXT NOT NULL,starts_at TEXT NOT NULL,before_count INTEGER NOT NULL,remaining INTEGER NOT NULL,created_at TEXT NOT NULL,is_read INTEGER NOT NULL DEFAULT 0);
 CREATE INDEX IF NOT EXISTS capacity_alert_owner ON capacity_alerts(user_id,created_at);`);
        initialized = value;
    }
    return value;
}
function fail(status: number, message: string): never { throw Object.assign(new Error(message), { status }); }
export async function pollCapacityChanges() {
    const published = new Map((await publishedTours()).map(tour => [tour.id, tour]));
    await db();
    await bookingTransaction(async () => {
        await expireBookingHolds();
        for (const watch of await (await db()).prepare('SELECT * FROM capacity_watches WHERE enabled=1').all()) {
            const row = await (await db()).prepare('SELECT config FROM departures WHERE id=?').get(watch.departure_id);
            const config = row ? JSON.parse(String(row.config)) : null;
            const tour = published.get(String(watch.tour_id));
            if (!config || !tour || !config.active || Date.parse(config.startsAt) <= Date.now()) {
                await (await db()).prepare('UPDATE capacity_watches SET enabled=0 WHERE user_id=? AND departure_id=?').run(watch.user_id, watch.departure_id);
                continue;
            }
            const remaining = (await publicDeparture(config)).remaining;
            const before = Number(watch.last_remaining);
            if (remaining < before && remaining <= Number(watch.threshold)) {
                await (await db()).prepare('INSERT INTO capacity_alerts(id,user_id,departure_id,tour_id,title,starts_at,before_count,remaining,created_at) VALUES(?,?,?,?,?,?,?,?,?)').run(crypto.randomUUID(), watch.user_id, watch.departure_id, watch.tour_id, String(tour.title), config.startsAt, before, remaining, new Date().toISOString());
            }
            await (await db()).prepare('UPDATE capacity_watches SET last_remaining=?,title=? WHERE user_id=? AND departure_id=?').run(remaining, String(tour.title), watch.user_id, watch.departure_id);
        }
    });
}
export function registerDiscoveryRoutes(app: express.Express) {
    const run = (handler: (req: express.Request, res: express.Response) => unknown) => async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        res.set('Cache-Control', 'no-store');
        try {
            await handler(req, res);
        }
        catch (error) {
            if (error instanceof Error && 'status' in error)
                res.status(Number(error.status)).json({ message: error.message });
            else
                next(error);
        }
    };
    app.get('/api/site/map-settings', run((_req, res) => {
        try {
            res.json(publicMapSettings());
        }
        catch (error) {
            return fail(503, error instanceof Error ? error.message : 'منبع نقشه در دسترس نیست.');
        }
    }));
    app.get('/api/tours/compare', run(async (req, res) => {
        const ids = z.string().max(350).transform(value => value.split(',').filter(Boolean)).pipe(z.array(z.string().regex(/^[\w-]{1,100}$/)).min(2).max(3).refine(values => new Set(values).size === values.length)).parse(req.query.ids);
        const tours = await bookingTours();
        const chosen = ids.map(id => tours.find(tour => tour.id === id));
        if (chosen.some(item => !item))
            return fail(404, 'یکی از برنامه‌های انتخابی دیگر منتشرشده نیست.');
        res.json({ tours: chosen });
    }));
    app.get('/api/tours/:id/route', run(async (req, res) => {
        const tour = (await publishedTours()).find(item => item.id === req.params.id);
        const parsed = routeSchema.safeParse(tour?.route);
        if (!tour || !parsed.success || parsed.data.points.length < 2)
            return fail(404, 'مسیر GPS مستند برای این تور منتشر نشده است.');
        res.json({ tourId: tour.id, title: tour.title, route: parsed.data });
    }));
    app.get('/api/tours/:id/equipment', run(async (req, res) => {
        const tour = (await publishedTours()).find(item => item.id === req.params.id);
        if (!tour)
            return fail(404, 'برنامه منتشرشده پیدا نشد.');
        const travel = await resolvedTravel(tour);
        if (!travel.equipment.length)
            return fail(409, 'فهرست وسایل این برنامه هنوز ثبت نشده است.');
        const text = [String(tour.title), 'فهرست وسایل ثبت‌شده برگزارکننده', ...travel.equipment.map((item, index) => `${index + 1}. ${item}`), '', `نسخه برنامه: ${tour.revision || tour.updatedAt || ''}`, travel.fitnessRequirements].join('\r\n');
        res.type('text/plain; charset=utf-8').attachment(`friendlycamp-equipment-${tour.id.replace(/[^\w-]/g, '')}.txt`).send('\uFEFF' + text);
    }));
    app.get('/api/account/tour-favorites', requireUser, run(async (req, res) => res.json({ ids: (await (await db()).prepare('SELECT tour_id FROM tour_favorites WHERE user_id=? ORDER BY created_at DESC').all(req.user!.id)).map(row => row.tour_id) })));
    app.post('/api/account/tour-favorites', requireUser, run(async (req, res) => {
        const { tourId, enabled } = z.object({ tourId: z.string().regex(/^[\w-]{1,100}$/), enabled: z.boolean() }).strict().parse(req.body);
        if (enabled && !(await publishedTours()).some(tour => tour.id === tourId))
            return fail(404, 'تور برای ذخیره در دسترس نیست.');
        await db();
        await bookingTransaction(async () => {
            const count = Number((await (await db()).prepare('SELECT count(*) AS n FROM tour_favorites WHERE user_id=?').get(req.user!.id))?.n || 0);
            if (enabled && count >= 150 && !await (await db()).prepare('SELECT tour_id FROM tour_favorites WHERE user_id=? AND tour_id=?').get(req.user!.id, tourId))
                return fail(409, 'حداکثر ۱۵۰ تور را در علاقه‌مندی‌ها نگه دار.');
            if (enabled)
                await (await db()).prepare('INSERT OR IGNORE INTO tour_favorites VALUES(?,?,?)').run(req.user!.id, tourId, new Date().toISOString());
            else
                await (await db()).prepare('DELETE FROM tour_favorites WHERE user_id=? AND tour_id=?').run(req.user!.id, tourId);
        });
        res.json({ ids: (await (await db()).prepare('SELECT tour_id FROM tour_favorites WHERE user_id=? ORDER BY created_at DESC').all(req.user!.id)).map(row => row.tour_id) });
    }));
    app.post('/api/account/capacity-watches', requireUser, run(async (req, res) => {
        const { departureId, threshold, enabled } = z.object({ departureId: z.string().regex(/^[\w-]{1,100}$/), threshold: z.number().int().min(1).max(1000), enabled: z.boolean() }).strict().parse(req.body);
        await db();
        if (!enabled) {
            await (await db()).prepare('UPDATE capacity_watches SET enabled=0 WHERE user_id=? AND departure_id=?').run(req.user!.id, departureId);
            return res.json({ saved: true });
        }
        const tour = (await bookingTours()).find(item => item.departures.some(departure => departure.id === departureId));
        if (!tour)
            return fail(404, 'نوبت منتشرشده پیدا نشد.');
        await bookingTransaction(async () => {
            await expireBookingHolds();
            const row = await (await db()).prepare('SELECT config FROM departures WHERE id=?').get(departureId);
            if (!row)
                return fail(404, 'نوبت پیدا نشد.');
            const config = JSON.parse(String(row.config));
            if (!config.active || Date.parse(config.startsAt) <= Date.now())
                return fail(409, 'این نوبت برای دریافت اعلان فعال نیست.');
            if (threshold > config.capacity)
                return fail(400, 'آستانه بیشتر از ظرفیت نوبت است.');
            await (await db()).prepare('INSERT INTO capacity_watches VALUES(?,?,?,?,?,?,1,?) ON CONFLICT(user_id,departure_id) DO UPDATE SET threshold=excluded.threshold,last_remaining=excluded.last_remaining,enabled=1,title=excluded.title').run(req.user!.id, departureId, tour.id, tour.title, threshold, (await publicDeparture(config)).remaining, new Date().toISOString());
        });
        res.json({ saved: true });
    }));
    app.get('/api/account/capacity-alerts', requireUser, run(async (req, res) => { await pollCapacityChanges(); const watches = await asyncMap((await (await db()).prepare('SELECT * FROM capacity_watches WHERE user_id=? ORDER BY created_at DESC').all(req.user!.id)), async (item) => { const row = await (await db()).prepare('SELECT config FROM departures WHERE id=?').get(item.departure_id); const config = row ? JSON.parse(String(row.config)) : null; return { departureId: item.departure_id, tourId: item.tour_id, title: item.title, startsAt: config?.startsAt || '', threshold: item.threshold, remaining: config ? (await publicDeparture(config)).remaining : 0, enabled: !!item.enabled }; }); const alerts = (await (await db()).prepare('SELECT * FROM capacity_alerts WHERE user_id=? ORDER BY created_at DESC LIMIT 100').all(req.user!.id)).map(item => ({ id: item.id, departureId: item.departure_id, tourId: item.tour_id, title: item.title, startsAt: item.starts_at, before: item.before_count, remaining: item.remaining, createdAt: item.created_at, read: !!item.is_read })); res.json({ watches, alerts, unread: Number((await (await db()).prepare('SELECT count(*) AS n FROM capacity_alerts WHERE user_id=? AND is_read=0').get(req.user!.id))?.n || 0) }); }));
    app.post('/api/account/capacity-alerts/read', requireUser, run(async (req, res) => {
        const { ids } = z.object({ ids: z.array(z.uuid()).min(1).max(100) }).strict().parse(req.body);
        await db();
        await bookingTransaction(async () => {
            for (const id of ids)
                await (await db()).prepare('UPDATE capacity_alerts SET is_read=1 WHERE id=? AND user_id=?').run(id, req.user!.id);
        });
        res.json({ saved: true });
    }));
    const timer = setInterval(() => { pollCapacityChanges().catch(() => undefined); }, 20000);
    timer.unref();
}

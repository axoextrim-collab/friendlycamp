import "dotenv/config";
import {databaseBackend} from './server/database';
import { dataDirectory, uploadsDirectory as uploadDirectory } from './server/runtimePaths';
import { validateDeployment } from './server/deployment';
import { UPLOAD_TYPES, storageBackend, storageReady, uploadObject, proxyUpload, StorageError } from './server/supabaseStorage';
import { registerDiscoveryRoutes } from './server/discovery';
import { mapTileOrigin } from './server/mapSettings';
import { registerSupportRoutes } from './server/support';
import express from "express";
import path from "path";
import fs from "node:fs";
import crypto from "node:crypto";
import { createServer as createViteServer } from "vite";
import helmet from "helmet";
import rateLimit, {ipKeyGenerator} from "express-rate-limit";
import cookieParser from "cookie-parser";
import multer from "multer";
import { ZodError } from "zod";
import { authenticate, bootstrapAdminFromEnvironment, changePassword, clearSession, createUser, issueSession, optionalSession, requireAdmin, requirePermission, requireUser, updateAccount } from "./server/auth";
import { accountSchema, changePasswordSchema, loginSchema, profileSchema, registerSchema } from "./server/schemas";
import { getProfile, saveProfile } from "./server/profile";
import { adminSnapshot, createAdminRecord, publicDesignSettings, updateAdminRecord, updateAdminSettings, type AdminResource } from "./server/adminStore";
import { ShopError, adminShopInventory, adminShopOrders, cancelShopOrder, createShopOrder, saveShopInventory, shopCatalog, shopQuote, trackShopOrder, updateShopOrder } from './server/shop';
import { shopCartSchema, shopInventorySchema, shopOrderSchema, shopOrderUpdateSchema, shopTrackingSchema } from './server/shopSchemas';
import { metadataForPath, pageRedirect, renderPageHtml, sitemapXml } from './server/pages';
import { contactRequestSchema, saveContactRequest } from './server/contact';
import { newsletterCsv, newsletterSnapshot, newsletterSubscriptionSchema, subscribeToNewsletter, unsubscribeNewsletter } from './server/newsletter';
import { registerBookingRoutes } from './server/bookingRoutes';
import { BookingError } from './server/bookingProviders';
import { bookingTours } from './server/bookingCatalog';
import { registerControlRoutes } from './server/controlRoutes';
import { registerDashboardRoutes } from './server/dashboard';
import { settingsContext, registerSettingsRoutes, publicSiteSettings } from './server/operationalSettings';
import { registerSiteThemeRoutes, siteThemeRecord } from './server/siteTheme';
import { controlAudit, publishedContent } from './server/controlStore';
async function startServer() {
    validateDeployment();
    await bootstrapAdminFromEnvironment();
    const app = express();
    const PORT = Number(process.env.PORT) || 3000;
    const isProduction = process.env.NODE_ENV === "production";
    app.disable("x-powered-by");
    if (process.env.RENDER === 'true')
        app.set('trust proxy', 1);
    // Runtime records stay private, including Vite's development filesystem URLs.
    const privateDataPath = dataDirectory().replace(/\\/g, '/').toLowerCase();
    app.use((req, res, next) => {
        let requestedPath: string;
        try {
            requestedPath = decodeURIComponent(req.path).replace(/\\/g, '/').toLowerCase();
        }
        catch {
            return res.status(400).end();
        }
        if (requestedPath === '/data' || requestedPath.startsWith('/data/') || (requestedPath.startsWith('/@fs/') && requestedPath.includes(privateDataPath + '/')))
            return res.status(404).set('Cache-Control', 'no-store').json({ error: 'NOT_FOUND' });
        next();
    });
    // Allows the management application to live on a separate, explicitly trusted domain.
    // Example: ADMIN_ORIGINS=https://admin.friendlycamp.ir
    const adminOrigins = new Set((process.env.ADMIN_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean));
    app.use((req, res, next) => {
        const origin = req.headers.origin;
        if (origin && adminOrigins.has(origin)) {
            res.setHeader("Access-Control-Allow-Origin", origin);
            res.setHeader("Access-Control-Allow-Credentials", "true");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Requested-With");
            res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
            res.setHeader("Vary", "Origin");
        }
        if (req.method === "OPTIONS")
            return res.status(adminOrigins.has(origin || "") ? 204 : 403).end();
        next();
    });
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                "default-src": ["'self'"], "script-src": isProduction ? ["'self'"] : ["'self'", "'unsafe-inline'"], "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                "font-src": ["'self'", "https://fonts.gstatic.com", "data:"], "img-src": ["'self'", "data:", "https://images.unsplash.com", "https://media.giphy.com", mapTileOrigin()],
                "media-src": ["'self'", "https://assets.mixkit.co", "https://commondatastorage.googleapis.com"], "connect-src": isProduction ? ["'self'"] : ["'self'", "ws:", "wss:"],
                "frame-ancestors": ["'none'"], "base-uri": ["'self'"], "form-action": ["'self'"],
                "upgrade-insecure-requests": isProduction ? [] : null
            }
        }, crossOriginResourcePolicy: { policy: "cross-origin" }, referrerPolicy: { policy: "strict-origin-when-cross-origin" }
    }));
    app.use('/api/profile', express.json({ limit: '4mb' }));
    app.use('/api/manage', express.json({ limit: '1mb' }));
    app.use(express.json({ limit: "32kb" }));
    app.use(cookieParser());
    app.use(optionalSession);
    app.use("/api", rateLimit({ windowMs: 60000, limit:req=>req.user&&req.user.role!=='user'?600:120,keyGenerator:req=>ipKeyGenerator(req.ip||req.socket.remoteAddress||'unavailable'), standardHeaders: "draft-8", legacyHeaders: false,message:{error:'RATE_LIMITED',message:'تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید.'} }));
    app.use('/api',settingsContext);
    registerBookingRoutes(app, new URL(process.env.PUBLIC_SITE_URL || process.env.RENDER_EXTERNAL_URL || (isProduction ? 'https://friendlycamp.ir' : `http://localhost:${PORT}`)).origin);
    registerControlRoutes(app);
    registerDashboardRoutes(app);
    registerSettingsRoutes(app);
    registerSiteThemeRoutes(app);
    registerSupportRoutes(app);
    registerDiscoveryRoutes(app);
    const authLimiter = rateLimit({ windowMs: 15 * 60000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false });
    const contactLimiter = rateLimit({ windowMs: 15 * 60000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false });
    const newsletterLimiter = rateLimit({ windowMs: 15 * 60000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'TOO_MANY_REQUESTS', message: 'تعداد تلاش‌ها زیاد است؛ کمی بعد دوباره تلاش کن.' } });
    app.post('/api/newsletter/subscriptions', newsletterLimiter, async (req, res, next) => {
        res.setHeader('Cache-Control', 'no-store');
        const input = newsletterSubscriptionSchema.safeParse(req.body);
        if (!input.success) {
            const field = input.error.issues[0]?.path[0];
            return res.status(400).json({ error: 'VALIDATION_ERROR', message: field === 'consent' ? 'برای عضویت، رضایت حریم خصوصی لازم است.' : field === 'consentVersion' ? 'صفحه را تازه کن و متن رضایت را دوباره بررسی کن.' : 'یک نشانی ایمیل معتبر وارد کن.' });
        }
        try {
            const result = await subscribeToNewsletter(input.data);
            return res.status(result.status === 'subscribed' ? 201 : 200).json({ ...result, message: result.status === 'subscribed' ? 'ایمیل شما در فهرست خبرنامه ثبت شد.' : 'این ایمیل قبلاً عضو خبرنامه شده است؛ ثبت دوباره لازم نیست.' });
        }
        catch (error) {
            next(error);
        }
    });
    app.all('/api/newsletter/subscriptions', (_req, res) => res.status(405).set('Allow', 'POST').json({ error: 'METHOD_NOT_ALLOWED', message: 'ثبت عضویت فقط با ارسال فرم انجام می‌شود.' }));
    app.get('/api/admin/newsletter/subscribers', requirePermission('newsletter'), async (_req, res, next) => {
        res.setHeader('Cache-Control', 'no-store');
        try {
            res.json(await newsletterSnapshot());
        }
        catch (error) {
            next(error);
        }
    });
    app.post('/api/admin/newsletter/subscribers/:id/unsubscribe', requirePermission('newsletter'), async (req, res, next) => {
        res.setHeader('Cache-Control', 'no-store');
        try {
            const subscriber = await unsubscribeNewsletter(req.params.id);
            if (!subscriber)
                return res.status(404).json({ error: 'SUBSCRIBER_NOT_FOUND', message: 'عضو پیدا نشد.' });
            await controlAudit(req.user!.email, 'newsletter', req.params.id, 'unsubscribe', undefined, subscriber);
            res.json(subscriber);
        }
        catch (error) {
            next(error);
        }
    });
    app.get('/api/admin/newsletter/export.csv', requirePermission('newsletter'), async (_req, res, next) => {
        res.setHeader('Cache-Control', 'no-store');
        try {
            res.type('text/csv').attachment('friendly-newsletter.csv').send(await newsletterCsv());
        }
        catch (error) {
            next(error);
        }
    });
    app.post('/api/contact/requests', contactLimiter, async (req, res, next) => {
        try {
            const reference = await saveContactRequest(contactRequestSchema.parse(req.body));
            return res.status(201).json({ reference });
        }
        catch (error) {
            next(error);
        }
    });
    const shopOrderLimiter = rateLimit({ windowMs: 15 * 60000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false });
    const shopTrackingLimiter = rateLimit({ windowMs: 60000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false });
    const uploadsDirectory = uploadDirectory();
    fs.mkdirSync(uploadsDirectory, { recursive: true });
    const allowedUploadTypes = new Set(Object.keys(UPLOAD_TYPES));
    const upload = multer({
        storage: multer.diskStorage({ destination: uploadsDirectory, filename: (_req, file, callback) => {
                const extension = UPLOAD_TYPES[file.mimetype] || "";
                callback(null, `${crypto.randomUUID()}${extension}`);
            } }),
        limits: { fileSize: 12 * 1024 * 1024, files: 1 },
        fileFilter: (_req, file, callback) => callback(null, allowedUploadTypes.has(file.mimetype))
    });
    if (storageBackend() === 'local')
        app.use('/uploads', express.static(uploadsDirectory, { immutable: true, maxAge: '30d', fallthrough: false }));
    else {
        app.get('/uploads/:filename', async (req, res, next) => {
            try {
                await proxyUpload(req, res);
            }
            catch (error) {
                if (res.headersSent)
                    res.destroy();
                else
                    next(error);
            }
        });
        app.use('/uploads', (_req, res) => res.status(404).end());
    }
    app.get('/api/ready', async (_req, res) => {
        try {
            await bookingTours();
            if(databaseBackend()==='sqlite')await fs.promises.access(dataDirectory(), fs.constants.R_OK | fs.constants.W_OK);
            await storageReady();
            res.set('Cache-Control', 'no-store').json({ status: 'ready' });
        }
        catch {
            res.status(503).set('Cache-Control', 'no-store').json({ status: 'not_ready' });
        }
    });
    // API Route: Health Check
    app.get("/api/health", (req, res) => {
        res.json({ status: "ok", timestamp: new Date().toISOString(), version: process.env.npm_package_version || "0.0.0" });
    });
    app.get("/api/site/design-settings", async (_req, res, next) => {
        try {
            res.setHeader("Cache-Control", "no-store");
            res.json({ settings:{...await publicDesignSettings(),appearance:(await siteThemeRecord()).theme} });
        }
        catch (error) {
            next(error);
        }
    });
    app.get("/api/auth/me", requireUser, (req, res) => res.json({ user: req.user }));
    app.post("/api/auth/register", authLimiter, async (req, res, next) => {
        try {
            const input = registerSchema.parse(req.body);
            const user = await createUser(input);
            issueSession(res, user, true);
            res.status(201).json({ user });
        }
        catch (error: any) {
            if (error?.message === "ACCOUNT_EXISTS")
                return res.status(409).json({ error: "ACCOUNT_EXISTS", message: "حسابی با این ایمیل یا شماره همراه وجود دارد." });
            next(error);
        }
    });
    app.post("/api/auth/login", authLimiter, async (req, res, next) => {
        try {
            const input = loginSchema.parse(req.body);
            const user = await authenticate(input.identifier, input.password);
            if (!user)
                return res.status(401).json({ error: "INVALID_CREDENTIALS", message: "اطلاعات ورود صحیح نیست." });
            issueSession(res, user, input.remember);
            res.json({ user });
        }
        catch (error) {
            next(error);
        }
    });
    app.post("/api/auth/logout", (_req, res) => { clearSession(res); res.status(204).end(); });
    app.post("/api/auth/otp/request", authLimiter, (_req, res) => res.status(503).json({ error: "OTP_PROVIDER_NOT_CONFIGURED", message: "سرویس پیامک هنوز پیکربندی نشده است؛ از ورود با رمز استفاده کنید." }));
    app.get("/api/admin/health", requireAdmin, (_req, res) => res.json({ status: "ok" }));
    app.get("/api/admin/dashboard", requireAdmin, async (_req, res, next) => {
        try {
            res.json(await adminSnapshot());
        }
        catch (error) {
            next(error);
        }
    });
    app.patch("/api/admin/settings", requireAdmin, async (req, res, next) => {
        try {
            if (!req.body || typeof req.body !== "object" || Array.isArray(req.body))
                return res.status(400).json({ error: "INVALID_PAYLOAD" });
            res.json({ settings: await updateAdminSettings(req.body, req.user!.email) });
        }
        catch (error) {
            next(error);
        }
    });
    const adminResources = new Set<AdminResource>(["tours", "bookings", "products", "customers", "content", "tickets"]);
    app.post("/api/admin/:resource", requireAdmin, async (req, res, next) => {
        try {
            const resource = req.params.resource as AdminResource;
            if (!adminResources.has(resource))
                return res.status(404).json({ error: "RESOURCE_NOT_FOUND" });
            if (!req.body || typeof req.body !== "object" || Array.isArray(req.body))
                return res.status(400).json({ error: "INVALID_PAYLOAD" });
            res.status(201).json({ record: await createAdminRecord(resource, req.body, req.user!.email) });
        }
        catch (error) {
            next(error);
        }
    });
    app.patch("/api/admin/:resource/:id", requireAdmin, async (req, res, next) => {
        try {
            const resource = req.params.resource as AdminResource;
            if (!adminResources.has(resource))
                return res.status(404).json({ error: "RESOURCE_NOT_FOUND" });
            if (!req.body || typeof req.body !== "object" || Array.isArray(req.body))
                return res.status(400).json({ error: "INVALID_PAYLOAD" });
            const record = await updateAdminRecord(resource, req.params.id, req.body, req.user!.email);
            if (!record)
                return res.status(404).json({ error: "RECORD_NOT_FOUND" });
            res.json({ record });
        }
        catch (error) {
            next(error);
        }
    });
    app.get('/api/shop/catalog', async (_req, res, next) => {
        try {
            res.setHeader('Cache-Control', 'no-store');
            res.json({ products: await shopCatalog() });
        }
        catch (error) {
            next(error);
        }
    });
    app.post('/api/shop/quote', async (req, res, next) => {
        try {
            res.json({ quote: await shopQuote(shopCartSchema.parse(req.body).items) });
        }
        catch (error) {
            next(error);
        }
    });
    app.post('/api/shop/orders', shopOrderLimiter, async (req, res, next) => {
        try {
            res.status(201).json(await createShopOrder(shopOrderSchema.parse(req.body) as Parameters<typeof createShopOrder>[0], req.user?.id));
        }
        catch (error) {
            next(error);
        }
    });
    app.post('/api/shop/orders/track', shopTrackingLimiter, async (req, res, next) => {
        try {
            const input = shopTrackingSchema.parse(req.body);
            res.json({ order: await trackShopOrder(input.reference, input.trackingToken) });
        }
        catch (error) {
            next(error);
        }
    });
    app.post('/api/shop/orders/cancel', shopOrderLimiter, async (req, res, next) => {
        try {
            const input = shopTrackingSchema.parse(req.body);
            res.json({ order: await cancelShopOrder(input.reference, input.trackingToken) });
        }
        catch (error) {
            next(error);
        }
    });
    app.get('/api/admin/shop/orders', requireAdmin, async (_req, res, next) => {
        try {
            res.json({ orders: await adminShopOrders() });
        }
        catch (error) {
            next(error);
        }
    });
    app.patch('/api/admin/shop/orders/:reference', requireAdmin, async (req, res, next) => {
        try {
            res.json({ order: await updateShopOrder(req.params.reference, shopOrderUpdateSchema.parse(req.body), req.user!.email) });
        }
        catch (error) {
            next(error);
        }
    });
    app.get('/api/admin/shop/inventory', requireAdmin, async (_req, res, next) => {
        try {
            res.json({ products: await adminShopInventory() });
        }
        catch (error) {
            next(error);
        }
    });
    app.put('/api/admin/shop/inventory', requireAdmin, async (req, res, next) => {
        try {
            res.json({ product: await saveShopInventory(shopInventorySchema.parse(req.body) as Parameters<typeof saveShopInventory>[0], req.user!.email) });
        }
        catch (error) {
            next(error);
        }
    });
    app.get("/api/profile", requireUser, async (req, res, next) => {
        try {
            res.json({ profile: await getProfile(req.user!.id), user: req.user });
        }
        catch (error) {
            next(error);
        }
    });
    app.put("/api/profile", requireUser, async (req, res, next) => {
        try {
            const profile = profileSchema.parse(req.body);
            res.json({ profile: await saveProfile(req.user!.id, profile as any) });
        }
        catch (error) {
            next(error);
        }
    });
    app.patch('/api/profile/account', requireUser, authLimiter, async (req, res, next) => {
        try {
            const user = await updateAccount(req.user!.id, accountSchema.parse(req.body));
            res.json({ user });
        }
        catch (error: any) {
            if (error?.message === 'INVALID_CURRENT_PASSWORD')
                return res.status(400).json({ error: error.message, message: 'رمز فعلی حساب صحیح نیست.' });
            if (error?.message === 'ACCOUNT_EXISTS')
                return res.status(409).json({ error: error.message, message: 'این ایمیل یا شماره همراه به حساب دیگری تعلق دارد.' });
            next(error);
        }
    });
    app.post('/api/profile/password', requireUser, authLimiter, async (req, res, next) => {
        try {
            await changePassword(req.user!.id, changePasswordSchema.parse(req.body));
            res.status(204).end();
        }
        catch (error: any) {
            if (error?.message === 'INVALID_CURRENT_PASSWORD')
                return res.status(400).json({ error: error.message, message: 'رمز فعلی حساب صحیح نیست.' });
            if (error?.message === 'PASSWORD_UNCHANGED')
                return res.status(400).json({ error: error.message, message: 'رمز جدید باید با رمز فعلی متفاوت باشد.' });
            next(error);
        }
    });
    app.post('/api/profile/wallet/operation', requireUser, (_req, res) => res.status(503).json({ error: 'PAYMENT_PROVIDER_NOT_CONFIGURED', message: 'پرداخت و برداشت آنلاین هنوز فعال نیست. برای امور مالی با پشتیبانی تماس بگیر.' }));
    app.post("/api/profile/upload", requireUser, upload.single("file"), async (req, res, next) => {
        if (!req.file)
            return res.status(400).json({ error: "INVALID_FILE", message: "فایل معتبر انتخاب نشده است." });
        try {
            if (storageBackend() === 'supabase')
                await uploadObject(req.file.filename, req.file.path, req.file.mimetype, req.file.size);
            res.status(201).json({ url: `/uploads/${req.file.filename}`, mimeType: req.file.mimetype, size: req.file.size });
        }
        catch (error) {
            next(error);
        }
        finally {
            if (storageBackend() === 'supabase')
                await fs.promises.unlink(req.file.path).catch(() => undefined);
        }
    });
    app.use("/api", (_req, res) => res.status(404).json({ error: "NOT_FOUND" }));
    app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        if (error instanceof StorageError)
            return res.status(error.status).json({ error: 'STORAGE_UNAVAILABLE', message: error.message });
        if (error instanceof BookingError)
            return res.status(error.status).json({ error: error.code, message: error.message });
        if (error instanceof ShopError)
            return res.status(error.status).json({ error: error.code, message: error.message, quote: error.quote });
        if (error instanceof ZodError)
            return res.status(400).json({ error: "VALIDATION_ERROR", issues: error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message })) });
        if (error instanceof SyntaxError)
            return res.status(400).json({ error: "INVALID_JSON" });
        console.error("Unhandled request error", error);
        return res.status(500).json({ error: "INTERNAL_ERROR" });
    });
    const siteOrigin = new URL(process.env.PUBLIC_SITE_URL || process.env.RENDER_EXTERNAL_URL || (isProduction ? 'https://friendlycamp.ir' : `http://localhost:${PORT}`)).origin;
    app.get('/sitemap.xml', async (_req, res, next) => {
        try {
            await publishedContent();
            res.type('application/xml').send(sitemapXml(await shopCatalog(), siteOrigin, await bookingTours()));
        }
        catch (error) {
            next(error);
        }
    });
    app.get('/robots.txt', (_req, res) => res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nDisallow: /account\nDisallow: /profile\nDisallow: /login\nDisallow: /register\nDisallow: /shop/checkout\nDisallow: /shop/manage\nSitemap: ${siteOrigin}/sitemap.xml\n`));
    // Serve each page with its own initial metadata and HTTP status, including deep links.
    let transformHtml: ((url: string, html: string) => Promise<string>) | undefined;
    let templatePath: string;
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "custom",
        });
        app.use(vite.middlewares);
        templatePath = path.join(process.cwd(), 'index.html');
        transformHtml = (url, html) => vite.transformIndexHtml(url, html);
    }
    else {
        const distPath = path.join(process.cwd(), "dist");
        templatePath = path.join(distPath, 'index.html');
        const staticFiles = express.static(distPath, { index: false, redirect: false });
        app.use((req, res, next) => /\.(?:css|js|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|webmanifest|mp4|mp3|ogg|wav)$/i.test(req.path) ? staticFiles(req, res, next) : next());
    }
    app.get('*', async (req, res, next) => {
        try {
            await publishedContent();
            const search = new URL(req.originalUrl, siteOrigin).search;
            const redirect = pageRedirect(req.path, search);
            if (redirect)
                return res.redirect(308, redirect);
            if (/\.[^/]+$/.test(req.path))
                return res.status(404).type('text/plain').send('Not found');
            const metadata = metadataForPath(req.path, await shopCatalog(), await bookingTours());
            const siteSettings=await publicSiteSettings();
            if(req.path==='/'){if(siteSettings.homeTitle)metadata.title=siteSettings.homeTitle;if(siteSettings.homeDescription)metadata.description=siteSettings.homeDescription;}
            let html = renderPageHtml(await fs.promises.readFile(templatePath, 'utf8'), metadata, siteOrigin,siteSettings.siteName,req.path==='/admin'||req.path==='/shop/manage'||req.hostname.toLowerCase().startsWith('admin.')?undefined:(await siteThemeRecord()).theme);
            if (transformHtml)
                html = await transformHtml(req.originalUrl, html);
            return res.status(metadata.notFound ? 404 : 200).type('html').send(html);
        }
        catch (error) {
            next(error);
        }
    });
    app.use((_error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => res.status(500).type('text/plain').send('Page unavailable'));
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
startServer().catch(error=>{console.error('Application startup failed:',error instanceof Error?error.message:'unknown error');process.exit(1);});

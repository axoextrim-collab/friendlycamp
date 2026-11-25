import fs from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { Request, Response } from 'express';
export const UPLOAD_TYPES: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'audio/mpeg': '.mp3', 'audio/mp4': '.m4a', 'audio/ogg': '.ogg', 'audio/wav': '.wav' };
export class StorageError extends Error {
    constructor(public status: number, message = 'فضای نگهداری فایل در دسترس نیست؛ دوباره تلاش کن.') { super(message); }
}
export function storageBackend() {
    const mode = process.env.UPLOAD_STORAGE || 'local';
    if (!['local', 'supabase'].includes(mode))
        throw new Error('UPLOAD_STORAGE must be local or supabase');
    return mode;
}
export function storageConfig() {
    const raw = process.env.SUPABASE_URL || '';
    let url: URL;
    try {
        url = new URL(raw);
    }
    catch {
        throw new Error('SUPABASE_URL is required');
    }
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/' || url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))
        throw new Error('SUPABASE_URL must be a secure project origin');
    const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!key || !(key.startsWith('sb_secret_') || key.split('.').length === 3))
        throw new Error('A Supabase server secret or service_role key is required');
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'friendlycamp-uploads';
    if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(bucket))
        throw new Error('SUPABASE_STORAGE_BUCKET is invalid');
    return { origin: url.origin, key, bucket };
}
export function validUploadName(name: string) { return /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,150}\.(?:jpg|jpeg|png|webp|gif|mp3|m4a|ogg|wav)$/.test(name); }
function authHeaders(key: string) { return { 'apikey': key, ...(!key.startsWith('sb_secret_') ? { 'Authorization': `Bearer ${key}` } : {}) }; }
async function storageRequest(suffix: string, init: RequestInit = {}) {
    const config = storageConfig();
    try {
        return await fetch(`${config.origin}/storage/v1/${suffix}`, { ...init, headers: { ...authHeaders(config.key), ...init.headers }, signal: AbortSignal.timeout(30000), redirect: 'error' });
    }
    catch {
        throw new StorageError(503);
    }
}
let probe: {
    signature: string;
    at: number;
} | undefined;
export async function storageReady() {
    if (storageBackend() === 'local')
        return;
    const config = storageConfig();
    const signature = config.origin + config.bucket + config.key;
    if (probe?.signature === signature && Date.now() - probe.at < 30000)
        return;
    const response = await storageRequest(`bucket/${config.bucket}`);
    if (!response.ok)
        throw new StorageError(503);
    const bucket = await response.json();
    if (bucket.id !== config.bucket || bucket.public !== false)
        throw new StorageError(503, 'فضای فایل باید خصوصی و متعلق به همین پروژه باشد.');
    probe = { signature, at: Date.now() };
}
export async function uploadObject(filename: string, filePath: string, mimeType: string, size: number) {
    if (!validUploadName(filename) || !UPLOAD_TYPES[mimeType] || size <= 0 || size > 12 * 1024 * 1024)
        throw new StorageError(400, 'فایل معتبر نیست.');
    const { bucket } = storageConfig();
    const stream = fs.createReadStream(filePath);
    try {
        const response = await storageRequest(`object/${bucket}/${encodeURIComponent(filename)}`, { method: 'POST', body: stream as unknown as BodyInit, duplex: 'half', headers: { 'Content-Type': mimeType, 'Content-Length': String(size), 'x-upsert': 'false', 'cache-control': 'max-age=31536000' } } as RequestInit);
        if (!response.ok) {
            await response.body?.cancel();
            throw new StorageError(response.status === 409 ? 409 : 503);
        }
        await response.body?.cancel();
    }
    finally {
        stream.destroy();
    }
}
export async function downloadObject(filename: string, range?: string) {
    if (!validUploadName(filename))
        throw new StorageError(404, 'فایل پیدا نشد.');
    const { bucket } = storageConfig();
    const headers: Record<string, string> = {};
    if (range && /^bytes=\d*-\d*$/.test(range) && range !== 'bytes=-')
        headers.Range = range;
    const response = await storageRequest(`object/authenticated/${bucket}/${encodeURIComponent(filename)}`, { headers });
    if (!response.ok) {
        let status = response.status;
        try {
            const error = await response.json();
            status = Number(error.statusCode) || status;
        }
        catch { }
        throw new StorageError(status === 404 ? 404 : status === 416 ? 416 : 503, status === 404 ? 'فایل پیدا نشد.' : undefined);
    }
    return response;
}
export async function proxyUpload(req: Request, res: Response) {
    const response = await downloadObject(String(req.params.filename), req.headers.range);
    res.status(response.status);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    const mime = (response.headers.get('content-type') || '').split(';')[0];
    res.type(UPLOAD_TYPES[mime] ? mime : 'application/octet-stream');
    for (const name of ['content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) {
        const value = response.headers.get(name);
        if (value)
            res.set(name, value);
    }
    if (req.method === 'HEAD' || !response.body) {
        await response.body?.cancel();
        res.end();
        return;
    }
    await pipeline(Readable.fromWeb(response.body as any), res);
}

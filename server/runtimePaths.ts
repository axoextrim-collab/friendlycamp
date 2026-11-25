import path from 'node:path';
export function dataDirectory() { return path.resolve(process.env.APP_DATA_DIR || path.join(process.cwd(), 'data')); }
export function dataFile(name: string) { return path.join(dataDirectory(), name); }
export function uploadsDirectory() { return path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), 'public', 'uploads')); }

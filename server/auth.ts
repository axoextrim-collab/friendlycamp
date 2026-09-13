import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import type { Request, Response, NextFunction } from 'express';

const scrypt = promisify(crypto.scrypt);
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type PublicUser = { id: string; fullName: string; phone: string; email: string; nationalCode?: string; role: 'user' | 'admin' };
type StoredUser = PublicUser & { passwordHash: string; passwordSalt: string; createdAt: string };

declare global {
  namespace Express { interface Request { user?: PublicUser } }
}

async function readUsers(): Promise<StoredUser[]> {
  try { return JSON.parse(await fs.readFile(USERS_FILE, 'utf8')) as StoredUser[]; }
  catch (error: any) { if (error?.code === 'ENOENT') return []; throw error; }
}

async function writeUsers(users: StoredUser[]) {
  await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
  const temporaryFile = `${USERS_FILE}.${process.pid}.tmp`;
  await fs.writeFile(temporaryFile, JSON.stringify(users, null, 2), { encoding: 'utf8', mode: 0o600 });
  await fs.rename(temporaryFile, USERS_FILE);
}

/** One-time, environment-controlled administrator bootstrap. No default credential is ever created. */
export async function bootstrapAdminFromEnvironment() {
  const email=process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password=process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if(!email && !password) return;
  if(!email || !password || password.length<12 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) throw new Error('ADMIN_BOOTSTRAP_EMAIL and a 12+ character ADMIN_BOOTSTRAP_PASSWORD containing letters and numbers are required');
  const users=await readUsers(); const existing=users.find(user=>user.email===email);
  if(existing){ if(existing.role!=='admin'){ existing.role='admin'; await writeUsers(users); } return; }
  const credentials=await hashPassword(password);
  users.push({ id:crypto.randomUUID(), fullName:process.env.ADMIN_BOOTSTRAP_NAME?.trim()||'مدیر سامانه', phone:process.env.ADMIN_BOOTSTRAP_PHONE?.trim()||'09000000000', email, role:'admin', passwordHash:credentials.hash, passwordSalt:credentials.salt, createdAt:new Date().toISOString() });
  await writeUsers(users);
}

async function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')) {
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return { hash: derived.toString('hex'), salt };
}

export async function createUser(input: Omit<PublicUser, 'id' | 'role'> & { password: string }): Promise<PublicUser> {
  const users = await readUsers();
  const normalizedEmail = input.email.trim().toLowerCase();
  if (users.some(user => user.email === normalizedEmail || user.phone === input.phone)) throw new Error('ACCOUNT_EXISTS');
  const password = await hashPassword(input.password);
  const user: StoredUser = {
    id: crypto.randomUUID(), fullName: input.fullName.trim(), phone: input.phone,
    email: normalizedEmail, nationalCode: input.nationalCode, role: 'user',
    passwordHash: password.hash, passwordSalt: password.salt, createdAt: new Date().toISOString()
  };
  await writeUsers([...users, user]);
  return toPublicUser(user);
}

export async function authenticate(identifier: string, password: string): Promise<PublicUser | null> {
  const normalized = identifier.trim().toLowerCase();
  const user = (await readUsers()).find(item => item.email === normalized || item.phone === normalized);
  if (!user) { await hashPassword(password); return null; }
  const candidate = await hashPassword(password, user.passwordSalt);
  const valid = crypto.timingSafeEqual(Buffer.from(candidate.hash, 'hex'), Buffer.from(user.passwordHash, 'hex'));
  return valid ? toPublicUser(user) : null;
}

function toPublicUser(user: StoredUser): PublicUser {
  const { passwordHash: _hash, passwordSalt: _salt, createdAt: _created, ...safe } = user;
  return safe;
}

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === 'production' && (!secret || secret.length < 32)) throw new Error('SESSION_SECRET must contain at least 32 characters in production');
  return secret || 'friendlycamp-development-secret-change-before-production';
}

function sign(payload: string) { return crypto.createHmac('sha256', sessionSecret()).update(payload).digest('base64url'); }

export function issueSession(res: Response, user: PublicUser, remember = false) {
  const payload = Buffer.from(JSON.stringify({ sub: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS })).toString('base64url');
  res.cookie('fc_session', `${payload}.${sign(payload)}`, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict',
    path: '/', maxAge: remember ? SESSION_TTL_SECONDS * 1000 : undefined
  });
}

export function clearSession(res: Response) { res.clearCookie('fc_session', { path: '/', sameSite: 'strict' }); }

export async function optionalSession(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.fc_session;
    if (!token) return next();
    const [payload, signature] = token.split('.');
    if (!payload || !signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(sign(payload)))) return next();
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (claims.exp < Date.now() / 1000) return next();
    const user = (await readUsers()).find(item => item.id === claims.sub);
    if (user) req.user = toPublicUser(user);
    next();
  } catch { next(); }
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'AUTH_REQUIRED' });
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'AUTH_REQUIRED' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'ADMIN_REQUIRED' });
  next();
}

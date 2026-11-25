import {dataDirectory} from './runtimePaths';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
let database: DatabaseSync | undefined;
export function closeBookingDatabase() { database?.close(); database=undefined; }
export function bookingDb() {
  if (database) return database;
  const directory = dataDirectory(); fs.mkdirSync(directory, { recursive: true }); const file = path.join(directory, 'bookings.sqlite');
  database = new DatabaseSync(file);
  try {
  // Windows Docker Desktop bind mounts use host ACLs; the non-root container
  // cannot chmod a host-owned file. Strict POSIX permissions remain the default.
  if(process.env.BOOKING_FILE_PERMISSIONS!=='host')fs.chmodSync(file, 0o600);
  database.exec(`PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS departures(id TEXT PRIMARY KEY, tour_id TEXT NOT NULL, config TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS reservations(reference TEXT PRIMARY KEY, request_key TEXT UNIQUE NOT NULL, request_hash TEXT NOT NULL, departure_id TEXT NOT NULL REFERENCES departures(id), seats INTEGER NOT NULL CHECK(seats>0), state TEXT NOT NULL, allocated INTEGER NOT NULL CHECK(allocated IN (0,1)), expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL, payload TEXT NOT NULL, receipt_id TEXT UNIQUE, transaction_id TEXT UNIQUE, refund_amount INTEGER NOT NULL DEFAULT 0, cancellation_fee INTEGER NOT NULL DEFAULT 0);
    CREATE INDEX IF NOT EXISTS reservation_inventory ON reservations(departure_id,allocated);
    CREATE TABLE IF NOT EXISTS payments(id TEXT PRIMARY KEY, reference TEXT NOT NULL REFERENCES reservations(reference), mode TEXT NOT NULL, state TEXT NOT NULL, authority TEXT NOT NULL DEFAULT '', start_url TEXT NOT NULL DEFAULT '', result TEXT NOT NULL DEFAULT '', updated_at INTEGER NOT NULL, UNIQUE(reference));
    CREATE TABLE IF NOT EXISTS sms_jobs(reference TEXT PRIMARY KEY REFERENCES reservations(reference), state TEXT NOT NULL, updated_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, message_id TEXT);
    CREATE TABLE IF NOT EXISTS refund_jobs(reference TEXT PRIMARY KEY REFERENCES reservations(reference), state TEXT NOT NULL, updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS booking_audit(id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, action TEXT NOT NULL, reference TEXT NOT NULL, actor TEXT NOT NULL);
  `);
  if(!database.prepare('PRAGMA table_info(reservations)').all().some(row=>row.name==='owner_id'))database.exec('ALTER TABLE reservations ADD COLUMN owner_id TEXT');
  database.exec('CREATE INDEX IF NOT EXISTS reservations_owner ON reservations(owner_id)');
  return database;
  } catch(error) { database.close();database=undefined;throw error; }
}
export function bookingTransaction<T>(work: () => T): T { const db = bookingDb(); db.exec('BEGIN IMMEDIATE'); try { const result = work(); db.exec('COMMIT'); return result; } catch (error) { db.exec('ROLLBACK'); throw error; } }
export function expireBookingHolds() { bookingDb().prepare("UPDATE reservations SET state='expired', allocated=0 WHERE state='pending' AND allocated=1 AND expires_at<=?").run(Date.now()); }
export function allocatedSeats(departureId: string) { return Number(bookingDb().prepare('SELECT COALESCE(SUM(seats),0) AS seats FROM reservations WHERE departure_id=? AND allocated=1').get(departureId)?.seats || 0); }
export function bookingAudit(action: string, reference: string, actor: string) { bookingDb().prepare('INSERT INTO booking_audit(at,action,reference,actor) VALUES(?,?,?,?)').run(Date.now(), action, reference, actor); }

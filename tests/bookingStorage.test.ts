import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {bookingDb,closeBookingDatabase} from '../server/bookingDb';

test('SQLite initialization fails closed on permission errors and recovers with explicit host-managed permissions',async()=>{
 const previous=process.cwd(),permissionMode=process.env.BOOKING_FILE_PERMISSIONS;
 const directory=await mkdtemp(path.join(tmpdir(),'friendly-storage-test-'));
 const chmod=fs.chmodSync;let attempts=0;
 try{
  process.chdir(directory);delete process.env.BOOKING_FILE_PERMISSIONS;
  fs.chmodSync=()=>{attempts++;throw Object.assign(new Error('Host-managed bind mount'),{code:'EPERM'});};
  assert.throws(()=>bookingDb(),{code:'EPERM'});
  assert.throws(()=>bookingDb(),{code:'EPERM'},'a failed connection must never remain cached');
  assert.equal(attempts,2);
  process.env.BOOKING_FILE_PERMISSIONS='host';
  const database=bookingDb();assert.ok(database.prepare("SELECT name FROM sqlite_master WHERE name='reservations'").get());
  assert.equal(database.prepare('PRAGMA quick_check').get()?.quick_check,'ok');
  assert.equal(attempts,2,'explicit Windows bind-mount mode must not chmod the host-owned file');
 }finally{
  closeBookingDatabase();fs.chmodSync=chmod;process.chdir(previous);
  if(permissionMode===undefined)delete process.env.BOOKING_FILE_PERMISSIONS;else process.env.BOOKING_FILE_PERMISSIONS=permissionMode;
  const resolved=path.resolve(directory);assert.ok(resolved.startsWith(path.resolve(tmpdir())+path.sep)&&path.basename(resolved).startsWith('friendly-storage-test-'));
  await rm(resolved,{recursive:true,force:true});
 }
});

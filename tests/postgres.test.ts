import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdir,mkdtemp,readdir,rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import pg from 'pg';
import crypto from 'node:crypto';
import {NEWSLETTER_CONSENT_VERSION} from '../src/types/newsletter';
import {postgresSql} from '../server/database';
import {importPostgresTransfer} from '../server/postgresTransfer';
import {closePostgres,bookingDb,bookingAudit} from '../server/database';
import {DatabaseSync} from 'node:sqlite';

test('PostgreSQL SQL parameters, JSON paths and conflict clauses retain values and aliases',()=>{
 assert.equal(postgresSql("SELECT '?' AS value, json_extract(payload,'$.quote.coupon.id') AS coupon WHERE id=?"),"SELECT '?' AS value, (payload::jsonb #>> '{quote,coupon,id}') AS coupon WHERE id=$1");
 assert.equal(postgresSql('INSERT OR IGNORE INTO example(id) VALUES(?)'),'INSERT INTO example(id) VALUES($1) ON CONFLICT DO NOTHING');
 assert.equal(postgresSql('SELECT created_at AS createdAt FROM support_messages ORDER BY created_at,rowid'),'SELECT created_at AS "createdAt" FROM support_messages ORDER BY created_at,sequence');
});

test('SQLite export transfers to PostgreSQL atomically, resets audit sequences and refuses overwrite',{skip:!process.env.POSTGRES_TEST_URL_FILE,timeout:30000},async()=>{
 const original=(await readFile(process.env.POSTGRES_TEST_URL_FILE!,'utf8')).trim(),url=new URL(original);assert.equal(url.hostname,'127.0.0.1');assert.equal(url.pathname,'/friendlycamp_qa');
 const admin=new pg.Pool({connectionString:original,ssl:false}),databaseName='friendlycamp_transfer_qa_'+crypto.randomBytes(5).toString('hex');await admin.query(`CREATE DATABASE ${databaseName}`);url.pathname='/'+databaseName;
 const root=await mkdtemp(path.join(tmpdir(),'friendly-pg-transfer-')),oldUrl=process.env.DATABASE_URL,oldBackend=process.env.DATABASE_BACKEND;
 try{
  process.env.DATABASE_BACKEND='postgres';process.env.DATABASE_URL=url.toString();
  const source=new DatabaseSync(path.join(root,'bookings.sqlite'));source.exec("CREATE TABLE staff_roles(user_id TEXT PRIMARY KEY,role TEXT NOT NULL);INSERT INTO staff_roles VALUES('fixture-user','support');CREATE TABLE booking_audit(id INTEGER PRIMARY KEY AUTOINCREMENT,at INTEGER NOT NULL,action TEXT NOT NULL,reference TEXT NOT NULL,actor TEXT NOT NULL);INSERT INTO booking_audit VALUES(5,1700000000000,'fixture','fixture','test');");source.close();
  const files:Record<string,string>={};const fs=await import('node:fs/promises');await fs.writeFile(path.join(root,'users.json'),JSON.stringify([{id:'fixture-user',fullName:'عضو آزمایشی',passwordHash:'test-only-hash'}]));
  for(const name of ['users.json','bookings.sqlite'])files[name]=crypto.createHash('sha256').update(await readFile(path.join(root,name))).digest('hex');await fs.writeFile(path.join(root,'manifest.json'),JSON.stringify({format:1,files}));
  assert.equal((await importPostgresTransfer(root)).status,'imported');assert.equal((await importPostgresTransfer(root)).status,'already_imported');
  assert.equal((await bookingDb().prepare('SELECT role FROM staff_roles WHERE user_id=?').get('fixture-user'))?.role,'support');
  await bookingAudit('after-import','new','test');assert.equal((await bookingDb().prepare('SELECT id FROM booking_audit WHERE action=?').get('after-import'))?.id,6);
  await fs.writeFile(path.join(root,'manifest.json'),JSON.stringify({format:1,files,createdAt:'changed-source'}));await assert.rejects(importPostgresTransfer(root),/Destination contains data/);
  await fs.writeFile(path.join(root,'users.json'),'[]');await assert.rejects(importPostgresTransfer(root),/checksum/);
 }finally{
  await closePostgres();if(oldUrl===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=oldUrl;if(oldBackend===undefined)delete process.env.DATABASE_BACKEND;else process.env.DATABASE_BACKEND=oldBackend;
  await admin.end();assert.ok(path.resolve(root).startsWith(path.resolve(tmpdir())+path.sep)&&path.basename(root).startsWith('friendly-pg-transfer-'));await rm(root,{recursive:true,force:true});
 }
});

test('PostgreSQL persists all state across workers and enforces atomic reservation, coupon, payment and account ownership',{skip:!process.env.POSTGRES_TEST_URL_FILE,timeout:120000},async()=>{
 const rootConnection=(await readFile(process.env.POSTGRES_TEST_URL_FILE!,'utf8')).trim(),url=new URL(rootConnection);assert.equal(url.hostname,'127.0.0.1');assert.equal(url.pathname,'/friendlycamp_qa','integration tests require the dedicated temporary database');
 const adminPool=new pg.Pool({connectionString:rootConnection,ssl:false}),databaseName='friendlycamp_api_qa_'+crypto.randomBytes(5).toString('hex');try{await adminPool.query(`CREATE DATABASE ${databaseName}`);}finally{await adminPool.end();}url.pathname='/'+databaseName;const connectionString=url.toString();
 const sql=new pg.Pool({connectionString,ssl:false}),project=process.cwd(),root=await mkdtemp(path.join(tmpdir(),'friendly-postgres-test-'));const children:ReturnType<typeof spawn>[]=[];
 await mkdir(path.join(root,'dist'));await import('node:fs/promises').then(fs=>fs.writeFile(path.join(root,'dist/index.html'),'<html><head></head><body></body></html>'));
 async function server(){const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const address=probe.address();assert.ok(address&&typeof address!=='string');const port=address.port;await new Promise<void>(resolve=>probe.close(()=>resolve()));const child=spawn(process.execPath,['--import',import.meta.resolve('tsx'),path.join(project,'server.ts')],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,PORT:String(port),NODE_ENV:'production',SESSION_SECRET:'postgres-test-session-secret-of-sufficient-length',DATABASE_BACKEND:'postgres',DATABASE_URL:connectionString,UPLOAD_STORAGE:'local',REQUIRE_EXTERNAL_DATABASE:'true',REQUIRE_PERSISTENT_DISK:'false',APP_DATA_DIR:path.join(root,'must-not-store-state'),ADMIN_BOOTSTRAP_EMAIL:'admin@postgres.test',ADMIN_BOOTSTRAP_PASSWORD:'PostgresAdmin1234',ADMIN_BOOTSTRAP_PHONE:'09120000000',ADMIN_BOOTSTRAP_NAME:'مدیر محیط آزمون',BOOKING_PAYMENT_MODE:'sandbox',SMS_HTTP_URL:'',SMS_API_TOKEN:'',PAYMENT_HTTP_URL:'',PAYMENT_API_TOKEN:''}});children.push(child);let logs='';child.stdout?.on('data',chunk=>logs+=chunk);child.stderr?.on('data',chunk=>logs+=chunk);const base=`http://127.0.0.1:${port}`;for(let i=0;i<150;i++){if(child.exitCode!==null||child.signalCode!==null)throw new Error(logs);try{if((await fetch(base+'/api/ready')).ok)return {base,child};}catch{}await new Promise(resolve=>setTimeout(resolve,100));}throw new Error('Postgres server failed: '+logs);}
 let first=await server(),second=await server();
 async function call(url:string,method='GET',body?:unknown,cookie='',base=first.base){const response=await fetch(base+url,{method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:response.status,data:response.status===204?null:(response.headers.get('content-type')||'').includes('json')?await response.json():await response.text(),cookie:response.headers.get('set-cookie')?.split(';')[0]||''};}
 try{
  const login=await call('/api/auth/login','POST',{identifier:'admin@postgres.test',password:'PostgresAdmin1234'});assert.equal(login.status,200,JSON.stringify(login.data));const admin=login.cookie;
  const alice=(await call('/api/auth/register','POST',{fullName:'همسفر اول پایگاه آزمایشی',phone:'09121110001',email:'alice@postgres.test',password:'PostgresMember1234',agreeTerms:true})).cookie;
  const bob=(await call('/api/auth/register','POST',{fullName:'همسفر دوم پایگاه آزمایشی',phone:'09121110002',email:'bob@postgres.test',password:'PostgresMember1234',agreeTerms:true})).cookie;assert.ok(alice&&bob);
  const concurrent=await Promise.all([first.base,second.base].map(base=>call('/api/auth/register','POST',{fullName:'عضو ثبت هم‌زمان',phone:'09121110003',email:'same@postgres.test',password:'PostgresMember1234',agreeTerms:true},'',base)));assert.deepEqual(concurrent.map(item=>item.status).sort(),[201,409]);
  const profile=(await call('/api/profile','GET',undefined,alice)).data.profile;profile.city='شهر آزمون';assert.equal((await call('/api/profile','PUT',profile,alice)).status,200);assert.equal((await call('/api/profile','GET',undefined,alice,second.base)).data.profile.city,'شهر آزمون');
  const newsletter={email:'newsletter@postgres.test',consent:true,consentVersion:NEWSLETTER_CONSENT_VERSION};const joined=await Promise.all([first.base,second.base].map(base=>call('/api/newsletter/subscriptions','POST',newsletter,'',base)));assert.deepEqual(joined.map(item=>item.status).sort(),[200,201]);
  const values={title:'سفر صرفاً آزمایشی PostgreSQL',code:'PG-TEST-1',destination:'مقصد آزمون',country:'ایران',durationDays:2,summary:'این تور فقط برای آزمون نرم‌افزار در پایگاه داده مستقل ساخته شده است.',heroImage:'/images/moments/camp.webp',gallery:[],included:'خدمت آزمایشی',excluded:'هزینه‌های شخصی',itinerary:[],leader:'لیدر آزمون',status:'published'};
  const created=await call('/api/manage/records/tours','POST',{values,expectedRevision:null},admin);assert.equal(created.status,201,JSON.stringify(created.data));const tourId=created.data.record.id;
  const config={tourId,startsAt:new Date(Date.now()+20*86400000).toISOString(),capacity:1,externalSold:0,price:1000000,active:true,origins:[{id:'origin',title:'مبدأ آزمون',price:0}],tents:[{id:'tent',title:'چادر آزمون',price:0,capacity:2}],extras:[],groupDiscount:{minimum:2,percent:10},cancellation:{enabled:true,cutoffHours:24,feePercent:10}};
  const depart=await call('/api/admin/booking/departures','POST',config,admin);assert.equal(depart.status,201,JSON.stringify(depart.data));const departureId=depart.data.departure.id;
  assert.equal((await call('/api/account/tour-favorites','POST',{tourId,enabled:true},alice)).status,200);assert.deepEqual((await call('/api/account/tour-favorites','GET',undefined,alice,second.base)).data.ids,[tourId]);assert.deepEqual((await call('/api/account/tour-favorites','GET',undefined,bob)).data.ids,[]);
  const complaint=await call('/api/support/cases','POST',{fullName:'همسفر آزمون',phone:'09121110001',email:'',kind:'general',subject:'پرونده آزمون ابری',body:'متن پیام آزمایشی',bookingReference:'',consent:true,requestKey:crypto.randomUUID()},alice);assert.equal(complaint.status,201,JSON.stringify(complaint.data));assert.ok(complaint.data.case.messages[0].createdAt);
  const selection={departureId,guests:1,originId:'origin',tentId:'tent',extras:[]};const quote=await call('/api/bookings/quote','POST',selection);assert.equal(quote.status,200,JSON.stringify(quote.data));
  const code='123456700',sum=code.split('').reduce((value,digit,index)=>value+Number(digit)*(10-index),0)%11,nationalCode=code+(sum<2?sum:11-sum);
  const payload={selection,quoteRevision:quote.data.quote.revision,passengers:[{fullName:'مسافر محیط آزمون',nationalCode}],contact:{fullName:'هماهنگ‌کننده آزمون',phone:'09121110001',email:''},consent:true};
  const inputs=[{...payload,requestKey:crypto.randomUUID()},{...payload,requestKey:crypto.randomUUID()}];const race=await Promise.all([first.base,second.base].map((base,index)=>call('/api/bookings/reservations','POST',inputs[index],alice,base)));assert.deepEqual(race.map(item=>item.status).sort(),[201,409],JSON.stringify(race.map(item=>item.data)));
  const winner=race.find(item=>item.status===201)!.data,access={reference:winner.booking.reference,token:winner.token};assert.ok(winner.booking.expiresAt>2147483647);
  const replay=await call('/api/bookings/reservations','POST',inputs[race.findIndex(item=>item.status===201)],alice);assert.equal(replay.data.booking.reference,access.reference);
  const started=await call('/api/bookings/payment/start','POST',access,alice);assert.equal(started.status,200,JSON.stringify(started.data));const payment={...access,paymentId:started.data.paymentId};await call('/api/bookings/sandbox/complete','POST',{...payment,result:'paid'},alice);
  const verified=await Promise.all([first.base,second.base].map(base=>call('/api/bookings/payment/verify','POST',payment,alice,base)));assert.ok(verified.some(item=>item.data.booking?.state==='paid'),JSON.stringify(verified));
  assert.equal(Number((await sql.query("SELECT count(*) AS n FROM friendlycamp.booking_audit WHERE action='payment.verified'")).rows[0].n),1);
  assert.equal((await call('/api/account/bookings','GET',undefined,bob)).data.records.length,0);
  const cancelled=await call('/api/bookings/cancel','POST',access,alice);assert.equal(cancelled.data.booking.state,'refunded',JSON.stringify(cancelled.data));assert.equal((await call('/api/bookings/quote','POST',selection)).data.quote.remaining,1);
  first.child.kill();if(first.child.exitCode===null&&first.child.signalCode===null)await once(first.child,'exit');first=await server();assert.equal((await call('/api/auth/me','GET',undefined,alice)).status,200);assert.equal((await call('/api/profile','GET',undefined,alice)).data.profile.city,'شهر آزمون');assert.deepEqual((await call('/api/account/tour-favorites','GET',undefined,alice)).data.ids,[tourId]);
  assert.deepEqual((await sql.query("SELECT name FROM friendlycamp.documents ORDER BY name")).rows.map(row=>row.name),['newsletter','profiles','users']);assert.ok(!(await readdir(root)).includes('must-not-store-state'),'the free deployment must not store data on Render filesystem');
 }finally{for(const child of children)if(child.exitCode===null&&child.signalCode===null){child.kill();await once(child,'exit');}await sql.end();const absolute=path.resolve(root);assert.ok(absolute.startsWith(path.resolve(tmpdir())+path.sep)&&path.basename(absolute).startsWith('friendly-postgres-test-'));await rm(root,{recursive:true,force:true});}
});

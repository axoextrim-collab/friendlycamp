import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,copyFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {DatabaseSync} from 'node:sqlite';
import crypto from 'node:crypto';

test('admin settings persist across workers, protect credentials, reject stale writes and apply to actual public metadata and booking capabilities',{timeout:120000},async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'friendly-settings-test-')),project=process.cwd(),children:ReturnType<typeof spawn>[]=[];
 await mkdir(path.join(directory,'data'));await mkdir(path.join(directory,'dist'));await copyFile(path.join(project,'tests/fixtures/admin.json'),path.join(directory,'data/admin.json'));await copyFile(path.join(project,'index.html'),path.join(directory,'dist/index.html'));
 async function server(){const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const address=probe.address();assert.ok(address&&typeof address!=='string');const port=address.port;await new Promise<void>(resolve=>probe.close(()=>resolve()));const child=spawn(process.execPath,['--import',import.meta.resolve('tsx'),path.join(project,'server.ts')],{cwd:directory,windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,PORT:String(port),NODE_ENV:'production',APP_DATA_DIR:path.join(directory,'data'),UPLOADS_DIR:path.join(directory,'uploads'),DATABASE_BACKEND:'sqlite',DATABASE_URL:'',UPLOAD_STORAGE:'local',SESSION_SECRET:'settings-test-stable-secret-at-least-32-characters',SETTINGS_ENCRYPTION_KEY:'',BOOKING_PAYMENT_MODE:'sandbox',ADMIN_BOOTSTRAP_EMAIL:'admin@settings.test',ADMIN_BOOTSTRAP_PASSWORD:'SettingsAdmin1234',ADMIN_BOOTSTRAP_PHONE:'09120000000',ADMIN_BOOTSTRAP_NAME:'مدیر محیط آزمون',PAYMENT_HTTP_URL:'',PAYMENT_API_TOKEN:'',SMS_HTTP_URL:'',SMS_API_TOKEN:''}});children.push(child);let logs='';child.stdout.on('data',v=>logs+=v);child.stderr.on('data',v=>logs+=v);const base=`http://127.0.0.1:${port}`;for(let i=0;i<200;i++){if(child.exitCode!==null)throw Error(logs);try{if((await fetch(base+'/api/health')).ok)return {base,child};}catch{}await new Promise(resolve=>setTimeout(resolve,100));}throw Error(logs);}
 const worker=await server(),base=worker.base;
 async function call(url:string,method='GET',body?:unknown,cookie='',host=base){const response=await fetch(host+url,{method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});return{status:response.status,data:response.headers.get('content-type')?.includes('json')?await response.json():await response.text(),cookie:response.headers.get('set-cookie')?.split(';')[0]||''};}
 try{
  const admin=(await call('/api/auth/login','POST',{identifier:'admin@settings.test',password:'SettingsAdmin1234'})).cookie;assert.ok(admin);
  const member=(await call('/api/auth/register','POST',{fullName:'عضو آزمون تنظیمات',phone:'09121112222',email:'member@settings.test',password:'SettingsMember1234',agreeTerms:true})).cookie;
  for(const section of ['general','booking','payment','sms']){assert.equal((await call('/api/manage/settings/'+section)).status,401);assert.equal((await call('/api/manage/settings/'+section,'GET',undefined,member)).status,403);assert.equal((await call('/api/manage/settings/'+section,'PUT',{values:{},expectedRevision:null},member)).status,403);}
  const save=(section:string,values:unknown,revision:string|null=null)=>call('/api/manage/settings/'+section,'PUT',{values,expectedRevision:revision},admin);
  const general=await save('general',{siteName:'نام محیط مستقل آزمون',homeTitle:'عنوان صفحه اصلی محیط مستقل',homeDescription:'توضیحات ثبت‌شده در فرم مدیریت برای محیط آزمون'});assert.equal(general.status,200,JSON.stringify(general.data));assert.ok(general.data.revision);
  assert.equal((await save('general',{siteName:'داده قدیمی',homeTitle:'',homeDescription:''})).status,409);
  const html=await call('/');assert.ok(html.data.includes('<title>عنوان صفحه اصلی محیط مستقل</title>'));assert.ok(html.data.includes('property="og:site_name" content="نام محیط مستقل آزمون"'));
  const publicContent=await call('/api/site/content');assert.equal(publicContent.data.siteSettings.siteName,'نام محیط مستقل آزمون');
  assert.equal((await save('booking',{holdMinutes:31})).status,400);assert.equal((await save('booking',{holdMinutes:2})).status,200);
  const state=await call('/api/admin/booking/state','GET',undefined,admin),tour=state.data.tours.find((t:any)=>t.status==='published');assert.ok(tour);
  const departure=await call('/api/admin/booking/departures','POST',{tourId:tour.id,startsAt:new Date(Date.now()+10*86400000).toISOString(),capacity:10,externalSold:0,price:1000000,active:true,origins:[{id:'origin',title:'مبدأ آزمون',price:0}],tents:[{id:'tent',title:'چادر آزمون',price:0,capacity:2}],extras:[],groupDiscount:{minimum:4,percent:0},cancellation:{enabled:true,cutoffHours:24,feePercent:20}},admin);assert.equal(departure.status,201);
  const selection={departureId:departure.data.departure.id,guests:1,originId:'origin',tentId:'tent',extras:[]};
  const quote=await call('/api/bookings/quote','POST',selection);assert.equal(quote.status,200);
  const codeBase='123456700',sum=codeBase.split('').reduce((n,d,i)=>n+Number(d)*(10-i),0)%11,nationalCode=codeBase+(sum<2?sum:11-sum);
  const hold=await call('/api/bookings/reservations','POST',{selection,quoteRevision:quote.data.quote.revision,passengers:[{fullName:'مسافر محیط آزمون',nationalCode}],contact:{fullName:'مسافر محیط آزمون',phone:'09121112222',email:'member@settings.test'},consent:true,requestKey:crypto.randomUUID()},member);assert.equal(hold.status,201,JSON.stringify(hold.data));assert.equal(hold.data.booking.expiresAt-hold.data.booking.createdAt,120000,'stored hold duration applies to the actual reservation');
  assert.equal((await save('payment',{mode:'http',baseUrl:'http://example.org',token:'private-key'})).status,400);
  assert.equal((await save('payment',{mode:'http',baseUrl:'https://example.org',token:''})).status,400);
  const secret='PAYMENT-PRIVATE-SENTINEL-DO-NOT-RETURN',smsSecret='SMS-PRIVATE-SENTINEL-DO-NOT-RETURN';
  const payment=await save('payment',{mode:'http',baseUrl:'https://payment.example.org/api',token:secret});assert.equal(payment.status,200,JSON.stringify(payment.data));assert.equal(payment.data.values.hasToken,true);assert.ok(!JSON.stringify(payment.data).includes(secret));
  const sms=await save('sms',{enabled:true,baseUrl:'https://sms.example.org/api',token:smsSecret});assert.equal(sms.status,200,JSON.stringify(sms.data));
  const second=await server();const status=await call('/api/manage/system','GET',undefined,admin,second.base);assert.equal(status.data.capabilities.paymentMode,'http');assert.equal(status.data.capabilities.smsConfigured,true);
  const read=await call('/api/manage/settings/payment','GET',undefined,admin,second.base);assert.equal(read.data.values.hasToken,true);assert.equal(read.data.values.token,undefined);
  const kept=await save('payment',{mode:'http',baseUrl:'https://payment.example.org/api',token:''},payment.data.revision);assert.equal(kept.status,200);assert.equal(kept.data.values.hasToken,true);
  const pendingDb=new DatabaseSync(path.join(directory,'data/bookings.sqlite'));try{const row=pendingDb.prepare('SELECT payload FROM reservations WHERE reference=?').get(hold.data.booking.reference);const payload=JSON.parse(String(row?.payload));payload.mode='http';pendingDb.prepare("UPDATE reservations SET state='paid',payload=? WHERE reference=?").run(JSON.stringify(payload),hold.data.booking.reference);}finally{pendingDb.close();}
  const blocked=await save('payment',{mode:'disabled',baseUrl:'',token:''},kept.data.revision);assert.equal(blocked.status,409,'provider cannot change while a paid reservation may need its original provider');
  const resolvedDb=new DatabaseSync(path.join(directory,'data/bookings.sqlite'));try{resolvedDb.prepare("UPDATE reservations SET state='cancelled',allocated=0 WHERE reference=?").run(hold.data.booking.reference);}finally{resolvedDb.close();}
  const audit=await call('/api/manage/audit','GET',undefined,admin);assert.ok(audit.data.records.some((r:any)=>r.resource==='settings'));for(const value of [secret,smsSecret])assert.ok(!JSON.stringify(audit.data).includes(value));
  const db=new DatabaseSync(path.join(directory,'data/bookings.sqlite'));try{const settings=db.prepare("SELECT payload FROM control_records WHERE resource='settings'").all();assert.ok(settings.some(r=>String(r.payload).includes('encryptedToken')));for(const value of [secret,smsSecret])assert.ok(!JSON.stringify(settings).includes(value));}finally{db.close();}
  const cleared=await save('sms',{enabled:false,baseUrl:'',token:'',clearToken:true},sms.data.revision);assert.equal(cleared.status,200);assert.equal(cleared.data.values.hasToken,false);assert.equal((await call('/api/manage/system','GET',undefined,admin,second.base)).data.capabilities.smsConfigured,false);
  worker.child.kill();await once(worker.child,'exit');const restarted=await server();const retained=await call('/api/manage/settings/booking','GET',undefined,admin,restarted.base);assert.equal(retained.data.values.holdMinutes,2);assert.equal((await call('/api/manage/system','GET',undefined,admin,restarted.base)).data.capabilities.paymentMode,'http');
  assert.equal((await call('/api/manage/settings/unknown','GET',undefined,admin,restarted.base)).status,404);
 }finally{for(const child of children)if(child.exitCode===null&&child.signalCode===null){child.kill();await once(child,'exit');}const resolved=path.resolve(directory);assert.ok(resolved.startsWith(path.resolve(tmpdir())+path.sep)&&path.basename(resolved).startsWith('friendly-settings-test-'));await rm(resolved,{recursive:true,force:true});}
});

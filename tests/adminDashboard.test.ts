import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,copyFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {createServer} from 'node:net';
import {once} from 'node:events';
import {spawn} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {csv,financeEntry,financeTotals,reportStart,tehranDay} from '../server/dashboard';

test('financial reports exclude sandbox and unverified payments and use settlement dates, including older reservations refunded today',()=>{
  const now=Date.parse('2026-11-25T12:00:00Z'),start=reportStart(7,now);
  const row={reference:'FC-UNIT',payload:JSON.stringify({mode:'http',contact:{fullName:'ثبت‌شده'},quote:{total:1000000,title:'تور'}}),state:'paid',created_at:now-40*86400000,transaction_id:'TX-UNIT',payment_mode:'http',payment_state:'verified',payment_at:now-20*86400000,refund_amount:800000,refund_at:now};
  const paid=financeEntry(row),refunded=financeEntry({...row,reference:'FC-REF',state:'refunded'}),pending=financeEntry({...row,reference:'FC-PENDING',state:'refund_pending',payment_at:now});
  const sandbox=financeEntry({...row,reference:'FC-SANDBOX',created_at:now,payload:JSON.stringify({mode:'sandbox',contact:{fullName:'آزمایش'},quote:{total:9000000,title:'تست'}})});
  const unverified=financeEntry({...row,payment_state:'created',payment_at:now});
  const mismatched=financeEntry({...row,payment_mode:'sandbox',payment_at:now});
  assert.equal(sandbox.received,0);assert.equal(unverified.received,0);assert.equal(mismatched.received,0);
  assert.deepEqual(financeTotals([paid,refunded,pending,sandbox,unverified,mismatched],start,now),{received:1000000,returned:800000,net:200000,pendingRefund:800000,sandbox:1});
  assert.equal(tehranDay(Date.parse('2026-11-24T21:00:00Z')),'2026-11-25');
  assert.equal(reportStart(7,now),Date.parse('2026-11-19T00:00:00+03:30'));
  assert.equal(csv([['=HYPERLINK("secret")','  +SUM(A1)','safe,cell']]),'\uFEFF"\'=HYPERLINK(""secret"")","\'  +SUM(A1)","safe,cell"');
});

test('superadmin APIs enforce roles, aggregate beyond the recent 100 bookings and expose only safe directory and ledger fields',{timeout:120000},async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'friendly-admin-test-')),project=process.cwd();
  await mkdir(path.join(root,'data'));await mkdir(path.join(root,'dist'));await copyFile(path.join(project,'tests/fixtures/admin.json'),path.join(root,'data/admin.json'));await copyFile(path.join(project,'index.html'),path.join(root,'dist/index.html'));
  const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const address=probe.address();assert.ok(address&&typeof address!=='string');const port=address.port;await new Promise<void>(resolve=>probe.close(()=>resolve()));
  const child=spawn(process.execPath,['--import',import.meta.resolve('tsx'),path.join(project,'server.ts')],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,PORT:String(port),NODE_ENV:'production',APP_DATA_DIR:path.join(root,'data'),UPLOADS_DIR:path.join(root,'uploads'),DATABASE_BACKEND:'sqlite',DATABASE_URL:'',UPLOAD_STORAGE:'local',SESSION_SECRET:'admin-dashboard-test-secret-long-enough',BOOKING_PAYMENT_MODE:'sandbox',ADMIN_BOOTSTRAP_EMAIL:'admin@dashboard.test',ADMIN_BOOTSTRAP_PASSWORD:'DashboardTest1234',ADMIN_BOOTSTRAP_PHONE:'09120000000',ADMIN_BOOTSTRAP_NAME:'مدیر آزمون',PAYMENT_HTTP_URL:'',PAYMENT_API_TOKEN:'',SMS_HTTP_URL:'',SMS_API_TOKEN:''}});
  let logs='';child.stdout.on('data',chunk=>logs+=chunk);child.stderr.on('data',chunk=>logs+=chunk);const base=`http://127.0.0.1:${port}`;
  const call=async(url:string,method='GET',body?:unknown,cookie='')=>{const response=await fetch(base+url,{method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});const isJson=response.headers.get('content-type')?.includes('json');return{status:response.status,data:isJson?await response.json():await response.text(),cookie:response.headers.get('set-cookie')?.split(';')[0]||'',cache:response.headers.get('cache-control')};};
  try{
    let ready=false;for(let i=0;i<200;i++){if(child.exitCode!==null)throw Error(logs);try{if((await fetch(base+'/api/health')).ok){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,100));}assert.ok(ready,logs);
    const admin=(await call('/api/auth/login','POST',{identifier:'admin@dashboard.test',password:'DashboardTest1234'})).cookie;assert.ok(admin);
    const member=await call('/api/auth/register','POST',{fullName:'عضو محیط آزمون',phone:'09121112222',email:'member@dashboard.test',password:'MemberTest1234',agreeTerms:true});assert.equal(member.status,201);
    const staff=await call('/api/manage/staff','POST',{fullName:'نویسنده محیط آزمون',phone:'09121113333',email:'editor@dashboard.test',password:'EditorTest1234',agreeTerms:true,role:'editor'},admin);assert.equal(staff.status,201);
    const editor=(await call('/api/auth/login','POST',{identifier:'editor@dashboard.test',password:'EditorTest1234'})).cookie;
    for(const endpoint of ['/api/manage/dashboard','/api/manage/customers','/api/manage/finance','/api/manage/finance?format=csv','/api/manage/search?q=تور','/api/manage/system']){assert.equal((await call(endpoint)).status,401,endpoint);assert.equal((await call(endpoint,'GET',undefined,member.cookie)).status,403,endpoint);assert.equal((await call(endpoint,'GET',undefined,editor)).status,403,endpoint);}
    let summary=await call('/api/manage/dashboard','GET',undefined,admin);assert.equal(summary.status,200,JSON.stringify(summary.data));assert.equal(summary.data.counts.bookings,0);assert.equal(summary.cache,'no-store');
    const now=Date.now(),config={id:'qa-departure',tourId:'qa-tour',startsAt:new Date(now+10*86400000).toISOString(),capacity:300,externalSold:10,price:1000000,active:true,movementStatus:'scheduled',origins:[],tents:[],extras:[],groupDiscount:{minimum:4,percent:0},cancellation:{enabled:true,cutoffHours:24,feePercent:20},revision:'qa'};
    const db=new DatabaseSync(path.join(root,'data/bookings.sqlite'));db.exec('PRAGMA busy_timeout=5000;PRAGMA foreign_keys=ON;');
    try{
      db.prepare('INSERT INTO departures(id,tour_id,config) VALUES(?,?,?)').run(config.id,config.tourId,JSON.stringify(config));
      for(let i=0;i<145;i++){
        const mode=i<140?'sandbox':'http',state=i===141?'refunded':i===142?'refund_pending':i===143?'review':'paid',reference='QA-'+String(i).padStart(3,'0');
        const payload={mode,quote:{total:1000000,title:'تور محیط آزمون',selection:{guests:1}},contact:{fullName:i===140?'=CSV-INJECTION':'عضو محیط آزمون',phone:'09121112222',email:'member@dashboard.test'},passengers:[{fullName:'آزمون',nationalCode:'DO_NOT_EXPOSE_ID'}],privateSentinel:'DO_NOT_EXPOSE_PRIVATE'};
        db.prepare('INSERT INTO reservations(reference,request_key,request_hash,departure_id,seats,state,allocated,expires_at,created_at,payload,transaction_id,refund_amount,owner_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').run(reference,'key-'+i,'hash-'+i,config.id,1,state,['paid','review'].includes(state)?1:0,now+86400000,i===142?now-100*86400000:now-1000,JSON.stringify(payload),'TX-'+i,i===141||i===142?800000:0,member.data.user.id);
        db.prepare("INSERT INTO payments(id,reference,mode,state,updated_at) VALUES(?,?,?,?,?)").run('payment-'+i,reference,mode,i===143?'created':'verified',i===142?now-100*86400000:now-500);
        if(i===141)db.prepare('INSERT INTO refund_jobs(reference,state,updated_at) VALUES(?,?,?)').run(reference,'refunded',now-200);
      }
    }finally{db.close();}
    summary=await call('/api/manage/dashboard','GET',undefined,admin);assert.equal(summary.status,200,JSON.stringify(summary.data));
    assert.equal(summary.data.counts.bookings,144);assert.equal(summary.data.counts.sandbox,140);assert.equal(summary.data.finance.received,3000000);assert.equal(summary.data.finance.returned,800000);assert.equal(summary.data.finance.pendingRefund,800000);assert.equal(summary.data.finance.net,2200000);assert.equal(summary.data.daily.reduce((n:number,d:any)=>n+d.bookings,0),144);
    assert.ok(summary.data.attention.some((a:any)=>a.id==='refunds'&&a.count===2));assert.equal(summary.data.upcoming[0].remaining,147);
    const ledger=await call('/api/manage/finance?mode=http','GET',undefined,admin);assert.equal(ledger.data.total,5);assert.equal(ledger.data.records.length,5);assert.ok(ledger.data.records.some((r:any)=>r.reference==='QA-142'&&r.state==='refund_pending'),'old outstanding refunds remain visible outside the selected range');assert.ok(!JSON.stringify(ledger.data).includes('DO_NOT_EXPOSE'));
    const filtered=await call('/api/manage/finance?mode=sandbox&state=paid&page=2','GET',undefined,admin);assert.equal(filtered.data.total,140);assert.equal(filtered.data.records.length,20);
    const directory=await call('/api/manage/customers?role=user&q=member','GET',undefined,admin);assert.equal(directory.data.total,1);assert.equal(directory.data.records[0].bookings,145);assert.equal(directory.data.records[0].role,'user');
    for(const forbidden of ['passwordHash','passwordSalt','nationalCode','DO_NOT_EXPOSE'])assert.ok(!JSON.stringify(directory.data).includes(forbidden),forbidden);
    const search=await call('/api/manage/search?q='+encodeURIComponent('عضو محیط'),'GET',undefined,admin);assert.ok(search.data.results.some((r:any)=>r.kind==='کاربر'&&r.target.includes('customers?q=')));assert.ok(!JSON.stringify(search.data).includes('DO_NOT_EXPOSE'));
    const output=await call('/api/manage/finance?mode=http&format=csv','GET',undefined,admin);assert.equal(output.status,200);assert.ok(output.data.includes("'=CSV-INJECTION"));
    for(const invalid of ['/api/manage/dashboard?days=1','/api/manage/finance?page=0','/api/manage/finance?mode=invalid','/api/manage/customers?role=invalid'])assert.equal((await call(invalid,'GET',undefined,admin)).status,400,invalid);
    const system=await call('/api/manage/system','GET',undefined,admin);assert.equal(system.data.database,'sqlite');assert.equal(system.data.capabilities.paymentMode,'sandbox');assert.ok(!JSON.stringify(system.data).includes(process.env.SESSION_SECRET||'admin-dashboard-test-secret-long-enough'));
    assert.equal((await call('/api/manage/search?q=a','GET',undefined,admin)).data.results.length,0);
  }finally{child.kill();if(child.exitCode===null)await once(child,'exit');const resolved=path.resolve(root);assert.ok(resolved.startsWith(path.resolve(tmpdir())+path.sep)&&path.basename(resolved).startsWith('friendly-admin-test-'));await rm(resolved,{recursive:true,force:true});}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import crypto from 'node:crypto';
import { controlDraft } from '../src/admin/controlFields';

test('management enforces roles, publication review, consent, weather expiry, revisions, live role revocation and atomic coupon limits', {timeout:120000},async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'friendly-control-test-'));const project=process.cwd();const children:ReturnType<typeof spawn>[]=[];
 await mkdir(path.join(directory,'dist'));await writeFile(path.join(directory,'dist','index.html'),await readFile(path.join(project,'index.html')));
 async function server(){const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const address=probe.address();assert.ok(address&&typeof address!=='string');const port=address.port;await new Promise<void>(resolve=>probe.close(()=>resolve()));const child=spawn(process.execPath,['--import',import.meta.resolve('tsx'),path.join(project,'server.ts')],{cwd:directory,windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,PORT:String(port),NODE_ENV:'production',SESSION_SECRET:'control-integration-secret-of-sufficient-length',BOOKING_PAYMENT_MODE:'sandbox',ADMIN_BOOTSTRAP_EMAIL:'admin@control.test',ADMIN_BOOTSTRAP_PASSWORD:'ControlAdmin1234',ADMIN_BOOTSTRAP_PHONE:'09120000000',ADMIN_BOOTSTRAP_NAME:'مدیر آزمایش',SMS_HTTP_URL:'',SMS_API_TOKEN:''}});children.push(child);let logs='';child.stdout?.on('data',chunk=>logs+=chunk);child.stderr?.on('data',chunk=>logs+=chunk);const base=`http://127.0.0.1:${port}`;for(let n=0;n<150;n++){if(child.exitCode!==null)throw new Error(logs);try{if((await fetch(base+'/api/health')).ok)return base;}catch{}await new Promise(resolve=>setTimeout(resolve,100));}throw new Error('Control server not ready: '+logs);}
 const base=await server();
 const request=async(url:string,method='GET',body?:unknown,cookie='',host=base)=>{const response=await fetch(host+url,{method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});const type=response.headers.get('content-type')||'';const data=response.status===204?null:type.includes('json')?await response.json():await response.text();return {status:response.status,data,cookie:response.headers.get('set-cookie')?.split(';')[0]||''};};
 const login=async(identifier:string,password='ControlStaff1234')=>{const result=await request('/api/auth/login','POST',{identifier,password});assert.equal(result.status,200,JSON.stringify(result.data));return result.cookie;};
 const records=async(resource:string,cookie:string)=>(await request('/api/manage/records/'+resource,'GET',undefined,cookie)).data.records as any[];
 const save=async(resource:string,values:any,cookie:string,record?:any)=>request('/api/manage/records/'+resource+(record?'/'+record.id:''),record?'PATCH':'POST',{values,expectedRevision:record?.revision||null},cookie);
 try{
  const admin=await login('admin@control.test','ControlAdmin1234');
  assert.equal((await request('/api/manage/session')).status,401);
  const actors:Record<string,{cookie:string;id:string}>={};let index=1;
  for(const role of ['editor','support','reservations']){const result=await request('/api/manage/staff','POST',{fullName:'همکار آزمایشی '+role,phone:'0912111000'+index++,email:role+'@control.test',password:'ControlStaff1234',agreeTerms:true,role},admin);assert.equal(result.status,201,JSON.stringify(result.data));actors[role]={cookie:await login(role+'@control.test'),id:result.data.user.id};}
  const concurrentStaff=await Promise.all([1,2].map(number=>request('/api/manage/staff','POST',{fullName:'همکار هم‌زمان '+number,phone:'0912111888'+number,email:`parallel-${number}@control.test`,password:'ControlStaff1234',agreeTerms:true,role:'editor'},admin)));assert.ok(concurrentStaff.every(result=>result.status===201));const staffList=(await request('/api/manage/staff','GET',undefined,admin)).data.users;assert.ok([1,2].every(number=>staffList.some((user:any)=>user.email===`parallel-${number}@control.test`)),'concurrent account creation must preserve both accounts');
  const reader=await request('/api/auth/register','POST',{fullName:'همسفر آزمایشی',phone:'09121119999',email:'reader@control.test',password:'ControlReader1234',agreeTerms:true});assert.equal(reader.status,201);const member=reader.cookie;
  assert.equal((await request('/api/manage/session','GET',undefined,member)).status,403);
  for(const denied of ['/api/manage/staff','/api/manage/audit','/api/manage/messages','/api/admin/booking/state','/api/admin/shop/orders','/api/admin/newsletter/subscribers','/api/admin/dashboard'])assert.equal((await request(denied,'GET',undefined,actors.editor.cookie)).status,403,denied);
  assert.equal((await request('/api/manage/messages','GET',undefined,actors.support.cookie)).status,200);
  assert.equal((await request('/api/admin/newsletter/subscribers','GET',undefined,actors.support.cookie)).status,200);
  assert.equal((await request('/api/manage/records/tours','GET',undefined,actors.support.cookie)).status,403);
  assert.equal((await request('/api/admin/booking/state','GET',undefined,actors.reservations.cookie)).status,200);
  assert.equal((await request('/api/manage/records/articles','GET',undefined,actors.reservations.cookie)).status,403);

  const tourValues={title:'تور واقعی محیط آزمایش',code:'TEST-CONTROL',country:'ایران',destination:'گیلان',durationDays:2,summary:'شرح ثبت‌شده فقط برای بررسی نرم‌افزار در محیط جداگانه',heroImage:'/images/moments/camp.webp',gallery:[{url:'/images/moments/camp.webp',alt:'تصویر آزمایشی',credit:'مجوز آزمایشی',source:''}],included:'حمل‌ونقل، اقامت',excluded:'هزینه‌های شخصی',itinerary:[{title:'روز اول',description:'شرح برنامه آزمایشی'}],leader:'سرپرست آزمایش',status:'published'};
  const createdTour=await save('tours',tourValues,actors.reservations.cookie);assert.equal(createdTour.status,201,JSON.stringify(createdTour.data));const tour=createdTour.data.record;
  const publicTour=(await request('/api/tours')).data.tours.find((item:any)=>item.id===tour.id);assert.equal(publicTour.excluded,tourValues.excluded);assert.equal(publicTour.gallery.length,1);
  assert.equal((await save('tours',tourValues,actors.reservations.cookie)).status,409,'duplicate tour code');

  const copy=(await records('homeText',admin)).find(item=>item.section==='اسلاید اصلی');assert.ok(copy);
  const published=await save('homeText',{value:'متن منتشرشده آزمایش',status:'published'},admin,copy);assert.equal(published.status,200);
  const reviewed=await save('homeText',{value:'متن در انتظار تأیید',status:'review'},actors.editor.cookie,published.data.record);assert.equal(reviewed.status,200);
  assert.equal((await request('/api/site/content')).data.text[copy.source],'متن منتشرشده آزمایش');
  assert.equal((await save('homeText',{value:'انتشار بدون دسترسی',status:'published'},actors.editor.cookie,reviewed.data.record)).status,403);
  const stale=await save('homeText',{value:'بازنویسی نسخه قدیمی',status:'published'},admin,published.data.record);assert.equal(stale.status,409);
  const approved=await save('homeText',{value:'متن در انتظار تأیید',status:'published'},admin,reviewed.data.record);assert.equal(approved.status,200);assert.equal((await request('/api/site/content')).data.text[copy.source],'متن در انتظار تأیید');

  const author=await save('authors',{name:'نویسنده آزمون',bio:'نویسنده محیط جداگانه آزمایش',status:'active'},admin);assert.equal(author.status,201);
  const articleValues={title:'مقاله آزمایش انتشار',slug:'control-publication-test',category:'آزمایش',summary:'بررسی اتصال انتشار مقاله از داشبورد به صفحه مستقل',image:'/images/moments/camp.webp',imageAlt:'تصویر آزمایش',authorId:author.data.record.id,publishedAt:new Date(Date.now()-60000).toISOString(),sections:[{title:'بخش اول',body:'متن مقاله ثبت‌شده در محیط آزمایش.\n\nبند دوم.'}],status:'review'};
  const article=await save('articles',articleValues,actors.editor.cookie);assert.equal(article.status,201,JSON.stringify(article.data));assert.equal((await request('/blog/'+articleValues.slug)).status,404);
  assert.equal((await save('articles',{...articleValues,status:'published'},actors.editor.cookie,article.data.record)).status,403);
  const liveArticle=await save('articles',{...articleValues,status:'published'},admin,article.data.record);assert.equal(liveArticle.status,200);
  const articlePage=await request('/blog/'+articleValues.slug);assert.equal(articlePage.status,200);assert.ok(articlePage.data.includes(articleValues.title));assert.ok((await request('/sitemap.xml')).data.includes(articleValues.slug));
  assert.equal((await request('/api/site/content')).data.articles[0].author,'نویسنده آزمون');

  assert.equal((await request('/api/comments','POST',{targetType:'tour',targetId:tour.id,body:'نظر آزمایشی',consent:false},member)).status,400);
  assert.equal((await request('/api/comments','POST',{targetType:'tour',targetId:tour.id,body:'نظر آزمایشی',consent:true,status:'published',authorName:'نام جعل‌شده'},member)).status,400);
  const comment=await request('/api/comments','POST',{targetType:'tour',targetId:tour.id,body:'نظر ثبت‌شده همسفر در محیط آزمایش',consent:true},member);assert.equal(comment.status,201);
  const commentUrl=`/api/comments?type=tour&id=${tour.id}`;assert.equal((await request(commentUrl)).data.records.length,0);
  const moderation=(await records('comments',actors.support.cookie))[0];assert.equal(moderation.status,'pending');
  assert.equal((await save('comments',{status:'published',moderationNote:'رضایت انتشار بررسی شد'},actors.support.cookie,moderation)).status,200);
  const publishedComments=(await request(commentUrl)).data.records;assert.equal(publishedComments.length,1);assert.equal(publishedComments[0].authorName,'همسفر آزمایشی');assert.equal('authorId' in publishedComments[0],false);

  let destination=(await records('destinations',admin))[0];const destinationValues=controlDraft('destinations',destination);
  assert.equal((await save('destinations',{...destinationValues,weatherEnabled:true},admin,destination)).status,400);
  let weather=await save('destinations',{...destinationValues,weatherEnabled:true,temperature:21,condition:'گزارش آزمایشی',weatherSource:'https://weather.example.test/report',observedAt:new Date(Date.now()-3600000).toISOString(),expiresAt:new Date(Date.now()+3600000).toISOString()},admin,destination);assert.equal(weather.status,200,JSON.stringify(weather.data));
  assert.equal((await request('/api/site/content')).data.destinations.find((item:any)=>item.id===destination.id).weather.temperature,21);
  destination=weather.data.record;weather=await save('destinations',{...controlDraft('destinations',destination),expiresAt:new Date(Date.now()-1000).toISOString()},admin,destination);assert.equal(weather.status,200);assert.equal((await request('/api/site/content')).data.destinations.find((item:any)=>item.id===destination.id).weather,null);
  assert.equal((await save('social',{title:'اینستاگرام',network:'instagram',url:'https://instagram.com/#instagram',enabled:true},admin)).status,400);
  const social=await save('social',{title:'حساب آزمایشی',network:'instagram',url:'https://instagram.com/control_fixture',enabled:true},admin);assert.equal(social.status,201);assert.equal((await request('/api/site/content')).data.social.length,1);

  const departure=await request('/api/admin/booking/departures','POST',{tourId:tour.id,startsAt:new Date(Date.now()+7*86400000).toISOString(),capacity:8,externalSold:0,price:100000,active:true,movementStatus:'confirmed',origins:[{id:'origin',title:'تهران',price:0,meetingPoint:'محل ملاقات آزمایشی',departureTime:'06:30'}],tents:[{id:'tent',title:'چادر آزمایشی',price:0,capacity:2}],extras:[],groupDiscount:{minimum:4,percent:0},cancellation:{enabled:true,cutoffHours:24,feePercent:0}},actors.reservations.cookie);assert.equal(departure.status,201,JSON.stringify(departure.data));
  const coupon=await save('coupons',{title:'کد محدود آزمایش',code:'CONTROL20',kind:'percent',value:20,minAmount:0,maxUses:1,validFrom:new Date(Date.now()-60000).toISOString(),validUntil:new Date(Date.now()+86400000).toISOString(),tourIds:[tour.id],enabled:true},actors.reservations.cookie);assert.equal(coupon.status,201);
  const selection={departureId:departure.data.departure.id,guests:1,originId:'origin',tentId:'tent',extras:[],couponCode:'CONTROL20'};
  const quote=await request('/api/bookings/quote','POST',selection);assert.equal(quote.status,200);assert.equal(quote.data.quote.total,80000);assert.equal(quote.data.quote.originDetails.departureTime,'06:30');
  assert.equal((await request('/api/bookings/quote','POST',{...selection,couponCode:'UNKNOWN'})).status,400);
  const second=await server();const baseCode='123456700';const checksum=baseCode.split('').reduce((sum,digit,i)=>sum+Number(digit)*(10-i),0)%11;const nationalCode=baseCode+(checksum<2?checksum:11-checksum);
  const reservation={selection,quoteRevision:quote.data.quote.revision,passengers:[{fullName:'مسافر آزمایش',nationalCode}],contact:{fullName:'هماهنگ‌کننده آزمایشی',phone:'09121112222',email:''},consent:true};
  const race=await Promise.all([base,second].map(host=>request('/api/bookings/reservations','POST',{...reservation,requestKey:crypto.randomUUID()},'',host)));assert.deepEqual(race.map(result=>result.status).sort(),[201,409]);
  assert.equal((await request('/api/bookings/quote','POST',selection)).status,409,'a held coupon cannot be sold twice');
  const held=race.find(result=>result.status===201)!;assert.equal((await request('/api/bookings/cancel','POST',{reference:held.data.booking.reference,token:held.data.token})).status,200);assert.equal((await request('/api/bookings/quote','POST',selection)).status,200,'cancelling an unpaid hold releases coupon capacity');

  assert.equal((await request(`/api/manage/staff/${actors.editor.id}`,'PATCH',{role:'support'},admin)).status,200);
  assert.equal((await request('/api/manage/records/articles','GET',undefined,actors.editor.cookie)).status,403,'role revocation applies to an existing session');
  assert.equal((await request('/api/manage/session','GET',undefined,actors.editor.cookie)).data.user.role,'support');
  const self=(await request('/api/manage/session','GET',undefined,admin)).data.user;
  assert.equal((await request(`/api/manage/staff/${self.id}`,'PATCH',{role:'user'},admin)).status,409);
  const audit=(await request('/api/manage/audit','GET',undefined,admin)).data.records;assert.ok(audit.some((row:any)=>row.resource==='staff'&&row.action==='role.change'));assert.ok(audit.some((row:any)=>row.resource==='homeText'&&row.before&&row.after));assert.ok(audit.some((row:any)=>row.resource==='departures'));assert.equal(JSON.stringify(audit).includes('ControlStaff1234'),false);
 }finally{for(const child of children){child.kill();if(child.exitCode===null)await once(child,'exit');}assert.equal(path.dirname(path.resolve(directory)),path.resolve(tmpdir()));assert.ok(path.basename(directory).startsWith('friendly-control-test-'));await rm(directory,{recursive:true,force:true});}
});

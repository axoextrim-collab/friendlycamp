import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {once} from 'node:events';
import {matchingDepartures,tehranDay,comparisonIds,budgetValue,validDay} from '../src/utils/tourDiscovery';
import {filterTourCatalog} from '../src/utils/travelFilters';
import {routeCoordinates,fitRoute,routeLength} from '../src/utils/routeGeometry';
import {routeSchema,leaderSchema} from '../server/discoverySchemas';
import {routeStructuredData,absoluteStructuredData,safeJsonLd} from '../src/routing/structuredData';
import {EMPTY_TRAVEL} from '../src/types/travel';
import {ARTICLES} from '../src/data/articles';
import type {ShopProduct} from '../src/types/shop';
import type {BookingTour} from '../src/types/booking';

test('date and budget search must match the same future available departure, including Tehran midnight',()=>{
 const tour={id:'tour',title:'جنگل',location:'گیلان',country:'ایران',duration:'۲ روز',travel:{difficulty:'moderate'},departures:[{id:'cheap',startsAt:'2090-06-01T08:00:00Z',active:true,remaining:4,price:100},{id:'expensive',startsAt:'2090-06-10T08:00:00Z',active:true,remaining:4,price:500},{id:'full',startsAt:'2090-06-10T09:00:00Z',active:true,remaining:0,price:100}]} as BookingTour;
 assert.equal(matchingDepartures(tour,{dateFrom:'2090-06-09',maxBudget:200}).length,0);
 assert.equal(matchingDepartures(tour,{dateFrom:'2090-06-09',maxBudget:500})[0].id,'expensive');
 assert.equal(matchingDepartures(tour,{dateFrom:'2090-06-11',dateTo:'2090-06-01'}).length,0);
 assert.equal(tehranDay('2090-06-09T22:00:00Z'),'2090-06-10');
 assert.equal(validDay('2027-02-29'),false);assert.equal(validDay('2028-02-29'),true);
 assert.equal(budgetValue('۱٬۲۰۰٬۰۰۰'),1200000);assert.equal(budgetValue('١٢٣'),123);assert.ok(Number.isNaN(budgetValue('-12')));
 assert.equal(filterTourCatalog([tour],{query:'',region:'all',days:'all',difficulty:'easy'}).length,0);
 assert.deepEqual(comparisonIds(['a','a','../x','b','c','d']),['a','b','c']);
});
test('GPS imports preserve one actual line, assessments cannot overlap and date-line routes fit locally',()=>{
 const points=routeCoordinates({type:'Feature',geometry:{type:'LineString',coordinates:[[179.9,35,40],[-179.9,35,42]]}});
 assert.ok(routeLength(points)<20);assert.ok(fitRoute(points,900,480).zoom>5);
 assert.throws(()=>routeCoordinates({type:'MultiLineString',coordinates:[]}));assert.throws(()=>routeCoordinates({type:'LineString',coordinates:[[1,95],[2,30]]}));
 const route={points,sourceLabel:'منبع آزمون',sourceUrl:'',assessedBy:'مسئول آزمون',method:'روش آزمایش',assessedAt:'2090-01-01T00:00:00Z',validUntil:'2091-01-01T00:00:00Z',assessments:[{from:0,to:1,level:'caution',note:'محدودیت آزمون',source:'https://example.org/assessment'}]};
 assert.equal(routeSchema.safeParse(route).success,true);assert.equal(routeSchema.safeParse({...route,assessments:[...route.assessments,...route.assessments]}).success,false);assert.equal(routeSchema.safeParse({...route,assessedBy:''}).success,false);
 assert.equal(leaderSchema.safeParse({name:'لیدر آزمون',bio:'متن آزمون',qualifications:'سوابق آزمون',image:'',languages:[],credentials:[],status:'published'}).success,false);
});
test('structured data uses TouristTrip, actual IRR offers only when bookable, and safe inline serialization',()=>{
 const tour={id:'test',title:'تور </script><script>alert(1)</script>',image:'/images/a.webp',description:'شرح',departures:[{id:'d',price:1200000,remaining:2,active:true,startsAt:'2090-01-01T00:00:00Z',onlineBookable:false}]} as BookingTour;
 const route={kind:'tour',id:'test',path:'/tours/test'} as const;
 const draft=routeStructuredData(route,[],[tour])!;assert.equal(draft['@type'],'TouristTrip');assert.equal(draft.offers,undefined);assert.equal(draft.aggregateRating,undefined);
 tour.departures[0].onlineBookable=true;const live=routeStructuredData(route,[],[tour])!;assert.equal((live.offers as any[])[0].price,12000000);assert.equal((live.offers as any[])[0].priceCurrency,'IRR');assert.equal((absoluteStructuredData(live,'https://example.org') as any).url,'https://example.org/tours/test');assert.ok(!safeJsonLd(live).includes('</script>'));
});
test('article and product schemas follow published content without inventing authors, ratings or order availability',()=>{
 const article={id:'schema-test',slug:'schema-test',title:'مقاله محیط آزمون',category:'آزمون',summary:'شرح آزمون',image:'/images/test.webp',imageAlt:'آزمون',author:'نویسنده ثبت‌شده',publishedAt:'2026-01-01T00:00:00Z',sections:[{id:'one',title:'بخش اول',paragraphs:['متن منتشرشده']}]};
 ARTICLES.push(article);try{const data=routeStructuredData({kind:'article',id:article.slug,path:'/blog/'+article.slug})!;assert.equal(data['@type'],'Article');assert.equal(data.inLanguage,'fa-IR');assert.equal((data.author as any).name,article.author);assert.ok(String(data.articleBody).includes('متن منتشرشده'));}finally{ARTICLES.splice(ARTICLES.indexOf(article),1);}
 const product={id:'product',sku:'TEST-1',name:'محصول آزمون',brand:'برند ثبت‌شده',model:'مدل ثبت‌شده',image:'/images/test.webp',description:'شرح واقعی',specs:[],price:100000,stock:2,warranty:'شرایط ثبت‌شده ضمانت',salesEnabled:false} as ShopProduct;
 const route={kind:'product',id:'product',path:'/shop/products/product'} as const;assert.equal(routeStructuredData(route,[product])!.offers,undefined);product.salesEnabled=true;const schema=routeStructuredData(route,[product])!;assert.equal((schema.offers as any).price,1000000);assert.equal(schema.aggregateRating,undefined);assert.equal(schema.inLanguage,undefined);
});

test('discovery APIs isolate accounts, persist favorites, compare actual tours, and deduplicate capacity alerts across workers',{timeout:120000},async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'friendly-discovery-test-')),project=process.cwd();const children:ReturnType<typeof spawn>[]=[];
 await mkdir(path.join(directory,'dist'));await writeFile(path.join(directory,'dist','index.html'),await readFile(path.join(project,'index.html')));
 async function server(){const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const address=probe.address();assert.ok(address&&typeof address!=='string');const port=address.port;await new Promise<void>(resolve=>probe.close(()=>resolve()));const child=spawn(process.execPath,['--import',import.meta.resolve('tsx'),path.join(project,'server.ts')],{cwd:directory,windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,PORT:String(port),NODE_ENV:'production',SESSION_SECRET:'discovery-integration-secret-long-enough',BOOKING_PAYMENT_MODE:'sandbox',ADMIN_BOOTSTRAP_EMAIL:'admin@discovery.test',ADMIN_BOOTSTRAP_PASSWORD:'DiscoveryAdmin1234',ADMIN_BOOTSTRAP_PHONE:'09120000000',ADMIN_BOOTSTRAP_NAME:'مدیر آزمون',SMS_HTTP_URL:'',SMS_API_TOKEN:'',MAP_TILE_URL:'',MAP_ATTRIBUTION_TEXT:'',MAP_ATTRIBUTION_URL:''}});children.push(child);let logs='';child.stdout?.on('data',chunk=>logs+=chunk);child.stderr?.on('data',chunk=>logs+=chunk);const base=`http://127.0.0.1:${port}`;for(let i=0;i<180;i++){if(child.exitCode!==null)throw Error(logs);try{if((await fetch(base+'/api/health')).ok)return base;}catch{}await new Promise(resolve=>setTimeout(resolve,100));}throw Error(logs);}
 const base=await server();
 async function call(url:string,method='GET',body?:unknown,cookie='',host=base){const response=await fetch(host+url,{method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});const data=response.status===204?null:(response.headers.get('content-type')||'').includes('json')?await response.json():await response.text();return {status:response.status,data,cookie:response.headers.get('set-cookie')?.split(';')[0]||'',headers:response.headers};}
 const save=(resource:string,values:unknown,cookie:string,record?:any)=>call('/api/manage/records/'+resource+(record?'/'+record.id:''),record?'PATCH':'POST',{values,expectedRevision:record?.revision||null},cookie);
 try{
 const admin=(await call('/api/auth/login','POST',{identifier:'admin@discovery.test',password:'DiscoveryAdmin1234'})).cookie;assert.ok(admin);
 const register=async(phone:string)=>{const result=await call('/api/auth/register','POST',{fullName:'همسفر آزمون',phone,email:phone+'@discovery.test',password:'DiscoveryMember1234',agreeTerms:true});assert.equal(result.status,201);return result.cookie;};
 const alice=await register('09121110001'),bob=await register('09121110002');
 const credentials=[{title:'مدرک آزمایشی',issuer:'مرجع آزمون',number:'TEST-123',source:'https://example.org/credential',validUntil:'2099-01-01T00:00:00Z',noExpiry:false}];
 let leader=(await save('leaders',{name:'لیدر محیط آزمون',bio:'بیوگرافی صرفاً آزمایشی',qualifications:'صلاحیت محیط آزمون',image:'',languages:['فارسی'],credentials,status:'published'},admin)).data.record;assert.ok(leader);
 const route={points:[{lat:35.7,lng:51.4},{lat:35.71,lng:51.41}],sourceLabel:'فقط داده مصنوعی محیط آزمون',sourceUrl:'',assessedBy:'',method:'',assessedAt:'',validUntil:'',assessments:[]};
 const values={title:'تور محیط مستقل آزمون',code:'DISCOVERY-1',destination:'مقصد آزمون',country:'ایران',durationDays:2,summary:'شرح صرفاً برای آزمون نرم‌افزار',heroImage:'/images/moments/camp.webp',gallery:[],included:'خدمت آزمایشی',excluded:'خدمات شخصی',itinerary:[],leader:'نام قدیمی',travel:{...EMPTY_TRAVEL,leaderId:leader.id,equipment:['کفش مناسب','آب آشامیدنی']},route,status:'published'};
 const result=await save('tours',values,admin);assert.equal(result.status,201,JSON.stringify(result.data));let tour=result.data.record;const second=(await save('tours',{...values,code:'DISCOVERY-2',title:'برنامه دوم آزمون'},admin)).data.record;
 assert.equal((await call('/api/account/tour-favorites')).status,401);
 for(let i=0;i<2;i++)assert.equal((await call('/api/account/tour-favorites','POST',{tourId:tour.id,enabled:true},alice)).status,200);
 assert.deepEqual((await call('/api/account/tour-favorites','GET',undefined,alice)).data.ids,[tour.id]);assert.deepEqual((await call('/api/account/tour-favorites','GET',undefined,bob)).data.ids,[]);
 assert.equal((await call('/api/account/tour-favorites','POST',{tourId:'missing',enabled:true},alice)).status,404);
 assert.equal((await call(`/api/tours/compare?ids=${tour.id},${second.id},a,b`)).status,400);assert.equal((await call(`/api/tours/compare?ids=${tour.id},${tour.id}`)).status,400);assert.equal((await call(`/api/tours/compare?ids=${tour.id},missing`)).status,404);
 const comparison=await call(`/api/tours/compare?ids=${tour.id},${second.id}`);assert.equal(comparison.status,200);assert.equal(comparison.data.tours[0].travel.leaderName,'لیدر محیط آزمون');assert.equal(comparison.data.tours[0].route,undefined);assert.equal(comparison.data.tours[0].routeAvailable,true);
 assert.deepEqual((await call(`/api/tours/${tour.id}/route`)).data.route.points,route.points);
 const equipment=await call(`/api/tours/${tour.id}/equipment`);assert.equal(equipment.status,200);assert.ok(equipment.data.includes('کفش مناسب'));assert.match(equipment.headers.get('content-disposition')||'',/attachment/);
 assert.equal((await call('/leaders/'+leader.id)).status,200);assert.ok((await call('/sitemap.xml')).data.includes('/leaders/'+leader.id));
 const departureInput={tourId:tour.id,startsAt:new Date(Date.now()+20*86400000).toISOString(),capacity:8,externalSold:0,price:1200000,active:true,origins:[{id:'origin',title:'مبدأ آزمون',price:0}],tents:[{id:'tent',title:'چادر آزمون',price:0,capacity:2}],extras:[],groupDiscount:{minimum:4,percent:0},cancellation:{enabled:true,cutoffHours:24,feePercent:10}};
 let departure=(await call('/api/admin/booking/departures','POST',departureInput,admin)).data.departure;assert.ok(departure);
 assert.equal((await call('/api/account/capacity-watches','POST',{departureId:departure.id,threshold:9,enabled:true},alice)).status,400);
 await call('/api/account/capacity-watches','POST',{departureId:departure.id,threshold:5,enabled:true},alice);
 const worker=await server();assert.deepEqual((await call('/api/account/tour-favorites','GET',undefined,alice,worker)).data.ids,[tour.id]);
 async function sold(count:number){const {remaining,...config}=departure;departure=(await call('/api/admin/booking/departures','POST',{...config,externalSold:count},admin)).data.departure;assert.ok(departure);}
 await sold(3);const responses=await Promise.all([call('/api/account/capacity-alerts','GET',undefined,alice),call('/api/account/capacity-alerts','GET',undefined,alice,worker)]);for(const response of responses){assert.equal(response.data.alerts.length,1);assert.equal(response.data.alerts[0].before,8);assert.equal(response.data.alerts[0].remaining,5);}
 const alertId=responses[0].data.alerts[0].id;assert.equal((await call('/api/account/capacity-alerts','GET',undefined,bob)).data.alerts.length,0);await call('/api/account/capacity-alerts/read','POST',{ids:[alertId]},bob);assert.equal((await call('/api/account/capacity-alerts','GET',undefined,alice)).data.unread,1);
 await sold(1);await call('/api/account/capacity-alerts','GET',undefined,alice);await sold(4);assert.equal((await call('/api/account/capacity-alerts','GET',undefined,alice)).data.alerts.length,2);
 await call('/api/account/capacity-alerts/read','POST',{ids:[alertId]},alice);assert.equal((await call('/api/account/capacity-alerts','GET',undefined,alice)).data.unread,1);
 const html=(await call('/tours/'+tour.id)).data;assert.match(html,/TouristTrip/);assert.ok(!html.includes('priceCurrency'),'sandbox must not advertise a real sales offer');
 leader=(await save('leaders',{name:leader.name,bio:leader.bio,qualifications:leader.qualifications,image:'',languages:leader.languages,credentials,status:'archived'},admin,leader)).data.record;
 const catalog=(await call('/api/tours')).data.tours;assert.equal(catalog.find((item:any)=>item.id===tour.id).travel.leaderName,'');assert.equal(catalog.find((item:any)=>item.id===tour.id).leaderName,'');assert.equal((await call('/leaders/'+leader.id)).status,404);
 await call('/api/manage/records/tours/'+tour.id,'DELETE',{expectedRevision:tour.revision},admin);assert.equal((await call('/api/account/tour-favorites','POST',{tourId:tour.id,enabled:false},alice)).status,200);
 }finally{for(const child of children){child.kill();if(child.exitCode===null)await once(child,'exit');}const resolved=path.resolve(directory);assert.ok(resolved.startsWith(path.resolve(tmpdir())+path.sep)&&path.basename(resolved).startsWith('friendly-discovery-test-'));await rm(resolved,{recursive:true,force:true});}
});

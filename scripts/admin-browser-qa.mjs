// An isolated workspace for browser testing. No writes to the site's actual users or content.
import {mkdtemp,mkdir,copyFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {once} from 'node:events';
import crypto from 'node:crypto';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const directory=await mkdtemp(path.join(tmpdir(),'friendly-admin-browser-'));
await mkdir(path.join(directory,'data'));await mkdir(path.join(directory,'uploads'));
await copyFile(path.join(project,'tests/fixtures/admin.json'),path.join(directory,'data/admin.json'));
const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
const base=`http://localhost:${port}`;
const child=spawn(process.execPath,['--import',import.meta.resolve('tsx'),path.join(project,'server.ts')],{cwd:project,windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,PORT:String(port),NODE_ENV:'development',DATABASE_BACKEND:'sqlite',DATABASE_URL:'',APP_DATA_DIR:path.join(directory,'data'),UPLOADS_DIR:path.join(directory,'uploads'),UPLOAD_STORAGE:'local',PUBLIC_SITE_URL:base,BOOKING_PAYMENT_MODE:'sandbox',SESSION_SECRET:crypto.randomBytes(32).toString('hex'),ADMIN_BOOTSTRAP_EMAIL:'admin@dashboard-qa.test',ADMIN_BOOTSTRAP_PASSWORD:'DashboardQa1234',ADMIN_BOOTSTRAP_PHONE:'09120000000',ADMIN_BOOTSTRAP_NAME:'مدیر محیط بررسی',PAYMENT_HTTP_URL:'',PAYMENT_API_TOKEN:'',SMS_HTTP_URL:'',SMS_API_TOKEN:''}});
let logs='';child.stdout.on('data',chunk=>logs+=chunk);child.stderr.on('data',chunk=>{logs+=chunk;if(/error/i.test(String(chunk)))process.stderr.write(chunk);});
try{
 let ready=false;for(let i=0;i<200;i++){if(child.exitCode!==null)throw Error(logs);try{if((await fetch(base+'/api/health')).ok){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,100));}if(!ready)throw Error('Preview startup timed out');
 const response=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier:'admin@dashboard-qa.test',password:'DashboardQa1234'})});if(!response.ok)throw Error('Preview login failed');
 const cookie=response.headers.get('set-cookie').split(';')[0];
 const state=await(await fetch(base+'/api/admin/booking/state',{headers:{Cookie:cookie}})).json();
 const tour=state.tours[0];if(tour){const created=await fetch(base+'/api/admin/booking/departures',{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({tourId:tour.id,startsAt:new Date(Date.now()+7*86400000).toISOString(),capacity:24,externalSold:8,price:4850000,active:true,origins:[{id:'qa-origin',title:'مبدأ محیط بررسی',price:0}],tents:[{id:'qa-tent',title:'چادر محیط بررسی',price:0,capacity:2}],extras:[],groupDiscount:{minimum:4,percent:5},cancellation:{enabled:true,cutoffHours:24,feePercent:10}})});if(!created.ok)throw Error('Preview departure failed');}
 console.log(`ADMIN_PREVIEW=${base}/admin\nISOLATED_DATA=true\nEnter stop to close preview.`);
 await new Promise(resolve=>{process.once('SIGINT',resolve);process.once('SIGTERM',resolve);child.once('exit',resolve);process.stdin.setEncoding('utf8');process.stdin.on('data',input=>{if(input.trim()==='stop')resolve();});process.stdin.resume();});process.stdin.pause();
}finally{child.kill();if(child.exitCode===null)await once(child,'exit');const target=path.resolve(directory);if(!target.startsWith(path.resolve(tmpdir())+path.sep)||!path.basename(target).startsWith('friendly-admin-browser-'))throw Error('Invalid preview path');await rm(target,{recursive:true,force:true});}

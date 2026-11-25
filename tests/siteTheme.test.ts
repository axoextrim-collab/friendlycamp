import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,copyFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {DEFAULT_SITE_THEME,SITE_PALETTES} from '../src/types/siteTheme';
import {contrastRatio,normalizeSiteTheme,readableText,siteThemeCss,themeContrastIssues,themeVariables,validSiteTheme} from '../src/utils/siteTheme';
import {siteThemeSchema} from '../server/siteTheme';

test('theme palettes have readable light and dark text, safe CSS values and legible derived buttons',()=>{
 for(const palette of SITE_PALETTES){const theme={mode:'system' as const,palette:palette.id,light:palette.light,dark:palette.dark};assert.equal(validSiteTheme(theme),true);assert.deepEqual(themeContrastIssues(theme),[],palette.id);assert.equal(siteThemeSchema.safeParse(theme).success,true,palette.id);for(const colors of [palette.light,palette.dark]){const variables=themeVariables(colors);assert.ok(contrastRatio(variables['--site-primary-strong'],variables['--site-on-primary'])>=4.5);assert.ok(contrastRatio(colors.accent,variables['--site-on-accent'])>=4.5);assert.ok(contrastRatio(variables['--site-primary-ink'],colors.surface)>=4.5);}}
 assert.equal(readableText('#FFFFFF'),'#14201A');assert.equal(readableText('#101010'),'#FFFFFF');assert.equal(contrastRatio('#000000','#FFFFFF'),21);
 const unsafe={...structuredClone(DEFAULT_SITE_THEME),light:{...DEFAULT_SITE_THEME.light,primary:'url(https://example.org)'}};assert.equal(validSiteTheme(unsafe),false);assert.deepEqual(normalizeSiteTheme(unsafe),DEFAULT_SITE_THEME);assert.equal(siteThemeSchema.safeParse(unsafe).success,false);
 const unreadable=structuredClone(DEFAULT_SITE_THEME);unreadable.light.text='#FFFFFF';assert.ok(themeContrastIssues(unreadable).length);assert.equal(siteThemeSchema.safeParse(unreadable).success,false);
 assert.match(siteThemeCss(DEFAULT_SITE_THEME),/prefers-color-scheme:dark/);assert.ok(!siteThemeCss(DEFAULT_SITE_THEME).includes('</style>'));
});

test('theme publication is admin-only, versioned, audited, persistent and rendered before the first public paint',{timeout:120000},async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'friendly-theme-test-')),project=process.cwd(),children:ReturnType<typeof spawn>[]=[];
 await mkdir(path.join(directory,'data'));await mkdir(path.join(directory,'dist'));await copyFile(path.join(project,'tests/fixtures/admin.json'),path.join(directory,'data/admin.json'));await copyFile(path.join(project,'index.html'),path.join(directory,'dist/index.html'));
 async function server(){const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const address=probe.address();assert.ok(address&&typeof address!=='string');const port=address.port;await new Promise<void>(resolve=>probe.close(()=>resolve()));const child=spawn(process.execPath,['--import',import.meta.resolve('tsx'),path.join(project,'server.ts')],{cwd:directory,windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,PORT:String(port),NODE_ENV:'production',APP_DATA_DIR:path.join(directory,'data'),UPLOADS_DIR:path.join(directory,'uploads'),DATABASE_BACKEND:'sqlite',DATABASE_URL:'',UPLOAD_STORAGE:'local',SESSION_SECRET:'theme-test-stable-secret-at-least-32-characters',BOOKING_PAYMENT_MODE:'sandbox',ADMIN_BOOTSTRAP_EMAIL:'admin@theme.test',ADMIN_BOOTSTRAP_PASSWORD:'ThemeAdmin1234',ADMIN_BOOTSTRAP_PHONE:'09120000000',ADMIN_BOOTSTRAP_NAME:'مدیر محیط آزمون',PAYMENT_HTTP_URL:'',PAYMENT_API_TOKEN:'',SMS_HTTP_URL:'',SMS_API_TOKEN:''}});children.push(child);let logs='';child.stdout.on('data',v=>logs+=v);child.stderr.on('data',v=>logs+=v);const base=`http://127.0.0.1:${port}`;for(let i=0;i<200;i++){if(child.exitCode!==null)throw Error(logs);try{if((await fetch(base+'/api/health')).ok)return {base,child};}catch{}await new Promise(resolve=>setTimeout(resolve,100));}throw Error(logs);}
 const worker=await server();
 async function call(url:string,method='GET',body?:unknown,cookie='',host=worker.base){const response=await fetch(host+url,{method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:response.status,data:response.headers.get('content-type')?.includes('json')?await response.json():await response.text(),cookie:response.headers.get('set-cookie')?.split(';')[0]||'',cache:response.headers.get('cache-control')};}
 try{
 const admin=(await call('/api/auth/login','POST',{identifier:'admin@theme.test',password:'ThemeAdmin1234'})).cookie;assert.ok(admin);
 const member=(await call('/api/auth/register','POST',{fullName:'عضو آزمون پالت',phone:'09121112222',email:'member@theme.test',password:'ThemeMember1234',agreeTerms:true})).cookie;
 assert.equal((await call('/api/manage/site-theme')).status,401);assert.equal((await call('/api/manage/site-theme','GET',undefined,member)).status,403);
 const initial=await call('/api/manage/site-theme','GET',undefined,admin);assert.equal(initial.status,200);assert.deepEqual(initial.data.theme,DEFAULT_SITE_THEME);assert.equal(initial.data.revision,null);
 const palette=SITE_PALETTES.find(p=>p.id==='ocean')!,theme={mode:'dark',palette:palette.id,light:palette.light,dark:palette.dark};
 assert.equal((await call('/api/manage/site-theme','PUT',{theme,expectedRevision:null},member)).status,403);
 const saved=await call('/api/manage/site-theme','PUT',{theme,expectedRevision:null},admin);assert.equal(saved.status,200,JSON.stringify(saved.data));assert.ok(saved.data.revision);assert.equal(saved.cache,'no-store');
 assert.equal((await call('/api/manage/site-theme','PUT',{theme:{...theme,mode:'light'},expectedRevision:null},admin)).status,409);
 const invalid={...structuredClone(theme),dark:{...theme.dark,text:theme.dark.surface}};assert.equal((await call('/api/manage/site-theme','PUT',{theme:invalid,expectedRevision:saved.data.revision},admin)).status,400);
 assert.equal((await call('/api/manage/site-theme','PUT',{theme:{...theme,extra:'injected'},expectedRevision:saved.data.revision},admin)).status,400);
 const publicSettings=await call('/api/site/design-settings');assert.deepEqual(publicSettings.data.settings.appearance,theme);assert.equal(publicSettings.cache,'no-store');assert.ok(!JSON.stringify(publicSettings.data).includes('revision'));
 const html=await call('/');assert.ok(html.data.includes('data-fc-theme-mode="dark"'));assert.ok(html.data.includes('<style id="fc-site-theme">'));assert.ok(html.data.includes('--site-primary:'+palette.dark.primary));
 const adminPage=await call('/admin');assert.ok(!adminPage.data.includes('data-fc-site-theme="true"'),'public theme does not recolor the management console');
 const audit=await call('/api/manage/audit','GET',undefined,admin);assert.ok(audit.data.records.some((r:any)=>r.action==='theme.publish'&&r.record_id==='site-theme'));
 const second=await server();assert.deepEqual((await call('/api/site/design-settings','GET',undefined,'',second.base)).data.settings.appearance,theme);
 worker.child.kill();await once(worker.child,'exit');const restart=await server();assert.deepEqual((await call('/api/manage/site-theme','GET',undefined,admin,restart.base)).data.theme,theme);
 }finally{for(const child of children)if(child.exitCode===null&&child.signalCode===null){child.kill();await once(child,'exit');}const resolved=path.resolve(directory);assert.ok(resolved.startsWith(path.resolve(tmpdir())+path.sep)&&path.basename(resolved).startsWith('friendly-theme-test-'));await rm(resolved,{recursive:true,force:true});}
});

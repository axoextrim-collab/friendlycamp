import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer as httpServer} from 'node:http';
import {createServer} from 'node:net';
import {once} from 'node:events';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,mkdir,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {DatabaseSync} from 'node:sqlite';
import {isMountPoint} from '../server/deployment';
import {validUploadName} from '../server/supabaseStorage';
const execute=promisify(execFile);

test('deployment mount checks and upload names do not accept unrelated paths',()=>{
 const mounts='1 2 0:1 / / rw - overlay overlay rw\n2 1 0:2 / /app/data rw - ext4 /dev/disk rw\n';
 assert.equal(isMountPoint('/app/data',mounts),true);assert.equal(isMountPoint('/app/data-other',mounts),false);assert.equal(isMountPoint('/app/data/runtime',mounts),false);
 assert.equal(validUploadName('abc-123.png'),true);for(const name of ['../a.png','a.svg','a.png/other','a..png','a.html','a%2fpng'])assert.equal(validUploadName(name),false,name);
});

test('Render-style storage paths and private Supabase uploads survive restart without exposing credentials',{timeout:120000},async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'friendly-cloud-test-')),project=process.cwd();const processes:ReturnType<typeof spawn>[]=[];
 let privateBucket=false,denyUpload=false,bucketReads=0;const objects=new Map<string,Buffer>();const key='sb_secret_fake_integration_key';
 const remote=httpServer(async(req,res)=>{assert.equal(req.headers.apikey,key);assert.equal(req.headers.authorization,undefined,'new secret keys belong in apikey, not a JWT bearer header');
  if(req.url==='/storage/v1/bucket/friendlycamp-uploads'){bucketReads++;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({id:'friendlycamp-uploads',public:!privateBucket}));return;}
  const prefix='/storage/v1/object/';if(!req.url?.startsWith(prefix)){res.writeHead(404).end();return;}
  if(req.method==='POST'){if(denyUpload){res.writeHead(403,{'Content-Type':'application/json'}).end(JSON.stringify({message:'upstream details must stay private'}));return;}
   assert.equal(req.headers['x-upsert'],'false');assert.equal(req.headers['cache-control'],'max-age=31536000');const name=req.url.split('/').pop()!;if(objects.has(name)){res.writeHead(409).end();return;}const chunks:Buffer[]=[];for await(const chunk of req)chunks.push(Buffer.from(chunk));objects.set(name,Buffer.concat(chunks));res.writeHead(200,{'Content-Type':'application/json'}).end('{}');return;}
  const name=req.url.split('/').pop()!,bytes=objects.get(name);if(!bytes){res.writeHead(400,{'Content-Type':'application/json'}).end(JSON.stringify({statusCode:'404'}));return;}
  assert.ok(req.url.startsWith('/storage/v1/object/authenticated/'));res.setHeader('Content-Type','image/png');res.setHeader('Accept-Ranges','bytes');res.setHeader('ETag','test-file');
  if(req.headers.range==='bytes=0-3'){res.writeHead(206,{'Content-Range':`bytes 0-3/${bytes.length}`,'Content-Length':4}).end(bytes.subarray(0,4));return;}res.setHeader('Content-Length',bytes.length);res.end(bytes);
 });remote.listen(0,'127.0.0.1');await once(remote,'listening');const remoteAddress=remote.address();assert.ok(remoteAddress&&typeof remoteAddress!=='string');
 const state=path.join(root,'persistent'),uploads=path.join(root,'transient');
 const env={...process.env,NODE_ENV:'production',SESSION_SECRET:'cloud-tests-private-secret-long-enough',APP_DATA_DIR:state,UPLOADS_DIR:uploads,UPLOAD_STORAGE:'supabase',SUPABASE_URL:`http://127.0.0.1:${remoteAddress.port}`,SUPABASE_SECRET_KEY:key,SUPABASE_SERVICE_ROLE_KEY:'',SUPABASE_STORAGE_BUCKET:'friendlycamp-uploads',BOOKING_PAYMENT_MODE:'disabled',REQUIRE_PERSISTENT_DISK:'false',RENDER:'',ADMIN_BOOTSTRAP_EMAIL:'',ADMIN_BOOTSTRAP_PASSWORD:'',SMS_HTTP_URL:'',SMS_API_TOKEN:''};
 await mkdir(path.join(root,'dist'));await writeFile(path.join(root,'dist','index.html'),await readFile(path.join(project,'index.html')));
 async function server(){const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const address=probe.address();assert.ok(address&&typeof address!=='string');const port=address.port;await new Promise<void>(resolve=>probe.close(()=>resolve()));const child=spawn(process.execPath,['--import',import.meta.resolve('tsx'),path.join(project,'server.ts')],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...env,PORT:String(port)}});processes.push(child);let logs='';child.stdout?.on('data',part=>logs+=part);child.stderr?.on('data',part=>logs+=part);const base=`http://127.0.0.1:${port}`;for(let i=0;i<150;i++){if(child.exitCode!==null)throw new Error(logs);try{if((await fetch(base+'/api/health')).ok)return {base,child};}catch{}await new Promise(resolve=>setTimeout(resolve,100));}throw new Error(logs);}
 try{
  let running=await server();let base=running.base;
  assert.equal((await fetch(base+'/api/ready')).status,503,'a public bucket must not pass readiness');privateBucket=true;assert.equal((await fetch(base+'/api/ready')).status,200);
  const register=await fetch(base+'/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fullName:'همسفر آزمایش ابری',phone:'09121112222',email:'cloud@example.test',password:'CloudTesting1234',agreeTerms:true})});assert.equal(register.status,201);const cookie=register.headers.get('set-cookie')!.split(';')[0];
  const bytes=Buffer.from('89504e470d0a1a0a','hex');const upload=async()=>{const form=new FormData();form.set('file',new Blob([bytes],{type:'image/png'}),'image.png');return fetch(base+'/api/profile/upload',{method:'POST',headers:{Cookie:cookie},body:form});};
  const response=await upload();assert.equal(response.status,201);const file=await response.json();assert.match(file.url,/^\/uploads\/[\w-]+\.png$/);assert.ok(!JSON.stringify(file).includes(key));assert.deepEqual(Buffer.from(await(await fetch(base+file.url)).arrayBuffer()),bytes);
  const range=await fetch(base+file.url,{headers:{Range:'bytes=0-3'}});assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,4);assert.equal(range.headers.get('content-range'),'bytes 0-3/8');
  assert.equal((await fetch(base+'/uploads/missing.png')).status,404);assert.equal((await fetch(base+'/uploads/file.svg')).status,404);
  denyUpload=true;const failure=await upload();assert.equal(failure.status,503);assert.ok(!(await failure.text()).includes('upstream details'));denyUpload=false;
  for(let i=0;i<20&&(await readdir(uploads)).length;i++)await new Promise(resolve=>setTimeout(resolve,25));assert.deepEqual(await readdir(uploads),[],'temporary local files are removed on success and failure');
  assert.ok((await readdir(state)).includes('users.json'));assert.ok(!(await readdir(root)).includes('data'),'all state must use the persistent directory');
  const source=path.join(root,'existing-uploads');await mkdir(source);await writeFile(path.join(source,'legacy-file.png'),bytes);
  const args=['--import',import.meta.resolve('tsx'),path.join(project,'scripts/migrate-supabase-uploads.ts')];
  await execute(process.execPath,args,{cwd:root,env:{...env,UPLOADS_DIR:source}});assert.ok(!objects.has('legacy-file.png'));
  await execute(process.execPath,[...args,'--execute'],{cwd:root,env:{...env,UPLOADS_DIR:source}});assert.ok(objects.has('legacy-file.png'));
  const repeated=await execute(process.execPath,[...args,'--execute'],{cwd:root,env:{...env,UPLOADS_DIR:source}});assert.match(repeated.stdout,/1 identical/);
  await writeFile(path.join(source,'legacy-file.png'),'changed');await assert.rejects(execute(process.execPath,[...args,'--execute'],{cwd:root,env:{...env,UPLOADS_DIR:source}}));assert.deepEqual(objects.get('legacy-file.png'),bytes,'migration must never overwrite a different object');
  running.child.kill();if(running.child.exitCode===null)await once(running.child,'exit');running=await server();base=running.base;
  assert.equal((await fetch(base+'/api/ready')).status,200);assert.equal((await fetch(base+'/api/auth/me',{headers:{Cookie:cookie}})).status,200);assert.deepEqual(Buffer.from(await(await fetch(base+file.url)).arrayBuffer()),bytes);assert.ok(bucketReads>=3);
 }finally{
  for(const child of processes){if(child.exitCode===null&&child.signalCode===null){child.kill();await once(child,'exit');}}
  await new Promise<void>(resolve=>remote.close(()=>resolve()));const absolute=path.resolve(root);assert.ok(absolute.startsWith(path.resolve(tmpdir())+path.sep)&&path.basename(absolute).startsWith('friendly-cloud-test-'));await rm(absolute,{recursive:true,force:true});
 }
});

test('offline data export/import verifies SQLite and checksums, preserves originals and rejects overwrites',{timeout:30000},async()=>{
 const project=process.cwd(),root=await mkdtemp(path.join(tmpdir(),'friendly-data-transfer-')),source=path.join(root,'original'),target=path.join(root,'restored');await mkdir(source);let exported='';
 try{
  await writeFile(path.join(source,'users.json'),JSON.stringify([{id:'fixture-user'}]));const db=new DatabaseSync(path.join(source,'bookings.sqlite'));db.exec("CREATE TABLE example(id TEXT);INSERT INTO example VALUES('fixture');");db.close();
  const output=await execute(process.execPath,[path.join(project,'scripts/export-render-data.mjs'),'--offline'],{cwd:project,env:{...process.env,APP_DATA_DIR:source}});exported=output.stdout.match(/Private export ready: (.+?)\. Transfer/)?.[1]||'';assert.ok(exported.startsWith(path.join(project,'.deployment')+path.sep));
  await execute(process.execPath,[path.join(project,'scripts/import-render-data.mjs'),exported,target]);assert.deepEqual(JSON.parse(await readFile(path.join(target,'users.json'),'utf8')),[{id:'fixture-user'}]);
  const restored=new DatabaseSync(path.join(target,'bookings.sqlite'),{readOnly:true});assert.equal(restored.prepare('SELECT id FROM example').get()?.id,'fixture');restored.close();
  await assert.rejects(execute(process.execPath,[path.join(project,'scripts/import-render-data.mjs'),exported,target]));
  await writeFile(path.join(exported,'users.json'),'[]');await assert.rejects(execute(process.execPath,[path.join(project,'scripts/import-render-data.mjs'),exported,path.join(root,'tampered')]));assert.equal(await readFile(path.join(source,'users.json'),'utf8'),'[{"id":"fixture-user"}]');
 }finally{
  if(exported){assert.ok(path.resolve(exported).startsWith(path.join(project,'.deployment')+path.sep));await rm(exported,{recursive:true,force:true});}
  assert.ok(path.resolve(root).startsWith(path.resolve(tmpdir())+path.sep)&&path.basename(root).startsWith('friendly-data-transfer-'));await rm(root,{recursive:true,force:true});
 }
});

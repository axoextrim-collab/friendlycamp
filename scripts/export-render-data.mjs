import 'dotenv/config';
import {mkdtemp,mkdir,readFile,writeFile} from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {DatabaseSync,backup} from 'node:sqlite';
if(!process.argv.includes('--offline'))throw new Error('Stop all Friendly Camp writers first, then pass --offline. This exports private account and reservation data.');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.resolve(process.env.APP_DATA_DIR||path.join(root,'data'));
const parent=path.join(root,'.deployment');await mkdir(parent,{recursive:true});
const destination=await mkdtemp(path.join(parent,'data-'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');const files={};
for(const name of ['admin.json','users.json','profiles.json','newsletter.json']){
 const file=path.join(source,name);if(!fs.existsSync(file))continue;
 const bytes=await readFile(file);JSON.parse(bytes.toString('utf8'));await writeFile(path.join(destination,name),bytes,{mode:0o600,flag:'wx'});files[name]=hash(bytes);
}
const databaseFile=path.join(source,'bookings.sqlite');
if(fs.existsSync(databaseFile)){const database=new DatabaseSync(databaseFile,{readOnly:true});try{if(database.prepare('PRAGMA quick_check').get().quick_check!=='ok')throw new Error('SQLite integrity check failed');await backup(database,path.join(destination,'bookings.sqlite'));}finally{database.close();}files['bookings.sqlite']=hash(await readFile(path.join(destination,'bookings.sqlite')));}
for(const [name,digest]of Object.entries(files))if(name.endsWith('.json')&&hash(await readFile(path.join(source,name)))!==digest)throw new Error('Data changed while exporting; stop the application and retry. This export is incomplete.');
await writeFile(path.join(destination,'manifest.json'),JSON.stringify({format:1,createdAt:new Date().toISOString(),files},null,2),{mode:0o600,flag:'wx'});
console.log(`Private export ready: ${destination}. Transfer it only through an authenticated encrypted connection. Source data was preserved.`);

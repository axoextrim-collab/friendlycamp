import {readFile,mkdir,copyFile,readdir} from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
const [sourceArg,targetArg]=process.argv.slice(2);if(!sourceArg||!targetArg)throw new Error('Usage: node scripts/import-render-data.mjs <private-export> <new-empty-data-directory>');
const source=path.resolve(sourceArg),target=path.resolve(targetArg);if(source===target||target.startsWith(source+path.sep))throw new Error('Source and target must be separate directories');
const manifest=JSON.parse(await readFile(path.join(source,'manifest.json'),'utf8'));
const allowed=['admin.json','users.json','profiles.json','newsletter.json','bookings.sqlite'];
if(manifest.format!==1||!manifest.files||!Object.keys(manifest.files).length||Object.keys(manifest.files).some(name=>!allowed.includes(name)))throw new Error('Export manifest is invalid');
for(const [name,digest]of Object.entries(manifest.files)){const bytes=await readFile(path.join(source,name));if(createHash('sha256').update(bytes).digest('hex')!==digest)throw new Error('Export checksum failed');if(name.endsWith('.json'))JSON.parse(bytes.toString('utf8'));}
try{if((await readdir(target)).length)throw new Error('Target contains data; nothing was overwritten');}catch(error){if(error.code!=='ENOENT')throw error;await mkdir(target,{recursive:true,mode:0o700});}
for(const name of Object.keys(manifest.files))await copyFile(path.join(source,name),path.join(target,name),constants.COPYFILE_EXCL);
if(manifest.files['bookings.sqlite']){const database=new DatabaseSync(path.join(target,'bookings.sqlite'),{readOnly:true});try{if(database.prepare('PRAGMA quick_check').get().quick_check!=='ok')throw new Error('Imported SQLite integrity check failed');}finally{database.close();}}
console.log('Import verified. Switch APP_DATA_DIR to this new directory and restart before accepting traffic.');

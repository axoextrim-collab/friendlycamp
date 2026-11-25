import 'dotenv/config';
import {readdir,readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {uploadsDirectory} from '../server/runtimePaths';
import {UPLOAD_TYPES,StorageError,downloadObject,storageReady,uploadObject,validUploadName} from '../server/supabaseStorage';
const execute=process.argv.includes('--execute');
const directory=uploadsDirectory();
const entries=await readdir(directory,{withFileTypes:true});
const files=entries.filter(item=>item.isFile());
if(entries.some(item=>!item.isFile())||files.some(item=>!validUploadName(item.name)))throw new Error('Unexpected files in upload directory; review them before migration');
const mime=(name:string)=>Object.entries(UPLOAD_TYPES).find(([,extension])=>extension===path.extname(name).toLowerCase())?.[0]||(name.endsWith('.jpeg')?'image/jpeg':'');
for(const file of files){const info=await stat(path.join(directory,file.name));if(!mime(file.name)||info.size<=0||info.size>12*1024*1024)throw new Error('An upload does not meet the file restrictions');}
if(!execute){console.log(`Dry run: ${files.length} existing files. No remote changes. Use --execute after configuring the dedicated private bucket.`);process.exit(0);}
if(process.env.UPLOAD_STORAGE!=='supabase')throw new Error('UPLOAD_STORAGE=supabase is required for migration');
await storageReady();let uploaded=0,skipped=0;
const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
for(const file of files){const localPath=path.join(directory,file.name),bytes=await readFile(localPath),expected=hash(bytes);
 let remote:Response|undefined;try{remote=await downloadObject(file.name);}catch(error){if(!(error instanceof StorageError&&error.status===404))throw error;}
 if(remote){if(hash(new Uint8Array(await remote.arrayBuffer()))!==expected)throw new Error('Remote object differs; migration stopped without overwriting it');skipped++;continue;}
 await uploadObject(file.name,localPath,mime(file.name),bytes.length);
 const check=await downloadObject(file.name);if(hash(new Uint8Array(await check.arrayBuffer()))!==expected)throw new Error('Uploaded object checksum did not match');uploaded++;
}
console.log(`Migration verified: ${uploaded} uploaded, ${skipped} identical files retained. Local originals were preserved.`);

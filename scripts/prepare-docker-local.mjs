import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import {parse} from 'dotenv';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const directory=path.join(root,'.docker');
const localFile=path.join(directory,'local.env');
async function readEnv(file){try{return parse(await readFile(file));}catch(error){if(error.code==='ENOENT')return {};throw error;}}
const existing=await readEnv(localFile);
const settings={...await readEnv(path.join(root,'.env')),...await readEnv(path.join(root,'.env.local'))};
await Promise.all([mkdir(directory,{recursive:true}),mkdir(path.join(root,'data'),{recursive:true}),mkdir(path.join(root,'public','uploads'),{recursive:true})]);
if(!existing.SESSION_SECRET||existing.SESSION_SECRET.length<32){
 const secret=settings.SESSION_SECRET?.length>=32?settings.SESSION_SECRET:randomBytes(48).toString('hex');
 await writeFile(localFile,`# Private Docker Desktop session key. Do not commit.\nSESSION_SECRET=${JSON.stringify(secret)}\n`,{mode:0o600});
}
console.log('Docker local configuration ready. Private values were not printed.');

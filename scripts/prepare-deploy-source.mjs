import {mkdtemp,mkdir,lstat,copyFile,realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const parent=path.join(root,'.deployment');await mkdir(parent,{recursive:true});const destination=await mkdtemp(path.join(parent,'source-'));
const files=execFileSync('git',['ls-files','-co','--exclude-standard','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
let count=0;
for(const file of new Set(files)){
 if(/^(?:data|public\/uploads|node_modules|dist|build|coverage|\.git|\.docker|\.deployment|\.agents|\.codex|\.aws)(?:\/|$)/.test(file)||/(^|\/)\.env(?:\.|$)/.test(file)&&file!=='.env.example'||/(^|\/)\.npmrc$|\.(?:pem|key|log|tmp)$/.test(file)||file.startsWith('.cloud-'))continue;
 const source=path.join(root,file);let info;try{info=await lstat(source);}catch(error){if(error.code==='ENOENT')continue;throw error;}
 if(!info.isFile())continue;const actual=await realpath(source);if(!actual.startsWith(root+path.sep))throw new Error('Unexpected source path');
 const target=path.join(destination,file);await mkdir(path.dirname(target),{recursive:true});await copyFile(source,target);count++;
}
const archive=destination+'.tar.gz';execFileSync('tar',['-czf',archive,'-C',destination,'.']);
console.log(`Deployable source prepared: ${archive} (${count} files). Runtime data, uploads, credentials and Git metadata were excluded.`);

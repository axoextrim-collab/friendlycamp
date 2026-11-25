import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

test('registration and password authentication work against an isolated temporary user store', {timeout:30000}, async () => {
  const directory=await mkdtemp(path.join(tmpdir(),'friendly-auth-test-'));
  const child=spawn(process.execPath,['--import',import.meta.resolve('tsx'),path.join(process.cwd(),'tests/fixtures/auth-worker.ts')],{cwd:directory,windowsHide:true,stdio:['ignore','pipe','pipe']});
  let output='';child.stdout.on('data',chunk=>output+=chunk);child.stderr.on('data',chunk=>output+=chunk);
  try {
    const [code]=await once(child,'exit');assert.equal(code,0,output);
  } finally {
    if(child.exitCode===null){child.kill();await once(child,'exit');}
    assert.equal(path.dirname(path.resolve(directory)),path.resolve(tmpdir()));assert.ok(path.basename(directory).startsWith('friendly-auth-test-'));
    await rm(directory,{recursive:true,force:true,maxRetries:5,retryDelay:200});
  }
});

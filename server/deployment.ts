import fs from 'node:fs';
import path from 'node:path';
import { dataDirectory } from './runtimePaths';
import { storageBackend, storageConfig } from './supabaseStorage';
import {databaseBackend,postgresOptions} from './database';
export function isMountPoint(directory: string, mountInfo: string) { return mountInfo.split('\n').some(line => line.split(' ')[4]?.replace(/\\040/g, ' ').replace(/\\134/g, '\\') === directory); }
export function validateDeployment() {
    const database=databaseBackend();
    if(database==='postgres')postgresOptions();
    if(process.env.REQUIRE_EXTERNAL_DATABASE==='true'&&database!=='postgres')throw new Error('The free deployment requires PostgreSQL; SQLite cannot use ephemeral storage');
    const backend = storageBackend();
    if (backend === 'supabase')
        storageConfig();
    if (process.env.NODE_ENV === 'production' && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32))
        throw new Error('SESSION_SECRET must contain at least 32 characters');
    if (process.env.REQUIRE_PERSISTENT_DISK === 'true') {
        if (!process.env.APP_DATA_DIR)
            throw new Error('APP_DATA_DIR is required for persistent deployment');
        const mount = path.resolve(process.env.PERSISTENT_DISK_MOUNT || dataDirectory());
        if (mount === '/' || !(dataDirectory() === mount || dataDirectory().startsWith(mount + path.sep)) || !isMountPoint(mount, fs.readFileSync('/proc/self/mountinfo', 'utf8')))
            throw new Error('APP_DATA_DIR must be on the attached persistent disk');
    }
}

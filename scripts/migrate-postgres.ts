import 'dotenv/config';
import {inspectPostgresTransfer,importPostgresTransfer} from '../server/postgresTransfer';
import {closePostgres} from '../server/database';
const source=process.argv.slice(2).find(value=>!value.startsWith('--'));if(!source)throw new Error('Usage: node --import tsx scripts/migrate-postgres.ts <private-export-directory> [--execute]');
try{const result=process.argv.includes('--execute')?await importPostgresTransfer(source):await inspectPostgresTransfer(source).then(value=>({status:'dry_run',tables:value.counts,documents:Object.keys(value.documents)}));console.log(JSON.stringify(result));}finally{await closePostgres();}

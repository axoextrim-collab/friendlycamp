import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {bookingDb,bookingTransaction,databaseBackend,readDocument,writeDocument} from './database';
export const TRANSFER_TABLES=['departures','reservations','payments','sms_jobs','refund_jobs','booking_audit','control_records','staff_roles','control_audit','support_cases','support_messages','tour_favorites','capacity_watches','capacity_alerts'];
const documentNames:Record<string,string>={'admin.json':'admin','users.json':'users','profiles.json':'profiles','newsletter.json':'newsletter'};
const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
export async function inspectPostgresTransfer(source:string){
 const directory=path.resolve(source),manifestBytes=await fs.readFile(path.join(directory,'manifest.json')),manifest=JSON.parse(manifestBytes.toString('utf8'));
 const names=Object.keys(manifest.files||{});if(manifest.format!==1||!names.length||names.some(name=>!Object.hasOwn(documentNames,name)&&name!=='bookings.sqlite'))throw new Error('Invalid migration manifest');
 const documents:Record<string,unknown>={};for(const name of names){const bytes=await fs.readFile(path.join(directory,name));if(hash(bytes)!==manifest.files[name])throw new Error('Migration checksum did not match');if(documentNames[name])documents[documentNames[name]]=JSON.parse(bytes.toString('utf8'));}
 const counts:Record<string,number>={};if(names.includes('bookings.sqlite')){const sourceDb=new DatabaseSync(path.join(directory,'bookings.sqlite'),{readOnly:true});try{if(sourceDb.prepare('PRAGMA quick_check').get()?.quick_check!=='ok')throw new Error('Source SQLite integrity check failed');const tables=sourceDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(row=>String(row.name));if(tables.some(name=>!TRANSFER_TABLES.includes(name)))throw new Error('Source contains an unsupported table; no migration was applied');for(const table of tables)counts[table]=Number(sourceDb.prepare(`SELECT count(*) AS n FROM "${table}"`).get()?.n||0);}finally{sourceDb.close();}}
 return {directory,documents,counts,sourceHash:hash(manifestBytes),hasDatabase:names.includes('bookings.sqlite')};
}
export async function importPostgresTransfer(source:string){
 if(databaseBackend()!=='postgres')throw new Error('Migration requires DATABASE_BACKEND=postgres');
 const inspected=await inspectPostgresTransfer(source);
 return bookingTransaction(async()=>{
  const previous=await readDocument('migration');if(previous?.sourceHash===inspected.sourceHash)return {status:'already_imported',counts:inspected.counts};
  for(const table of [...TRANSFER_TABLES,'documents'])if(Number((await bookingDb().prepare(`SELECT count(*) AS n FROM "${table}"`).get())?.n))throw new Error('Destination contains data; nothing was overwritten. Use an empty dedicated destination.');
  if(inspected.hasDatabase){const sourceDb=new DatabaseSync(path.join(inspected.directory,'bookings.sqlite'),{readOnly:true});try{
   for(const table of TRANSFER_TABLES){if(!inspected.counts[table])continue;const columns=sourceDb.prepare(`PRAGMA table_info("${table}")`).all().map(row=>String(row.name));const allowed=(await bookingDb().prepare("SELECT column_name FROM information_schema.columns WHERE table_schema='friendlycamp' AND table_name=?").all(table)).map(row=>String(row.column_name));if(columns.some(column=>!allowed.includes(column)))throw new Error('Source schema is not compatible with destination');
    const rows=sourceDb.prepare(`SELECT * FROM "${table}" ORDER BY rowid`).all();for(let offset=0;offset<rows.length;offset+=100){const batch=rows.slice(offset,offset+100),placeholders=batch.map(()=>`(${columns.map(()=>'?').join(',')})`).join(',');await bookingDb().prepare(`INSERT INTO "${table}"(${columns.map(column=>`"${column}"`).join(',')}) VALUES ${placeholders}`).run(...batch.flatMap(row=>columns.map(column=>row[column])));}
    if(['booking_audit','control_audit'].includes(table))await bookingDb().prepare(`SELECT setval(pg_get_serial_sequence('friendlycamp.${table}','id'),COALESCE(MAX(id),1),true) FROM "${table}"`).get();
   }
  }finally{sourceDb.close();}}
  for(const [name,value]of Object.entries(inspected.documents))await writeDocument(name,value);
  await writeDocument('migration',{sourceHash:inspected.sourceHash,at:new Date().toISOString(),counts:inspected.counts});
  return {status:'imported',counts:inspected.counts};
 });
}

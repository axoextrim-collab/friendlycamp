import {AsyncLocalStorage} from 'node:async_hooks';
import pg from 'pg';
import type {PoolClient} from 'pg';
import {bookingDb as sqliteDatabase} from './bookingDb';
import type {DatabaseSync} from 'node:sqlite';

export function databaseBackend(){const mode=process.env.DATABASE_BACKEND||(process.env.DATABASE_URL?'postgres':'sqlite');if(!['sqlite','postgres'].includes(mode))throw new Error('DATABASE_BACKEND must be sqlite or postgres');return mode;}
type Context={sqlite?:DatabaseSync;client?:PoolClient};
const context=new AsyncLocalStorage<Context>();let mutex=Promise.resolve();
async function locked<T>(work:()=>Promise<T>|T){const previous=mutex;let release!:()=>void;mutex=new Promise<void>(resolve=>release=resolve);await previous;try{return await work();}finally{release();}}
pg.types.setTypeParser(20,value=>{const number=Number(value);if(!Number.isSafeInteger(number))throw new Error('Database integer exceeds supported bounds');return number;});
let pool:pg.Pool|undefined,ready:Promise<void>|undefined;
const configured=new WeakSet<PoolClient>();
export function postgresOptions(){
 let url:URL;try{url=new URL(process.env.DATABASE_URL||'');}catch{throw new Error('DATABASE_URL is required for PostgreSQL');}
 if(!['postgres:','postgresql:'].includes(url.protocol))throw new Error('DATABASE_URL must be a PostgreSQL connection string');
 if(!url.hostname||!url.username||url.pathname==='/')throw new Error('DATABASE_URL must include the database host, user and name');
 for(const key of ['sslmode','sslcert','sslkey','sslrootcert','options'])url.searchParams.delete(key);
 const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 return {connectionString:url.toString(),ssl:local?false:{rejectUnauthorized:true,...(process.env.DATABASE_SSL_CA?{ca:process.env.DATABASE_SSL_CA.replace(/\\n/g,'\n')}:{})},max:5,connectionTimeoutMillis:10000,idleTimeoutMillis:30000,statement_timeout:20000};
}
function postgresPool(){if(!pool){pool=new pg.Pool(postgresOptions());pool.on('error',()=>console.error('PostgreSQL connection unavailable'));}return pool;}
export function postgresSql(sql:string){
 let result=sql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g,'BIGSERIAL PRIMARY KEY').replace(/\bINTEGER\b/g,'BIGINT').replace(/json_extract\(([\w.]+),\s*'\$\.([\w.]+)'\)/g,(_all,column,keys)=>`(${column}::jsonb #>> '{${keys.split('.').join(',')}}')`).replace(/\bAS\s+(createdAt|updatedAt)\b/g,'AS "$1"').replace(/\browid\b/g,'sequence');
 const ignore=/\bINSERT OR IGNORE\b/.test(result);result=result.replace(/\bINSERT OR IGNORE\b/g,'INSERT');if(ignore)result=result.replace(/;?\s*$/,' ON CONFLICT DO NOTHING');
 let parameter=0,quote='';let output='';for(let i=0;i<result.length;i++){const char=result[i];if(quote){output+=char;if(char===quote){if(result[i+1]===quote){output+=result[++i];}else quote='';}}else if(char==="'"||char==='"'){quote=char;output+=char;}else output+=char==='?'?'$'+(++parameter):char;}return output;
}
async function ensurePostgres(){if(ready)return ready;ready=(async()=>{const client=await postgresPool().connect();try{await client.query('BEGIN');await client.query("SELECT pg_advisory_xact_lock(1780349231)");await client.query('CREATE SCHEMA IF NOT EXISTS friendlycamp; REVOKE ALL ON SCHEMA friendlycamp FROM PUBLIC; SET search_path TO friendlycamp,pg_catalog');await client.query(`
 CREATE TABLE IF NOT EXISTS departures(id TEXT PRIMARY KEY,tour_id TEXT NOT NULL,config TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS reservations(reference TEXT PRIMARY KEY,request_key TEXT UNIQUE NOT NULL,request_hash TEXT NOT NULL,departure_id TEXT NOT NULL REFERENCES departures(id),seats BIGINT NOT NULL CHECK(seats>0),state TEXT NOT NULL,allocated BIGINT NOT NULL CHECK(allocated IN(0,1)),expires_at BIGINT NOT NULL,created_at BIGINT NOT NULL,payload TEXT NOT NULL,receipt_id TEXT UNIQUE,transaction_id TEXT UNIQUE,refund_amount BIGINT NOT NULL DEFAULT 0,cancellation_fee BIGINT NOT NULL DEFAULT 0,owner_id TEXT);
 CREATE INDEX IF NOT EXISTS reservation_inventory ON reservations(departure_id,allocated);
 CREATE INDEX IF NOT EXISTS reservations_owner ON reservations(owner_id);
 CREATE TABLE IF NOT EXISTS payments(id TEXT PRIMARY KEY,reference TEXT NOT NULL REFERENCES reservations(reference),mode TEXT NOT NULL,state TEXT NOT NULL,authority TEXT NOT NULL DEFAULT '',start_url TEXT NOT NULL DEFAULT '',result TEXT NOT NULL DEFAULT '',updated_at BIGINT NOT NULL,UNIQUE(reference));
 CREATE TABLE IF NOT EXISTS sms_jobs(reference TEXT PRIMARY KEY REFERENCES reservations(reference),state TEXT NOT NULL,updated_at BIGINT NOT NULL,attempts BIGINT NOT NULL DEFAULT 0,message_id TEXT);
 CREATE TABLE IF NOT EXISTS refund_jobs(reference TEXT PRIMARY KEY REFERENCES reservations(reference),state TEXT NOT NULL,updated_at BIGINT NOT NULL);
 CREATE TABLE IF NOT EXISTS booking_audit(id BIGSERIAL PRIMARY KEY,at BIGINT NOT NULL,action TEXT NOT NULL,reference TEXT NOT NULL,actor TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS documents(name TEXT PRIMARY KEY,payload TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS control_records(resource TEXT NOT NULL,id TEXT NOT NULL,payload TEXT NOT NULL,revision TEXT NOT NULL,updated_at TEXT NOT NULL,PRIMARY KEY(resource,id));
 CREATE TABLE IF NOT EXISTS staff_roles(user_id TEXT PRIMARY KEY,role TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS control_audit(id BIGSERIAL PRIMARY KEY,at TEXT NOT NULL,actor TEXT NOT NULL,resource TEXT NOT NULL,record_id TEXT NOT NULL,action TEXT NOT NULL,before_value TEXT,after_value TEXT);
 CREATE TABLE IF NOT EXISTS support_cases(reference TEXT PRIMARY KEY,request_key TEXT UNIQUE NOT NULL,request_hash TEXT NOT NULL,owner_id TEXT,status TEXT NOT NULL,payload TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS support_messages(id TEXT PRIMARY KEY,reference TEXT NOT NULL REFERENCES support_cases(reference),request_key TEXT UNIQUE NOT NULL,sender TEXT NOT NULL,body TEXT NOT NULL,created_at TEXT NOT NULL,sequence BIGSERIAL);
 CREATE INDEX IF NOT EXISTS support_owner ON support_cases(owner_id);
 CREATE TABLE IF NOT EXISTS tour_favorites(user_id TEXT NOT NULL,tour_id TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(user_id,tour_id));
 CREATE TABLE IF NOT EXISTS capacity_watches(user_id TEXT NOT NULL,departure_id TEXT NOT NULL,tour_id TEXT NOT NULL,title TEXT NOT NULL,threshold BIGINT NOT NULL,last_remaining BIGINT NOT NULL,enabled BIGINT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(user_id,departure_id));
 CREATE TABLE IF NOT EXISTS capacity_alerts(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,departure_id TEXT NOT NULL,tour_id TEXT NOT NULL,title TEXT NOT NULL,starts_at TEXT NOT NULL,before_count BIGINT NOT NULL,remaining BIGINT NOT NULL,created_at TEXT NOT NULL,is_read BIGINT NOT NULL DEFAULT 0);
 CREATE INDEX IF NOT EXISTS capacity_alert_owner ON capacity_alerts(user_id,created_at);
 `);await client.query('COMMIT');configured.add(client);}catch(error){await client.query('ROLLBACK').catch(()=>undefined);throw error;}finally{client.release();}})().catch(error=>{ready=undefined;throw error;});return ready;}
async function connection(){await ensurePostgres();const client=await postgresPool().connect();try{if(!configured.has(client)){await client.query('SET search_path TO friendlycamp,pg_catalog');configured.add(client);}return client;}catch(error){client.release();throw error;}}
async function query(sql:string,params:any[]=[]){const active=context.getStore()?.client;if(active)return active.query(postgresSql(sql),params);const client=await connection();try{return await client.query(postgresSql(sql),params);}finally{client.release();}}
type Row=Record<string,any>;
export interface AppDatabase {exec(sql:string):Promise<void>;prepare(sql:string):{get(...params:any[]):Promise<Row|undefined>;all(...params:any[]):Promise<Row[]>;run(...params:any[]):Promise<{changes:number}>};}
const postgres:AppDatabase={async exec(sql){await bookingTransaction(async()=>{await query(sql);});},prepare(sql){return {async get(...params){return (await query(sql,params)).rows[0];},async all(...params){return (await query(sql,params)).rows;},async run(...params){return {changes:(await query(sql,params)).rowCount||0};}};}};
const sqliteAdapters=new WeakMap<DatabaseSync,AppDatabase>();
export function bookingDb():AppDatabase {
 if(databaseBackend()==='postgres')return postgres;
 const raw=sqliteDatabase();let adapter=sqliteAdapters.get(raw);if(adapter)return adapter;
 const run=<T>(work:()=>T)=>context.getStore()?.sqlite===raw?Promise.resolve(work()):locked(work);
 adapter={async exec(sql){await run(()=>raw.exec(sql));},prepare(sql){return {get(...params){return run(()=>raw.prepare(sql).get(...params));},all(...params){return run(()=>raw.prepare(sql).all(...params));},async run(...params){const result=await run(()=>raw.prepare(sql).run(...params));return {changes:Number(result.changes)};}};}};sqliteAdapters.set(raw,adapter);return adapter;
}
export async function bookingTransaction<T>(work:()=>T|Promise<T>):Promise<T>{
 if(context.getStore())return await work();
 if(databaseBackend()==='postgres'){const client=await connection();try{await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(1780349231)');const result=await context.run({client},work);await client.query('COMMIT');return result;}catch(error){await client.query('ROLLBACK').catch(()=>undefined);throw error;}finally{client.release();}}
 return locked(async()=>{const raw=sqliteDatabase();raw.exec('BEGIN IMMEDIATE');try{const result=await context.run({sqlite:raw},work);raw.exec('COMMIT');return result;}catch(error){raw.exec('ROLLBACK');throw error;}});
}
export async function expireBookingHolds(){await bookingDb().prepare("UPDATE reservations SET state='expired',allocated=0 WHERE state='pending' AND allocated=1 AND expires_at<=?").run(Date.now());}
export async function allocatedSeats(departureId:string){return Number((await bookingDb().prepare('SELECT COALESCE(SUM(seats),0) AS seats FROM reservations WHERE departure_id=? AND allocated=1').get(departureId))?.seats||0);}
export async function bookingAudit(action:string,reference:string,actor:string){await bookingDb().prepare('INSERT INTO booking_audit(at,action,reference,actor) VALUES(?,?,?,?)').run(Date.now(),action,reference,actor);}
export async function readDocument(name:string){const row=await bookingDb().prepare('SELECT payload FROM documents WHERE name=?').get(name);return row?JSON.parse(row.payload):undefined;}
export async function writeDocument(name:string,value:unknown){await bookingDb().prepare('INSERT INTO documents(name,payload) VALUES(?,?) ON CONFLICT(name) DO UPDATE SET payload=excluded.payload').run(name,JSON.stringify(value));}
export function documentMutation<T>(work:()=>Promise<T>):Promise<T>{return databaseBackend()==='postgres'?bookingTransaction(work):work();}
export async function closePostgres(){await pool?.end();pool=undefined;ready=undefined;}

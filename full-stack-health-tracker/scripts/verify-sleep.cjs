/* Embedded PostgreSQL with mocked HTTP auth/origin: never uses production data. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const {PGlite} = require('@electric-sql/pglite');
const {drizzle} = require('drizzle-orm/pglite');
function load(file,imports) {
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const loaded={exports:{}};new Function('require','module','exports',code)(name=>imports[name]||require(name),loaded,loaded.exports);return loaded.exports;
}
const schema=load('src/db/schema.ts',{}), engine=new PGlite(), db=drizzle(engine);
const ids=['00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002'];
let current=ids[0],authorized=true,originAllowed=true;
class ApiError extends Error {constructor(message,status=400,code='VALIDATION_ERROR'){super(message);this.status=status;this.code=code;}}
const server={ApiError,checkOrigin(){if(!originAllowed)throw new ApiError('blocked',403);},async requireUser(){if(!authorized)throw new ApiError('unauthorized',401);return {id:current};},apiError(e){return {status:e.status||500,body:{error:e.message,code:e.code}};},text(v,label,max,required=true){const s=typeof v==='string'?v.trim():'';if((required&&!s)||s.length>max)throw new ApiError('invalid '+label);return s;},number(v,label,min,max){const n=typeof v==='number'||typeof v==='string'?Number(v):NaN;if(v===''||v==null||!Number.isFinite(n)||n<min||n>max)throw new ApiError('invalid '+label);return n;},async getDashboardData(id){return {user:{id,name:'Synthetic',email:null,isDemo:true},meals:[],workouts:[],waterLogs:[],weightLogs:[]};}};
const validation=load('src/lib/sleep-validation.ts',{'./server':server});
const next={'NextResponse':{json:(body,options={})=>({body,status:options.status||200,headers:options.headers})}};
const imports={'next/server':next,'@/db':{db},'@/db/schema':schema,'@/lib/server':server};
const route=load('src/app/api/sleep/route.ts',{...imports,'@/lib/sleep-validation':validation});
const exportRoute=load('src/app/api/export/route.ts',imports);
const req=body=>({json:async()=>body});
(async()=>{
 await engine.exec(fs.readFileSync('scripts/fixtures/pre-archive-schema.sql','utf8'));
 for(const id of ids)await db.insert(schema.users).values({id});
 assert.equal((await route.GET()).status,503);
 assert.equal((await exportRoute.POST(req({}))).body.sleepAvailable,false);
 await engine.exec(fs.readFileSync('migrations/0003_sleep_journal.sql','utf8'));
 const end=new Date(Date.now()-60000), start=new Date(end.getTime()-8*60*60000);
 const input={startedAt:start.toISOString(),endedAt:end.toISOString(),quality:'4',note:'Restful'};
 const result=await route.POST(req(input));assert.equal(result.status,201);const id=result.body.entry.id;
 assert.equal(result.body.entry.quality,4);assert.equal((await route.GET()).body.entries.length,1);
 const ownExport=await exportRoute.POST(req({}));assert.equal(ownExport.body.sleepAvailable,true);assert.equal(ownExport.body.sleepLogs[0].id,id);
 for(const bad of [{...input,endedAt:input.startedAt},{...input,startedAt:new Date(end.getTime()-25*3600000).toISOString()},{...input,endedAt:new Date(Date.now()+3600000).toISOString()},{...input,quality:'2.5'},{...input,startedAt:'2026-02-30T00:00:00.000Z'},{...input,startedAt:'2026-11-01T00:00'}])assert.equal((await route.POST(req(bad))).status,400);
 // A real overnight interval across midnight is eight elapsed hours, not a date subtraction.
 const overnight=validation.validateSleep({startedAt:'2026-01-01T20:00:00.000Z',endedAt:'2026-01-02T04:00:00.000Z'},Date.parse('2026-01-03T00:00:00Z'));
 assert.equal(overnight.endedAt.getTime()-overnight.startedAt.getTime(),8*3600000);
 current=ids[1];assert.equal((await route.GET()).body.entries.length,0);assert.equal((await exportRoute.POST(req({}))).body.sleepLogs.length,0);assert.equal((await route.DELETE(req({id}))).status,404);
 current=ids[0];originAllowed=false;assert.equal((await route.DELETE(req({id}))).status,403);originAllowed=true;authorized=false;assert.equal((await route.GET()).status,401);authorized=true;
 assert.equal((await route.DELETE(req({id}))).status,200);assert.equal((await route.GET()).body.entries.length,0);
 console.log('Sleep journal embedded PostgreSQL create/list/delete, validation, overnight, export and account-scope tests passed. Browser and real sessions not tested.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>engine.close());

/* Real SQL via an in-memory embedded PostgreSQL; HTTP/auth are stubbed. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const {PGlite} = require('@electric-sql/pglite');
const {drizzle} = require('drizzle-orm/pglite');
function load(file, imports) {
  const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const loaded={exports:{}};
  new Function('require','module','exports',js)(name=>imports[name] || require(name),loaded,loaded.exports);
  return loaded.exports;
}
const schema=load('src/db/schema.ts',{});
const engine=new PGlite(); const db=drizzle(engine);
let current='00000000-0000-4000-8000-000000000001', authorized=true, originAllowed=true;
class ApiError extends Error {constructor(message,status=400,code='VALIDATION_ERROR'){super(message);this.status=status;this.code=code;}}
const server={ApiError,checkOrigin(){if(!originAllowed)throw new ApiError('blocked',403);},async requireUser(){if(!authorized)throw new ApiError('unauthorized',401);return {id:current};},apiError(e){return {status:e.status||500,body:{error:e.message,code:e.code}};},text(v,label,max,required=true){const s=typeof v==='string'?v.trim():'';if((required&&!s)||s.length>max)throw new ApiError('invalid '+label);return s;},number(v,label,min,max){const n=typeof v==='number'||typeof v==='string'?Number(v):NaN;if(v===''||v==null||!Number.isFinite(n)||n<min||n>max)throw new ApiError('invalid '+label);return n;},choice(v,choices){if(!choices.includes(v))throw new ApiError('invalid choice');return v;}};
const validation=load('src/lib/activity-validation.ts',{'./server':server});
const route=load('src/app/api/activity/route.ts',{'next/server':{NextResponse:{json:(body,options={})=>({body,status:options.status||200,headers:options.headers})}},'@/db':{db},'@/db/schema':schema,'@/lib/server':server,'@/lib/activity-validation':validation});
server.getDashboardData = async id => ({user:{id,name:'Synthetic',email:null,isDemo:true}, meals:[],workouts:[],waterLogs:[],weightLogs:[]});
const exportRoute=load('src/app/api/export/route.ts',{'next/server':{NextResponse:{json:(body,options={})=>({body,status:options.status||200,headers:options.headers})}},'@/db':{db},'@/db/schema':schema,'@/lib/server':server});
const req=body=>({json:async()=>body});
(async()=>{
 await engine.exec(fs.readFileSync('scripts/fixtures/pre-archive-schema.sql','utf8'));
 const ids=[current,'00000000-0000-4000-8000-000000000002'];
 for(const id of ids)await db.insert(schema.users).values({id});
 assert.equal((await route.GET()).status,503);
 const missingExport=await exportRoute.POST(req({})); assert.equal(missingExport.body.activityAvailable,false);
 await engine.exec(fs.readFileSync('migrations/0002_manual_activity.sql','utf8'));
 assert.equal((await route.GET()).body.entries.length,0);
 const body={date:new Date().toISOString().slice(0,10),activity:'walking',steps:'2300',distanceKm:'1.6',durationMinutes:'20',note:'park'};
 const result=await route.POST(req(body));assert.equal(result.status,201);assert.equal(result.body.entry.steps,2300);const id=result.body.entry.id;
 assert.equal((await route.GET()).body.entries.length,1);
 const ownExport=await exportRoute.POST(req({}));assert.equal(ownExport.body.activityAvailable,true);assert.equal(ownExport.body.activityLogs[0].id,id);
 for(const invalid of [{...body,steps:'',distanceKm:'',durationMinutes:''},{...body,steps:'3.2'},{...body,activity:'device'},{...body,date:'2026-02-30'},{...body,steps:-1}])assert.equal((await route.POST(req(invalid))).status,400);
 current=ids[1];assert.equal((await route.GET()).body.entries.length,0);assert.equal((await exportRoute.POST(req({}))).body.activityLogs.length,0);assert.equal((await route.DELETE(req({id}))).status,404);
 current=ids[0];originAllowed=false;assert.equal((await route.DELETE(req({id}))).status,403);originAllowed=true;
 authorized=false;assert.equal((await route.GET()).status,401);authorized=true;
 assert.equal((await route.DELETE(req({id}))).status,200);assert.equal((await route.GET()).body.entries.length,0);
 console.log('Activity API: embedded PostgreSQL create/list/delete, validation, origin, authorization, export and cross-account isolation passed; browser and real sessions not tested.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>engine.close());

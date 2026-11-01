/* Synthetic in-memory PostgreSQL; identity and origin are mocked. */
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const {PGlite}=require('@electric-sql/pglite'),{drizzle}=require('drizzle-orm/pglite');
function load(file,imports){const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const loaded={exports:{}};new Function('require','module','exports',js)(name=>imports[name]||require(name),loaded,loaded.exports);return loaded.exports;}
const schema=load('src/db/schema.ts',{}), engine=new PGlite(), db=drizzle(engine);
const ids=['00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002'];let current=ids[0],authorized=true,originAllowed=true;
class ApiError extends Error{constructor(message,status=400,code='VALIDATION_ERROR'){super(message);this.status=status;this.code=code;}}
const server={ApiError,checkOrigin(){if(!originAllowed)throw new ApiError('blocked',403);},async requireUser(){if(!authorized)throw new ApiError('unauthorized',401);return {id:current};},apiError(e){return {status:e.status||500,body:{error:e.message,code:e.code}};},text(v,label,max,required=true){const s=typeof v==='string'?v.trim():'';if((required&&!s)||s.length>max)throw new ApiError('invalid '+label);return s;},number(v,label,min,max){const n=typeof v==='number'||typeof v==='string'?Number(v):NaN;if(v===''||v==null||!Number.isFinite(n)||n<min||n>max)throw new ApiError('invalid '+label);return n;},choice(v,choices){if(!choices.includes(v))throw new ApiError('invalid choice');return v;},async getDashboardData(id){return {user:{id,name:'Synthetic',email:null,isDemo:true},meals:[],workouts:[],waterLogs:[],weightLogs:[]};}};
const validation=load('src/lib/journal-validation.ts',{'./server':server});
const imports={'next/server':{NextResponse:{json:(body,options={})=>({body,status:options.status||200,headers:options.headers})}},'@/db':{db},'@/db/schema':schema,'@/lib/server':server};
const route=load('src/app/api/journal/route.ts',{...imports,'@/lib/journal-validation':validation}),exportRoute=load('src/app/api/export/route.ts',imports);
const req=body=>({json:async()=>body}),get=kind=>({url:'http://example.test/api/journal?kind='+kind});
(async()=>{
 await engine.exec(fs.readFileSync('scripts/fixtures/pre-archive-schema.sql','utf8'));for(const id of ids)await db.insert(schema.users).values({id});
 assert.equal((await route.GET(get('food'))).status,503);assert.equal((await exportRoute.POST(req({}))).body.journalsAvailable,false);
 await engine.exec(fs.readFileSync('migrations/0004_personal_journals.sql','utf8'));
 const date=new Date().toISOString().slice(0,10);
 const cases=[{kind:'food',date,title:'Dal',calories:'200',protein:''},{kind:'exercise',date,title:'Squat',sets:'3',reps:'24',loadKg:'20'},{kind:'measurement',date,title:'Waist',centimetres:'80'}];
 const records=[];for(const entry of cases){const result=await route.POST(req(entry));assert.equal(result.status,201);records.push(result.body.entry);assert.equal((await route.GET(get(entry.kind))).body.entries.length,1);}
 assert.equal(records[0].details.protein,null);assert.equal(records[0].details.calories,200);
 for(const bad of [{...cases[0],date:'2026-02-30'},{...cases[0],calories:'-3'},{...cases[1],sets:'2.5'},{...cases[2],centimetres:'0'},{...cases[0],kind:'other'}])assert.equal((await route.POST(req(bad))).status,400);
 assert.equal((await route.PATCH(req({...cases[0],id:records[0].id,title:'Updated'}))).status,200);
 assert.equal((await route.PATCH(req({...cases[1],id:records[0].id}))).status,404);
 assert.equal((await exportRoute.POST(req({}))).body.journalEntries.length,3);
 current=ids[1];assert.equal((await route.GET(get('food'))).body.entries.length,0);assert.equal((await exportRoute.POST(req({}))).body.journalEntries.length,0);assert.equal((await route.DELETE(req({id:records[0].id}))).status,404);assert.equal((await route.PATCH(req({...cases[0],id:records[0].id}))).status,404);
 current=ids[0];originAllowed=false;assert.equal((await route.DELETE(req({id:records[0].id}))).status,403);originAllowed=true;authorized=false;assert.equal((await route.GET(get('food'))).status,401);authorized=true;
 assert.equal((await route.DELETE(req({id:records[0].id}))).status,200);assert.equal((await route.GET(get('food'))).body.entries.length,0);
 console.log('Food, exercise and measurement journals: embedded SQL CRUD, validation, export and account-isolation checks passed; browser/real sessions not tested.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>engine.close());

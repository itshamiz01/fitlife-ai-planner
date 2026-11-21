/* Synthetic, in-memory PGlite; session and origin are mocked, not browser tested. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const {PGlite}=require('@electric-sql/pglite');
const {drizzle}=require('drizzle-orm/pglite');
const {eq}=require('drizzle-orm');
const cache=new Map();
function source(file) {file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const loaded={exports:{}};cache.set(file,loaded);const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const local=name=>name.startsWith('@/')?source(path.resolve('src',name.slice(2))+'.ts'):name.startsWith('.')?source(path.resolve(path.dirname(file),name)+'.ts'):require(name);new Function('require','module','exports',code)(local,loaded,loaded.exports);return loaded.exports;}
function routeLoad(file,imports) {const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const loaded={exports:{}};new Function('require','module','exports',code)(name=>imports[name]||require(name),loaded,loaded.exports);return loaded.exports;}
const schema=source('src/db/schema.ts');const {archiveAndReplacePlan,restoreArchivedPlan}=source('src/lib/plan-archive.ts');const {profileChangesPlan}=source('src/lib/profile-plan-change.ts');
const engine=new PGlite(),db=drizzle(engine),ids=['00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002'];
let current=ids[0],authorized=true,originAllowed=true;
class ApiError extends Error{constructor(message,status=400,code='VALIDATION_ERROR'){super(message);this.status=status;this.code=code;}}
const publicProfile=({passwordHash,recoveryKeyHash,createdAt,...p})=>({...p,hasRecoveryKey:!!recoveryKeyHash});
const server={ApiError,apiError:e=>({status:e.status||500,body:{error:e.message,code:e.code}}),checkOrigin(){if(!originAllowed)throw new ApiError('blocked',403);},async requireUser(){if(!authorized)throw new ApiError('unauthorized',401);return (await db.select().from(schema.users).where(eq(schema.users.id,current)))[0];},publicProfile,text(v,label,max){if(typeof v!=='string'||!v.trim()||v.length>max)throw new ApiError('invalid '+label);return v.trim();}};
const route=routeLoad('src/app/api/plan/archives/route.ts',{'next/server':{NextResponse:{json:(body,options={})=>({body,status:options.status||200,headers:options.headers})}},'@/db':{db},'@/db/schema':schema,'@/lib/server':server,'@/lib/profile-plan-change':{profileChangesPlan},'@/lib/plan-archive':{restoreArchivedPlan}});
const request=id=>({json:async()=>({id})});
(async()=>{
 await engine.exec(fs.readFileSync('scripts/fixtures/pre-archive-schema.sql','utf8'));await engine.exec(fs.readFileSync('migrations/0008_water_reminder_window.sql','utf8'));
 for(const id of ids){await db.insert(schema.users).values({id});await db.insert(schema.meals).values({userId:id,day:0,mealType:'Lunch',name:'Custom '+id,calories:300,completed:true});await db.insert(schema.workouts).values({userId:id,day:0,name:'Walk '+id,completed:true});}
 assert.equal((await route.GET()).status,503);
 await engine.exec(fs.readFileSync('migrations/0001_plan_archives.sql','utf8'));
 const [user]=await db.select().from(schema.users).where(eq(schema.users.id,ids[0])); const p=publicProfile(user);
 await db.transaction(async tx=>{await tx.select().from(schema.users).where(eq(schema.users.id,ids[0])).for('update');await archiveAndReplacePlan(tx,p,p,'regenerate');});
 const list=await route.GET();assert.equal(list.body.archives.length,1);assert.equal(list.body.archives[0].compatible,true);const id=list.body.archives[0].id;
 current=ids[1];assert.equal((await route.GET()).body.archives.length,0);assert.equal((await route.POST(request(id))).status,404);current=ids[0];
 await db.update(schema.users).set({allergies:'peanuts'}).where(eq(schema.users.id,current));assert.equal((await route.GET()).body.archives[0].compatible,false);assert.equal((await route.POST(request(id))).status,409);assert.equal((await db.select().from(schema.planArchives).where(eq(schema.planArchives.userId,current))).length,1);
 await db.update(schema.users).set({allergies:''}).where(eq(schema.users.id,current));originAllowed=false;assert.equal((await route.POST(request(id))).status,403);originAllowed=true;authorized=false;assert.equal((await route.GET()).status,401);authorized=true;
 assert.equal((await route.POST(request(id))).status,200);const restored=await db.select().from(schema.meals).where(eq(schema.meals.userId,current));assert.equal(restored.length,1);assert.equal(restored[0].name,'Custom '+current);assert.equal(restored[0].completed,true);
 const workouts=await db.select().from(schema.workouts).where(eq(schema.workouts.userId,current));assert.equal(workouts[0].completed,true);assert.equal((await db.select().from(schema.planArchives).where(eq(schema.planArchives.userId,current))).length,2);
 assert.equal((await route.POST(request(id))).status,200);assert.equal((await db.select().from(schema.meals).where(eq(schema.meals.userId,current))).length,1);assert.equal((await db.select().from(schema.meals).where(eq(schema.meals.userId,ids[1])))[0].name,'Custom '+ids[1]);
 console.log('Plan restore: embedded PostgreSQL snapshots, ownership, profile mismatch, repeated restores and auth/origin mocks passed; live sessions, concurrency and browser not tested.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>engine.close());

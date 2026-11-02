/* Embedded PostgreSQL test: disposable in-memory synthetic records only. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const {PGlite} = require('@electric-sql/pglite');
const {drizzle} = require('drizzle-orm/pglite');
const {eq} = require('drizzle-orm');
const modules = new Map();
function load(file) {
  file=path.resolve(file); if(modules.has(file))return modules.get(file).exports;
  const loaded={exports:{}};modules.set(file,loaded);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;
  const local=name=>name.startsWith('@/')?load(path.resolve('src',name.slice(2))+'.ts'):name.startsWith('.')?load(path.resolve(path.dirname(file),name)+'.ts'):require(name);
  new Function('require','module','exports',code)(local,loaded,loaded.exports);return loaded.exports;
}
const {users,meals,workouts,planArchives}=load('src/db/schema.ts');
const {archiveAndReplacePlan}=load('src/lib/plan-archive.ts');
const sql = new PGlite();
const db=drizzle(sql);
const profile=id=>({id,email:null,name:'Synthetic',isDemo:true,hasRecoveryKey:false,age:29,gender:'male',height:175,currentWeight:76.5,startWeight:80,targetWeight:70,goal:'lose',activity:'moderate',diet:'vegan',allergies:'',foodBudgetPaise:15000,budgetPeriod:'daily',experience:'beginner',equipment:'bodyweight',workoutMinutes:30,fitnessGoal:'general-fitness',calorieTarget:1920,waterTarget:2500,activityTarget:30,remindersEnabled:false,reminderInterval:60});
const ids=['00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002'];
async function replace(reason='regenerate',fail=false) {return db.transaction(async tx=>{await tx.select().from(users).where(eq(users.id,ids[0])).for('update');await archiveAndReplacePlan(tx,profile(ids[0]),profile(ids[0]),reason);if(fail)throw Error('forced rollback');});}
(async()=>{
  await sql.exec(fs.readFileSync('scripts/fixtures/pre-archive-schema.sql','utf8'));await sql.exec(fs.readFileSync('migrations/0008_water_reminder_window.sql','utf8'));
  for(const id of ids) {
    await db.insert(users).values({id});
    await db.insert(meals).values({userId:id,day:0,mealType:'Lunch',name:'Custom meal '+id,calories:300,completed:true});
    await db.insert(workouts).values({userId:id,day:0,name:'Custom workout '+id,completed:true});
  }
  await assert.rejects(replace());
  assert.equal((await db.select().from(meals).where(eq(meals.userId,ids[0])))[0].name,'Custom meal '+ids[0], 'missing migration must not delete data');
  await sql.exec(fs.readFileSync('migrations/0001_plan_archives.sql','utf8'));
  await replace();
  let archives=await db.select().from(planArchives).where(eq(planArchives.userId,ids[0]));
  assert.equal(archives.length,1);assert.equal(archives[0].reason,'regenerate');
  assert.equal(archives[0].snapshot.meals[0].name,'Custom meal '+ids[0]);
  assert.equal(archives[0].snapshot.meals[0].completed,true);assert.equal(archives[0].snapshot.workouts[0].completed,true);
  assert.equal((await db.select().from(meals).where(eq(meals.userId,ids[0]))).length,28);
  assert.equal((await db.select().from(workouts).where(eq(workouts.userId,ids[0]))).length,14);
  assert.equal((await db.select().from(meals).where(eq(meals.userId,ids[1])))[0].name,'Custom meal '+ids[1]);
  assert.equal((await db.select().from(planArchives).where(eq(planArchives.userId,ids[1]))).length,0);
  await assert.rejects(replace('profile-change',true),/forced rollback/);
  assert.equal((await db.select().from(planArchives).where(eq(planArchives.userId,ids[0]))).length,1);
  assert.equal((await db.select().from(meals).where(eq(meals.userId,ids[0]))).length,28);
  await replace('profile-change'); archives=await db.select().from(planArchives).where(eq(planArchives.userId,ids[0]));assert.equal(archives.length,2);
  console.log('Embedded PostgreSQL: missing-migration safety, snapshots, ownership and rollback passed. Concurrent/live PostgreSQL and browser not tested.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>sql.close());

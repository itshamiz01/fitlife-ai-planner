/* Route-level tests with an in-memory database stub; not a PostgreSQL integration test. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file, imports) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const loaded = {exports:{}};
  new Function('require','module','exports',code)(name => {if (!(name in imports)) throw Error(`Unexpected import ${name}`); return imports[name];}, loaded, loaded.exports);
  return loaded.exports;
}
const {profileChangesPlan} = load('src/lib/profile-plan-change.ts', {});
const base = {id:'u1', name:'Alex', age:29, gender:'male', height:175, currentWeight:76.5, targetWeight:70, startWeight:80, goal:'lose', activity:'moderate', diet:'balanced', allergies:'', foodBudgetPaise:15000, budgetPeriod:'daily', experience:'beginner', equipment:'bodyweight', workoutMinutes:30, fitnessGoal:'general-fitness', calorieTarget:1920, waterTarget:2500, activityTarget:60};
assert.equal(profileChangesPlan(base,{...base,diet:'nonvegetarian'}), false);
for (const key of ['age','gender','height','currentWeight','targetWeight','goal','activity','diet','allergies','foodBudgetPaise','budgetPeriod','experience','equipment','workoutMinutes','fitnessGoal']) {
  const value = typeof base[key] === 'number' ? base[key] + 1 : base[key] + '-changed';
  assert.equal(profileChangesPlan(base,{...base,[key]:value}),true, `${key} must trigger a rebuild`);
}
const tables = {users:{id:'user-id'},meals:{userId:'meal-owner'},workouts:{userId:'workout-owner'},weightLogs:{}};
let user, actions;
const tx = {
  select() {return {from(){return {where(){return {async for(){return [user];}};}};}};},
  update() {return {set(values){return {where(){return {async returning(){actions.push(['update',values]);user={...user,...values};return [user];}};}};}};},
  delete(table) {return {async where(){actions.push(['delete',table]);}};},
  insert(table) {return {async values(values){actions.push(['insert',table,values]);}};}
};
class ApiError extends Error {}
const server = {ApiError,apiError:e=>{throw e;},checkOrigin(){},requireUser:async()=>({...user}),text:(v)=>String(v ?? '').trim(),number:(v)=>Number(v),choice:v=>v,publicProfile:v=>v,getDashboardData:async()=>({user})};
const {PATCH} = load('src/app/api/profile/route.ts', {
  'next/server':{NextResponse:{json:value=>value}}, 'drizzle-orm':{eq:(a,b)=>[a,b]}, '@/db':{db:{transaction:fn=>fn(tx)}}, '@/db/schema':tables, '@/lib/server':server,
  '@/lib/planner':{recommendations:()=>({calorieTarget:2000,waterTarget:2400,activityTarget:30}),buildMealPlan:()=>[{name:'generated meal'}],buildWorkoutPlan:()=>[{name:'generated workout'}]},
  '@/lib/profile-plan-change':{profileChangesPlan},
  '@/lib/plan-archive':{async archiveAndReplacePlan(_tx,before,after,reason){actions.push(['archive',before,after,reason]);}},
});
function body(changes={}) {return {...base, ...changes, diet:changes.diet ?? 'nonvegetarian', foodBudget:150, waterTarget:changes.waterTarget ?? base.waterTarget};}
async function run(changes) {user={...base};actions=[];await PATCH({json:async()=>body(changes)});return actions;}
(async()=>{
  for (const changes of [{name:'New name'}, {waterTarget:3000}, {}]) {
    const calls=await run(changes);
    assert.equal(calls.filter(([op])=>op==='delete').length,0, 'unchanged planning inputs must preserve plans');
    assert.equal(calls.filter(([op])=>op==='insert').length,0);
    assert.equal(user.calorieTarget,1920, 'existing recommendation remains unchanged');
    assert.equal(user.waterTarget,changes.waterTarget ?? 2500);
  }
  const calls=await run({diet:'vegan'});
  assert.equal(calls.filter(([op])=>op==='archive').length,1);
  assert.equal(calls.find(([op])=>op==='archive')[3], 'profile-change');
  assert.equal(user.calorieTarget,2000);
  user={...base}; actions=[]; const changed=body({diet:'vegan'}); delete changed.waterTarget; await PATCH({json:async()=>changed}); assert.equal(user.waterTarget,2500,'profile changes must not recompute water target');
  console.log('Profile preservation checks passed with database stub; PostgreSQL integration not tested.');
})().catch(e=>{console.error(e);process.exitCode=1;});

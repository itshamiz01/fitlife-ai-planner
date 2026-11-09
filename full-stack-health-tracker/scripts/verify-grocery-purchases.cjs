/* Synthetic embedded PostgreSQL; mocked session and origin, no production data. */
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const {PGlite}=require('@electric-sql/pglite'),{drizzle}=require('drizzle-orm/pglite');
function load(file,imports){const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const m={exports:{}};new Function('require','module','exports',js)(n=>imports[n]||require(n),m,m.exports);return m.exports;}
const schema=load('src/db/schema.ts',{}),engine=new PGlite(),db=drizzle(engine);
const ids=['00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002'];let current=ids[0],authorized=true,origin=true;
class ApiError extends Error{constructor(message,status=400){super(message);this.status=status;}}
const server={ApiError,checkOrigin(){if(!origin)throw new ApiError('blocked',403)},async requireUser(){if(!authorized)throw new ApiError('unauthorized',401);return {id:current}},apiError(e){return {status:e.status||500,body:{error:e.message}}}};
const route=load('src/app/api/groceries/route.ts',{'next/server':{NextResponse:{json:(body,options={})=>({body,status:options.status||200,headers:options.headers})}},'@/db':{db},'@/db/schema':schema,'@/lib/server':server});
const req=body=>({json:async()=>body});
(async()=>{await engine.exec(fs.readFileSync('scripts/fixtures/pre-archive-schema.sql','utf8'));await engine.exec(fs.readFileSync('migrations/0008_water_reminder_window.sql','utf8'));for(const id of ids)await db.insert(schema.users).values({id});
assert.equal((await route.GET()).status,503);await engine.exec(fs.readFileSync('migrations/0005_grocery_purchases.sql','utf8'));await engine.exec(fs.readFileSync('migrations/0005_grocery_purchases.sql','utf8'));
assert.equal((await route.GET()).body.entry,null);assert.equal((await route.PUT(req({listSignature:'week-1',purchasedKeys:['a','a','b']}))).status,200);assert.deepEqual((await route.GET()).body.entry.purchasedKeys,['a','b']);
current=ids[1];assert.equal((await route.GET()).body.entry,null);assert.equal((await route.PUT(req({listSignature:'other',purchasedKeys:['c']}))).status,200);current=ids[0];assert.equal((await route.GET()).body.entry.listSignature,'week-1');
for(const value of [{listSignature:'',purchasedKeys:[]},{listSignature:'a'.repeat(16001),purchasedKeys:[]},{listSignature:'x',purchasedKeys:[42]},{listSignature:'x',purchasedKeys:Array(201).fill('x')}])assert.equal((await route.PUT(req(value))).status,400);
origin=false;assert.equal((await route.PUT(req({listSignature:'x',purchasedKeys:[]}))).status,403);origin=true;authorized=false;assert.equal((await route.GET()).status,401);authorized=true;
await route.PUT(req({listSignature:'week-2',purchasedKeys:[]}));assert.equal((await route.GET()).body.entry.listSignature,'week-2');
await db.delete(schema.users).where(require('drizzle-orm').eq(schema.users.id,ids[0]));assert.equal((await db.select().from(schema.groceryPurchases)).length,1);
console.log('Grocery purchases: embedded PostgreSQL migration, upsert, validation, account isolation, origin/auth mocks and account-delete cascade passed; browser, real sessions and live PostgreSQL not tested.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>engine.close());

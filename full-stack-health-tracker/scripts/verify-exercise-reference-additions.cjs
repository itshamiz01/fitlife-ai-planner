const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
function load(file){const mod={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;new Function('module','exports','require',code)(mod,mod.exports,require);return mod.exports;}
const base=load('src/lib/exercise-guide-draft.ts').EXERCISE_GUIDE_DRAFT;
const additions=load('src/lib/exercise-reference-additions.ts').EXERCISE_REFERENCE_ADDITIONS;
const ids=new Set(base.map(x=>x.id)),urls=new Set();
assert.equal(additions.length,72);
for(const {exercise:e,url,sourceTitle} of additions){assert.ok(!ids.has(e.id),`duplicate ${e.id}`);ids.add(e.id);assert.match(url,/^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/);assert.ok(!urls.has(url));urls.add(url);assert.ok(sourceTitle&&e.name&&e.primaryMuscles&&e.purpose&&e.equipment&&e.steps.length>=3&&e.breathing&&e.commonMistakes.length&&e.safety&&e.easier&&e.harder);assert.equal(e.video,null);}
assert.equal(ids.size,108);console.log('72 reference additions: unique IDs, complete descriptions and YouTube URL shapes passed. Video content and clinical suitability not verified.');

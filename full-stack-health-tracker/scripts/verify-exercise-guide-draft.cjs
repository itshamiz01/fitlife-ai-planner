const assert = require('node:assert/strict'), fs = require('node:fs'), ts = require('typescript');
const js=ts.transpileModule(fs.readFileSync('src/lib/exercise-guide-draft.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const mod={exports:{}};new Function('module','exports',js)(mod,mod.exports);
const {EXERCISE_GUIDE_DRAFT: exercises, screenExerciseGuide: screen}=mod.exports;
const no={urgentSymptoms:'no',medicalRestriction:'no',injuryOrMobility:'no',pregnancyPostpartum:'no'};
assert.equal(screen(30,no),'review-only');
for(const age of [5,17,65,100]) assert.equal(screen(age,no),'clinician');
for(const age of [0,111,NaN]) assert.equal(screen(age,no),'incomplete');
for(const key of Object.keys(no)){assert.equal(screen(30,{...no,[key]:'unsure'}),'incomplete');assert.equal(screen(30,{...no,[key]:''}),'incomplete');assert.equal(screen(30,{...no,[key]:'yes'}),key==='urgentSymptoms'?'urgent':'clinician');}
assert.equal(screen(30,{...no,urgentSymptoms:'yes',medicalRestriction:''}),'urgent');
assert.equal(screen(NaN,{...no,urgentSymptoms:'yes'}),'urgent');
assert.equal(new Set(exercises.map(e=>e.id)).size,exercises.length);
for(const e of exercises){assert.equal(e.video,null);assert.ok(e.name && e.purpose && e.primaryMuscles && e.equipment && e.breathing && e.safety && e.easier && e.harder);assert.ok(e.steps.length >= 3 && e.commonMistakes.length >= 1);}
console.log('Exercise guide draft: safety gates, age, urgent priority, content completeness and no false video claims passed. No clinical validation.');

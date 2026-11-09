const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync('src/lib/body-assessment.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const mod = { exports: {} }; new Function('require', 'module', 'exports', code)(require, mod, mod.exports);
const { assessBody, poundsToKg, feetInchesToCm, kgToPounds } = mod.exports;
const base = { age: 30, heightCm: 170, weightKg: 85, populationReference: 'asian', applicability: 'standard' };
const sample = assessBody(base);
assert.equal(sample.bmi, 29.4); assert.equal(sample.category, 'overweight'); assert.equal(sample.asianActionPoint, '27.5-or-above'); assert.deepEqual(sample.referenceWeightKg, { min: 53.5, max: 72 });
assert.deepEqual(sample.suppliedMeasurements, { waistCm: null, hipCm: null, bodyFatPercent: null });
const byBmi = (n, reference = 'asian') => assessBody({ ...base, heightCm: 200, weightKg: n * 4, populationReference: reference });
for (const [bmi, category] of [[18.499, 'underweight'], [18.5, 'reference-range'], [24.999, 'reference-range'], [25, 'overweight'], [29.999, 'overweight'], [30, 'obesity-category']]) assert.equal(byBmi(bmi).category, category);
for (const [bmi, action] of [[22.999, 'below-23'], [23, '23-to-below-27.5'], [27.499, '23-to-below-27.5'], [27.5, '27.5-or-above']]) assert.equal(byBmi(bmi).asianActionPoint, action);
assert.equal(byBmi(24, 'other').asianActionPoint, null); assert.equal(byBmi(24, 'unspecified').asianActionPoint, null);
assert.equal(byBmi(24).category, 'reference-range');
assert.equal(assessBody({ ...base, waistCm: 85 }).waistScreen, '0.5-or-above');
assert.equal(assessBody({ ...base, waistCm: 84.999 }).waistScreen, 'below-0.5');
assert.equal(assessBody({ ...base, weightKg: 110, waistCm: 90 }).waistScreen, 'not-interpreted');
for (const age of [5, 17, 18, 19]) { const a = assessBody({ ...base, age, waistCm: 80 }); assert.equal(a.status, 'age-reference-needed'); assert.equal(a.bmi, null); assert.equal(a.category, null); assert.equal(a.referenceWeightKg, null); assert.equal(a.waistToHeightRatio, null); }
for (const applicability of ['pregnant-or-postpartum', 'unsure']) { const a = assessBody({ ...base, applicability }); assert.equal(a.status, 'clinical-context-needed'); assert.equal(a.bmi, null); }
assert.equal(assessBody({ ...base, age: 65 }).status, 'screening');
assert.ok(Math.abs(poundsToKg(kgToPounds(70)) - 70) < 1e-10); assert.ok(Math.abs(feetInchesToCm(5, 7) - 170.18) < 1e-10);
for (const patch of [{age:NaN}, {age:19.5}, {heightCm:0}, {weightKg:Infinity}, {waistCm:-1}, {bodyFatPercent:101}, {populationReference:'india'}, {applicability:null}]) assert.throws(() => assessBody({ ...base, ...patch }), RangeError);
for (const [f, args] of [[feetInchesToCm,[5,12]],[feetInchesToCm,[5.5,2]],[poundsToKg,[-1]],[kgToPounds,[NaN]]]) assert.throws(() => f(...args), RangeError);
console.log('Body assessment draft: exact BMI and Asian thresholds, age/context gating, optional measurements, waist scope, conversions and input validation passed. No clinical validation or UI integration.');

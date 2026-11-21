const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const js = ts.transpileModule(fs.readFileSync('src/lib/weight-progress.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const loaded = { exports: {} };
new Function('require', 'module', 'exports', js)(require, loaded, loaded.exports);
const { weightGoalProgress, weightChartBounds } = loaded.exports;
const p = {goal:'lose', startWeight:80, currentWeight:75, targetWeight:70};
assert.equal(weightGoalProgress(p),50);
assert.equal(weightGoalProgress({...p,currentWeight:85}),0);
assert.equal(weightGoalProgress({...p,currentWeight:65}),100);
assert.equal(weightGoalProgress({...p,goal:'gain',startWeight:60,currentWeight:65,targetWeight:70}),50);
assert.equal(weightGoalProgress({...p,goal:'maintain',targetWeight:75}),null);
assert.equal(weightGoalProgress({...p,targetWeight:80}),null);
assert.equal(weightGoalProgress({...p,goal:'gain'}),null);
for (const [weights, target] of [[[60,62,64],80], [[80,78],60], [[75],75]]) {
  const {min,max}=weightChartBounds(weights,target);
  assert.ok(min < target && target < max);
  for (const value of weights) assert.ok(min < value && value < max);
}
console.log('Weight progress and chart-range checks passed; rendering and clinical validation not tested.');

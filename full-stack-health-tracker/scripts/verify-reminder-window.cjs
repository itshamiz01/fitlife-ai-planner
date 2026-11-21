const assert = require('node:assert/strict'), fs = require('node:fs'), ts = require('typescript');
function load(path, imports={}) { const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText; const m={exports:{}}; new Function('require','module','exports',code)(name=>imports[name]||require(name),m,m.exports); return m.exports; }
const w=load('src/lib/hydration/reminder-window.ts'), p=load('src/lib/water-push.ts',{'./hydration/reminder-window':w});
for (const [t,expected] of [[479,false],[480,true],[1259,true],[1260,false]]) assert.equal(w.inReminderWindow(t,480,1260),expected);
for (const [t,expected] of [[1319,false],[1320,true],[1439,true],[0,true],[359,true],[360,false]]) assert.equal(w.inReminderWindow(t,1320,360),expected);
assert.equal(w.inReminderWindow(100,100,100),false); assert.equal(w.inReminderWindow(-1,0,100),false);
assert.equal(w.parseTime('09:30'),570); assert.equal(w.parseTime('24:00'),null); assert.equal(w.timeString(570),'09:30');
assert.equal(p.isReminderTime(new Date('2026-03-08T07:30:00Z'),'America/New_York',180,240),true);
assert.equal(p.isReminderTime(new Date('2026-11-01T05:30:00Z'),'America/New_York',60,120),true);
assert.equal(p.isReminderTime(new Date('2026-11-01T06:30:00Z'),'America/New_York',60,120),true);
console.log('Reminder window: boundaries, overnight, invalid inputs and DST wall-clock scenarios passed. No real-device delivery tested.');

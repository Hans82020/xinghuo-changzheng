import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, xh } from './load.mjs';

const SCHEMA = {
  timing: ['windows', 'hint'], rhythm: ['beats', 'tol', 'hint'],
  route: ['guards', 'hint'], defend: ['waves', 'gap', 'hitLoss', 'hint'],
  allocate: ['pool', 'slots', 'timeLimit', 'hint'], trust: ['rounds', 'hint'],
  dodge: ['hazardCount', 'duration', 'hint'], dual: ['hint'], finale: ['hint'],
};

test('mg-configs：14 节点全覆盖、类型合法、字段按 schema', () => {
  load('src/data/palette.js'); load('src/data/nodes.js'); load('src/data/mg-configs.js');
  const { MG_CONFIGS, NODES } = xh();
  assert.equal(Object.keys(MG_CONFIGS).length, 14);
  for (const n of NODES) {
    const c = MG_CONFIGS[n.mg];
    assert.ok(c, `${n.mg} 缺配置`);
    assert.ok(SCHEMA[c.type], `未知类型 ${c.type}`);
    for (const k of SCHEMA[c.type]) assert.ok(c[k] !== undefined, `${n.mg} 缺 ${k}`);
    assert.ok(c.hint.length >= 6, '玩法提示过短');
    if (c.type === 'timing') { let last = -1; c.windows.forEach(w => { assert.ok(w.start < w.end); assert.ok(w.start >= last); last = w.end; }); }
    if (c.type === 'rhythm') { let last = -1; c.beats.forEach(b => { assert.ok(b > last); last = b; }); }
    if (c.type === 'route') assert.equal(c.guards.length, 4);
    if (c.type === 'allocate') { let min = 0; c.slots.forEach(s => min += s.min); assert.ok(min <= c.pool, '配额不可满足'); }
    if (c.type === 'trust') assert.ok(c.rounds.length >= 3 && c.rounds.every(r => r.prompt && r.positive && r.negative));
  }
});

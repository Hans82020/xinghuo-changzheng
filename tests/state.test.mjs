import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, xh } from './load.mjs';

test('state：入场资源=节点 entry+上次加成；delta 夹取；失败判定', () => {
  load('src/data/palette.js'); load('src/data/nodes.js'); load('src/core/state.js');
  const { State, NODES } = xh();
  let st = State.create();
  assert.deepEqual(st.mgStars, {}, 'mgStars 应为对象（nodeId 键可经 JSON 序列化）');
  State.beginNode(st, NODES[0]);
  assert.equal(st.troops, 86000); assert.equal(st.morale, 80);
  State.applyDelta(st, { supply:-999 }); assert.equal(st.supply, 0);
  State.applyDelta(st, { morale:999 }); assert.equal(st.morale, 100);
  State.applyDelta(st, { troops:-90000 }); assert.ok(State.isFailed(st), '兵力归零应失败');
  st = State.create(); State.beginNode(st, NODES[0]);
  st.lastBonus = 800; State.beginNode(st, NODES[0]);
  assert.equal(st.troops, 86800, '入场兵力=entry+lastBonus');
  st.morale = 1; State.applyDelta(st, { morale:-5 });
  assert.ok(State.isFailed(st), '士气归零应失败');
});

test('state：finishNode 结算加成、收录笔记并推进节点', () => {
  load('src/data/palette.js'); load('src/data/nodes.js'); load('src/core/state.js');
  const { State, NODES } = xh();
  const st = State.create();
  State.beginNode(st, NODES[0]);
  const bonus = State.finishNode(st, NODES[0], 3);
  assert.equal(bonus.troops, 500, '兵力加成 500'); assert.equal(bonus.morale, 8, '士气加成 8');
  assert.ok(!bonus.supply, 'supply 零奖励不加成'); assert.ok(!bonus.faith, 'faith 零奖励不加成');
  assert.equal(st.supply, 100); assert.equal(st.faith, 50);
  assert.ok(st.notebook.includes('n01'), '笔记应收录 n01');
  assert.equal(st.nodeIndex, 1, 'nodeIndex 推进到 1');
  assert.equal(st.lastBonus, 500, 'lastBonus 记录兵力加成');
});

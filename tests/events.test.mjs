import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, xh } from './load.mjs';

test('事件表：字段合法、民心门槛有效、效果均为有限整数', () => {
  load('src/data/palette.js'); load('src/data/events.js');
  const E = xh().EVENTS;
  assert.ok(E.length >= 5);
  const RES = ['troops','supply','morale','faith'];
  for (const e of E) {
    assert.ok(e.text.length >= 10);
    assert.ok(e.weight > 0);
    if (e.minFaith !== undefined) assert.ok(e.minFaith >= 0 && e.minFaith <= 100);
    for (const o of e.options) {
      RES.forEach(r => { assert.ok(r in o.effects); assert.ok(Number.isInteger(o.effects[r])); });
      assert.ok(o.explain.length >= 6);
    }
  }
});

test('pickEvent：min/max 条件过滤与危机事件优先', () => {
  load('src/data/palette.js'); load('src/data/sprites.js'); load('src/data/nodes.js');
  load('src/data/map-terrain.js'); load('src/data/events.js'); load('src/data/mg-configs.js');
  load('src/core/state.js'); load('src/core/save.js'); load('src/platform/platform.js');
  load('src/engine/render.js'); load('src/engine/loop.js'); load('src/engine/mechanics.js');
  load('src/scenes/minigame.js'); load('src/ui/hud.js'); load('src/ui/overlays.js');
  load('src/scenes/title.js'); load('src/scenes/march.js'); load('src/scenes/nodeflow.js'); load('src/scenes/report.js');
  const { NodeFlow, State } = xh();
  // 资源健康（faith=50）：多种子抽取 30 次绝不出现危机事件
  for (let seed = 1; seed <= 30; seed++) {
    const st = State.create(); st.seed = seed;
    const ev = NodeFlow.pickEvent(st);
    assert.ok(!ev.crisis, `seed=${seed} 资源健康时不得抽到危机事件 ${ev.id}`);
  }
  // supply=20：只抽到粮草危机事件
  for (let seed = 1; seed <= 10; seed++) {
    const st = State.create(); st.seed = seed; st.supply = 20;
    assert.equal(NodeFlow.pickEvent(st).id, 'ev_starve', `seed=${seed} 低粮草应必抽粮草危机`);
  }
});

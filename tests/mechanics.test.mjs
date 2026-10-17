import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, xh } from './load.mjs';

test('timing：窗口内外判定与质量分级', () => {
  load('src/engine/mechanics.js'); const M = xh().Mech;
  const w = [{ start: 2, end: 3 }];
  assert.equal(M.timingHit(1.9, w), null);
  assert.equal(M.timingHit(2.5, w)[0].quality, 'perfect');
  assert.equal(M.timingHit(2.1, w)[0].quality, 'good');
  assert.equal(M.timingHit(2.95, w)[0].quality, 'poor');
});
test('rhythm：容差与连击', () => {
  load('src/engine/mechanics.js'); const M = xh().Mech;
  let rs = M.rhythmInit([1, 2, 3]);
  rs = M.rhythmPress(rs, 1.02, 0.08); assert.equal(rs.judges[0], 'perfect');
  rs = M.rhythmPress(rs, 2.1, 0.08); assert.equal(rs.judges[1], 'good');
  const fin = M.rhythmFinish(rs, 4);
  assert.equal(fin.miss, 1); assert.ok(fin.stars >= 1 && fin.stars <= 3);
});
test('route：4 轮 3 胜', () => {
  load('src/engine/mechanics.js'); const M = xh().Mech;
  let st = M.routeInit([ [1,2], [0,3], [0,1], [2,3] ]);
  st = M.routePick(st, 0); assert.equal(st.results[0], true);
  // 1∉设防[0,3] 为成功；第 4 轮 2∈设防[2,3] 为唯一失败
  st = M.routePick(st, 1); assert.equal(st.results[1], true);
  st = M.routePick(st, 2); st = M.routePick(st, 2);
  assert.equal(st.results[3], false);
  assert.equal(M.routeStars(st), 3);
});
test('defend：波次拦截与漏防', () => {
  load('src/engine/mechanics.js'); const M = xh().Mech;
  const sch = M.defendSchedule(4, 3);
  let st = M.defendInit(sch);
  st = M.defendTick(st, 0); assert.equal(st.leaked, 0);
  st = M.defendTick(st, 3.1); assert.equal(st.pending.length, 1, '到点波次进入待拦截');
  st = M.defendIntercept(st, st.pending[0].dir);
  assert.equal(st.pending.length, 0); assert.equal(st.leaked, 0);
  st = M.defendTick(st, 6.2); M.defendTick(st, 9.3); M.defendTick(st, 12.4);
  const fin = M.defendFinish(st); assert.equal(fin.leaked, 3);
});
test('allocate：配额校验', () => {
  load('src/engine/mechanics.js'); const M = xh().Mech;
  const slots = [{ id:'a', min:2 }, { id:'b', min:3 }];
  assert.equal(M.allocateValid({ a:2, b:4 }, slots, 6), true);
  assert.equal(M.allocateValid({ a:1, b:4 }, slots, 6), false);
  assert.equal(M.allocateValid({ a:2, b:5 }, slots, 6), false, '超池');
});
test('trust：信任条', () => {
  load('src/engine/mechanics.js'); const M = xh().Mech;
  let t = M.trustInit(4);
  t = M.trustChoose(t, true); t = M.trustChoose(t, true);
  t = M.trustChoose(t, false); t = M.trustChoose(t, true);
  assert.equal(t.trust, 75); assert.equal(M.trustStars(t), 3);
});
test('dodge：碰撞', () => {
  load('src/engine/mechanics.js'); const M = xh().Mech;
  const hz = [{ lane:1, y:100 }, { lane:2, y:120 }];
  assert.equal(M.dodgeCollide(1, 98, 104, hz), true);
  assert.equal(M.dodgeCollide(0, 98, 104, hz), false);
});
test('dual：双线操作', () => {
  load('src/engine/mechanics.js'); const M = xh().Mech;
  let d = M.dualInit();
  d = M.dualStep(d, 'front', 0.5); assert.ok(d.front > 0);
  d = M.dualStep(d, 'climb', 0.5);
  for (let i = 0; i < 100; i++) { d = M.dualStep(d, 'climb', 0.1); d = M.dualStep(d, 'front', 0.1); }
  assert.equal(M.dualDone(d), true, '爬满 100 应完成');
});
test('mechDraw：mock ctx 下 9 个绘制函数均不抛异常', () => {
  load('src/data/palette.js'); load('src/engine/render.js'); load('src/engine/mechanics.js');
  const D = xh().MechDraw;
  const mock = { fillRect(){}, fillText(){}, font:'', fillStyle:'', textAlign:'', textBaseline:'' };
  for (const k of ['timing','rhythm','route','defend','allocate','trust','dodge','dual','finale']) {
    assert.equal(typeof D[k], 'function', '缺少绘制函数 ' + k);
    D[k](mock, {});
    D[k](mock, null);
  }
});

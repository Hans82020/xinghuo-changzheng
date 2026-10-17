import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, xh } from './load.mjs';

const mockCtx = { fillRect(){}, fillText(){}, clearRect(){}, font:'', fillStyle:'', textAlign:'', textBaseline:'' };
function boot() {
  load('src/data/palette.js'); load('src/data/sprites.js'); load('src/data/nodes.js');
  load('src/core/state.js'); load('src/engine/render.js'); load('src/ui/hud.js'); load('src/ui/overlays.js');
  return xh();
}

test('HUD.fmtTroops 与顶栏绘制', () => {
  const { HUD, State } = boot();
  assert.equal(HUD.fmtTroops(86000), '8.6万');
  assert.equal(HUD.fmtTroops(30000), '3万');
  assert.equal(HUD.fmtTroops(9800), '9800');
  const st = State.create(); st.troops = 86000;
  HUD.draw(mockCtx, st);
  assert.ok(Array.isArray(HUD.areas) && HUD.areas.length === 2);
  assert.deepEqual(HUD.areas.map(a => a.action), ['notebook', 'save']);
});

test('shuffleOptions：全排列且 answer 指向正确项', () => {
  const { Overlay } = boot();
  const q = { options: ['甲','乙','丙','丁'], answer: 2 };
  for (const rng of [() => 0, () => 0.999, () => 0.5]) {
    const s = Overlay.shuffleOptions(q, rng);
    assert.deepEqual([...s.options].sort(), ['丙','甲','丁','乙'].sort(), '必须是同一组选项的排列');
    assert.equal(s.options[s.answer], '丙');
  }
  assert.deepEqual(q.options, ['甲','乙','丙','丁'], '不得修改原数组');
});

test('quiz 场景强制走 shuffleOptions 且结算回调 (right,total)', () => {
  const { Overlay, NODES } = boot();
  load('src/data/questions.js');
  const { QUESTIONS } = xh();
  const qs = QUESTIONS.filter(q => q.nodeId === 'n01');
  let calls = 0;
  const orig = Overlay.shuffleOptions;
  Overlay.shuffleOptions = (q, rng) => { calls++; return orig(q, rng); };
  let result = null;
  const scene = Overlay.quiz(qs, null, (r, t) => { result = [r, t]; });
  Overlay.shuffleOptions = orig;
  assert.equal(calls, 3, '每题恰好 shuffle 一次');
  // 依次点击正确选项直至结束
  for (let i = 0; i < 3; i++) {
    scene.draw(mockCtx);
    const area = scene.areas.find(a => a.correct);
    assert.ok(area, '正确选项必须有 correct 标记热区');
    scene.onInput({ type: 'tap', x: area.x + 1, y: area.y + 1 }); // 选择
    scene.onInput({ type: 'key', action: 'confirm' });            // 确认解析→下一题/结算
  }
  assert.deepEqual(result, [3, 3]);
});

test('各弹层 mock ctx 下 draw 不抛', () => {
  const { Overlay, State, NODES } = boot();
  const st = State.create();
  for (const s of [
    Overlay.story(NODES[0], () => {}),
    Overlay.choice(NODES[0], () => {}),
    Overlay.summary(NODES[0], { troops: 500, morale: 8 }, () => {}),
    Overlay.notebook(st, () => {}),
    Overlay.restart(st, () => {}),
  ]) { s.draw(mockCtx); s.update(0.016); }
});

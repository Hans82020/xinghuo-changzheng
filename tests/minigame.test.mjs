import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, xh } from './load.mjs';

const mockCtx = { fillRect(){}, fillText(){}, clearRect(){}, font:'', fillStyle:'', textAlign:'', textBaseline:'', imageSmoothingEnabled:false };

function boot() {
  load('src/data/palette.js'); load('src/data/sprites.js'); load('src/data/nodes.js');
  load('src/data/mg-configs.js'); load('src/engine/render.js'); load('src/engine/mechanics.js');
  load('src/scenes/minigame.js');
  return xh();
}

test('scoreStars：9 类结算星级映射', () => {
  const { MinigameScene, NODES, MG_CONFIGS } = boot();
  const S = MinigameScene.scoreStars;
  assert.equal(S('timing', { perfect:3, good:0, poor:0 }, MG_CONFIGS.mg01), 3);
  assert.equal(S('timing', { perfect:1, good:1, poor:1 }, MG_CONFIGS.mg01), 1);
  assert.equal(S('rhythm', { miss:2, stars:3 }, MG_CONFIGS.mg10), 3);
  assert.equal(S('route', { ok:3 }, MG_CONFIGS.mg06), 3);
  assert.equal(S('defend', { leaked:0 }, MG_CONFIGS.mg03), 3);
  assert.equal(S('defend', { leaked:2 }, MG_CONFIGS.mg03), 1);
  assert.equal(S('allocate', { valid:true, time:10 }, MG_CONFIGS.mg07), 3, '用时<2/3 限额');
  assert.equal(S('allocate', { valid:true, time:25 }, MG_CONFIGS.mg07), 2);
  assert.equal(S('allocate', { valid:false, time:5 }, MG_CONFIGS.mg07), 0);
  assert.equal(S('trust', { trust:85 }, MG_CONFIGS.mg04), 3);
  assert.equal(S('dodge', { hits:1 }, MG_CONFIGS.mg09), 3);
  assert.equal(S('dodge', { hits:5 }, MG_CONFIGS.mg09), 1);
  assert.equal(S('dual', { frontDropped:false, climb:100, t:40 }, MG_CONFIGS.mg13), 3);
  assert.equal(S('finale', {}, MG_CONFIGS.mg14), 3);
});

test('create：返回可运行场景且 mock ctx 下 draw 不抛', () => {
  const { MinigameScene, NODES } = boot();
  const st = { seed: 12345 };
  let done = -1;
  const scene = MinigameScene.create(NODES[0], st, s => { done = s; });
  assert.equal(typeof scene.update, 'function');
  assert.equal(typeof scene.draw, 'function');
  assert.equal(typeof scene.onInput, 'function');
  scene.draw(mockCtx);
  scene.update(0.016); scene.update(5); // 快进也应安全
  scene.onInput({ type:'tap', x:160, y:90 });
});

test('defend 型（mg03）：快进至结算回调一次且星级合法', () => {
  const { MinigameScene, NODES } = boot();
  let calls = 0, stars = -1;
  const scene = MinigameScene.create(NODES[2], { seed: 7 }, s => { calls++; stars = s; });
  for (let i = 0; i < 30 && calls === 0; i++) scene.update(3); // 反复快进直至回调触发
  assert.equal(calls, 1, 'onDone 恰好被调用一次');
  assert.ok(stars >= 0 && stars <= 3, '星级应在 0~3 之间');
  scene.update(3); scene.update(3);
  assert.equal(calls, 1, '结算后继续 update 不得重复回调');
});

test('trust 型（mg04）：连点正确选项 3 轮回调一次且 3 星', () => {
  const { MinigameScene, NODES } = boot();
  let calls = 0, stars = -1;
  const scene = MinigameScene.create(NODES[3], { seed: 7 }, s => { calls++; stars = s; });
  scene.draw(mockCtx);                                        // 先绘制以暴露热区
  const area = scene.areas.find(a => a.action === 'positive');
  assert.ok(area, 'trust 场景需把按钮热区暴露到 scene.areas');
  for (let i = 0; i < 3; i++) {
    scene.update(1.5);                                        // 跳过解析展示回到提问
    scene.onInput({ type: 'tap', x: area.x + 5, y: area.y + 5 });
  }
  scene.update(0.9);                                          // 结算展示 0.8s 后回调
  assert.equal(calls, 1, 'onDone 恰好被调用一次');
  assert.equal(stars, 3, '3 轮全选正确项应得 3 星');
  scene.update(1);
  assert.equal(calls, 1, '不得重复回调');
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { load, xh } from './load.mjs';

const mockCtx = { fillRect(){}, fillText(){}, clearRect(){}, font:'', fillStyle:'', textAlign:'', textBaseline:'' };

function boot() {
  load('src/data/palette.js'); load('src/data/sprites.js'); load('src/data/nodes.js'); load('src/data/map-terrain.js');
  load('src/data/questions.js'); load('src/data/events.js'); load('src/data/mg-configs.js');
  load('src/core/state.js'); load('src/core/save.js'); load('src/platform/platform.js');
  load('src/engine/render.js'); load('src/engine/loop.js'); load('src/engine/mechanics.js');
  load('src/scenes/minigame.js'); load('src/ui/hud.js'); load('src/ui/overlays.js');
  load('src/scenes/title.js'); load('src/scenes/march.js'); load('src/scenes/nodeflow.js'); load('src/scenes/report.js');
  return xh();
}

// 事件卡（Overlay.choice，有 areas）：tap 选项行两次 = 选中 + 确认
function confirmChoice(card) {
  card.draw(mockCtx);
  const a = card.areas[0];
  card.onInput({ type: 'tap', x: a.x + 3, y: a.y + 3 });
  card.onInput({ type: 'tap', x: a.x + 3, y: a.y + 3 });
}

// 驱动 march：栈顶是 march 则 update，是事件卡则自动选选项 0；返回各事件卡的资源变动
function driveEvents(m, st, nCards) {
  const Loop = xh().Loop;
  const cards = [];
  for (let n = 0; n < nCards; n++) {
    for (let i = 0; i < 300 && Loop.top() === m; i++) m.update(0.1);
    const card = Loop.top();
    assert.notEqual(card, m, '应弹出事件卡');
    const snap = { t: st.troops, s: st.supply, m: st.morale, f: st.faith };
    confirmChoice(card);
    assert.equal(Loop.top(), m, '事件卡确认后回到 march');
    cards.push({ troops: st.troops - snap.t, supply: st.supply - snap.s, morale: st.morale - snap.m, faith: st.faith - snap.f });
  }
  return cards;
}

const effectsMatch = d => xh().EVENTS.some(ev => ev.options.some(o =>
  d.troops === (o.effects.troops || 0) && d.supply === (o.effects.supply || 0) &&
  d.morale === (o.effects.morale || 0) && d.faith === (o.effects.faith || 0)));

// 驱动 march 直至无 areas 的弹层（story）出现；途中事件卡（choice，draw 后有热区）自动选选项 0
function driveToStory(m, st) {
  const Loop = xh().Loop;
  for (let i = 0; i < 300; i++) {
    const top = Loop.top();
    if (top === m) { m.update(0.1); continue; }
    top.draw(mockCtx);
    if (Array.isArray(top.areas) && top.areas.length) confirmChoice(top);   // 事件卡
    else return top;                                                        // story
  }
  return null;
}

test('title：工厂形状、无档 confirm 新建进 march、有档读档进 march', () => {
  const { Scenes, State, Save, Platform, NODES } = boot();
  const Loop = xh().Loop;
  Platform.storage.remove(Save.KEY);
  Loop.stack.length = 0;
  const t = Scenes.title();
  assert.equal(typeof t.update, 'function');
  assert.equal(typeof t.draw, 'function');
  assert.equal(typeof t.onInput, 'function');
  Loop.push(t); t.draw(mockCtx); t.update(0.016);            // mock ctx 下不抛
  t.onInput({ type: 'key', action: 'confirm' });
  assert.equal(Loop.top().name, 'march', '无档 confirm 新建进 march');
  assert.equal(Loop.stack.length, 1);
  assert.equal(Loop.top().st.nodeIndex, 0, '新建局从第 0 节点开始');

  // 有档：confirm 读档（资源保留）
  Loop.stack.length = 0;
  const saved = State.create(); saved.nodeIndex = 2;
  saved.troops = 77777; saved.supply = 66; saved.morale = 55; saved.faith = 44;
  Save.write(Platform.storage, saved);
  const t2 = Scenes.title(); Loop.push(t2);
  t2.onInput({ type: 'key', action: 'confirm' });
  assert.equal(Loop.top().name, 'march', '有档 confirm 读档进 march');
  assert.equal(Loop.top().st.troops, 77777, '读档资源保留');
  assert.equal(Loop.top().st.nodeIndex, 2);
});

test('title：K 键（continue）有档进 march，无档无效', () => {
  const { Scenes, State, Save, Platform } = boot();
  const Loop = xh().Loop;
  // 无档：K 无效
  Platform.storage.remove(Save.KEY);
  Loop.stack.length = 0;
  const t = Scenes.title(); Loop.push(t);
  t.onInput({ type: 'key', action: 'continue' });
  assert.equal(Loop.top().name, 'title', '无档 K 不应进入 march');
  // 有档：K 读档进 march
  Save.write(Platform.storage, State.create());
  const t2 = Scenes.title(); Loop.push(t2);
  t2.onInput({ type: 'key', action: 'continue' });
  assert.equal(Loop.top().name, 'march', '有档 K 进 march');
});

test('march：enter/update 推进、elapsedMs 累加、0.4/0.8 固定 seed 事件确定性且 effects 生效', () => {
  const { Scenes, State, NODES } = boot();
  const Loop = xh().Loop;
  const run = seed => {
    const st = State.create(); st.nodeIndex = 1; State.beginNode(st, NODES[1]); st.seed = seed;
    Loop.stack.length = 0;
    const m = Scenes.march(st); Loop.push(m);
    const cards = driveEvents(m, st, 2);
    assert.ok(st.elapsedMs > 0, 'elapsedMs 应在 update 中累加');
    return cards;
  };
  const a = run(7), b = run(7);
  assert.deepEqual(a, b, '同 seed 两轮事件效果序列必须一致（确定性）');
  for (const d of a) assert.ok(effectsMatch(d), '事件选项 effects 已通过 applyDelta 应用');
});

test('march：抵达触发 NodeFlow.start（栈顶出现 story，beginNode 生效）', () => {
  const { Scenes, State, NODES } = boot();
  const Loop = xh().Loop;
  const st = State.create(); st.nodeIndex = 1; State.beginNode(st, NODES[1]); st.seed = 7;
  Loop.stack.length = 0;
  const m = Scenes.march(st); Loop.push(m);
  driveEvents(m, st, 2);
  const story = driveToStory(m, st);
  assert.ok(story, '抵达终点应触发 NodeFlow.start 压入 story');
  assert.equal(Loop.stack.length, 2, '栈 = march + story');
  assert.equal(st.troops, NODES[1].entry.troops, 'beginNode 已按 entry 重置兵力');
  assert.equal(st.morale, NODES[1].entry.morale, 'beginNode 已按 entry 重置士气');
});

test('march：n03（湘江）到达先弹减员提示卡，确认后进入 n03 流程剧情卡', () => {
  const { Scenes, State, NODES } = boot();
  const Loop = xh().Loop;
  const st = State.create(); st.nodeIndex = 2; State.beginNode(st, NODES[2]); st.seed = 7;
  Loop.stack.length = 0;
  const m = Scenes.march(st); Loop.push(m);
  driveEvents(m, st, 2);
  const story1 = driveToStory(m, st);
  assert.ok(story1, 'n03 到达应先弹减员提示卡');
  assert.equal(Loop.stack.length, 2, '栈 = march + 减员卡');
  Loop.top().onInput({ type: 'key', action: 'confirm' });        // 减员卡确认
  assert.equal(Loop.stack.length, 2, '确认后进入 n03 流程（栈顶仍是 story）');
  assert.equal(st.troops, NODES[2].entry.troops + (st.lastBonus || 0), 'n03 beginNode 生效');
  Loop.top().onInput({ type: 'key', action: 'confirm' });        // n03 剧情卡确认 → 人物对话
  for (let i = 0; i < NODES[2].dialog.length; i++)
    Loop.top().onInput({ type: 'key', action: 'confirm' });      // 对话逐句推进
  Loop.top().draw(mockCtx);
  assert.ok(Array.isArray(Loop.top().areas), '对话完结后应为 choice（有热区）');
});

test('march：resync——节点完成回 march 后一帧重同步，不重复进入上一节点流程', () => {
  const { Scenes, State, NODES } = boot();
  const Loop = xh().Loop;
  const st = State.create(); st.nodeIndex = 0; State.beginNode(st, NODES[0]); st.seed = 7;
  Loop.stack.length = 0;
  const m = Scenes.march(st); Loop.push(m);
  m.update(0.1);                                                  // march 已持有旧节点（idx=0）
  st.nodeIndex = 1;                                               // 模拟节点流程完成：nodeIndex 已推进
  m.update(0.1);                                                  // 重同步帧：enter 后本帧不前进、不压栈
  assert.equal(Loop.top(), m, '重同步帧栈顶仍是 march');
  assert.equal(Loop.stack.length, 1, '无 story/choice 压入（不重复进入上一节点流程）');
  driveEvents(m, st, 2);                                          // 重同步后向新节点行军，途中事件照常
  assert.ok(driveToStory(m, st), '抵达新节点应进入其节点流程 story');
  Loop.top().onInput({ type: 'key', action: 'confirm' });         // 关 story → 人物对话
  for (let i = 0; i < NODES[1].dialog.length; i++)
    Loop.top().onInput({ type: 'key', action: 'confirm' });       // 对话推进完 → choice
  Loop.top().draw(mockCtx);
  assert.deepEqual(Loop.top().areas.map(a => a.option.label),
    NODES[1].choice.options.map(o => o.label), '进入的是 NODES[1]（新节点）而非上一节点的流程');
});

test('nodeflow.start：story→choice→quiz→minigame 逐级推进，quiz 用 correct 热区作答', () => {
  const { NodeFlow, State, NODES } = boot();
  const Loop = xh().Loop;
  const st = State.create();
  Loop.stack.length = 0;
  Loop.push({ update() {}, draw() {} });                          // 假底层（代 march）
  NodeFlow.start(st, NODES[0]);
  assert.equal(st.troops, NODES[0].entry.troops, 'beginNode 生效');
  assert.equal(Loop.stack.length, 2, '栈 = 假底层 + story');
  Loop.top().onInput({ type: 'key', action: 'confirm' });         // story 确认 → 人物对话
  Loop.top().draw(mockCtx);
  assert.equal(Loop.stack.length, 2, 'story 后进入对话（栈高不变）');
  assert.ok(Loop.top().areas && Loop.top().areas.length === 0, '对话卡无热区（区别于 choice）');
  for (let i = 0; i < NODES[0].dialog.length; i++)
    Loop.top().onInput({ type: 'key', action: 'confirm' });       // 对话逐句推进至完结
  Loop.top().draw(mockCtx);
  assert.ok(Array.isArray(Loop.top().areas) && Loop.top().areas.length, '对话完结后应进入 choice');
  assert.equal(Loop.stack.length, 2);
  confirmChoice(Loop.top());                                      // 选选项 0（n01 正确项 morale+4）
  assert.equal(st.morale, NODES[0].entry.morale + 4, 'choice effects 由 NodeFlow.applyDelta 应用');
  Loop.top().draw(mockCtx);
  assert.ok(Array.isArray(Loop.top().areas), 'choice 后应进入 quiz');
  for (let i = 0; i < 3; i++) {                                   // 3 题全对
    const top = Loop.top(); top.draw(mockCtx);
    const a = top.areas.find(a => a.correct);
    assert.ok(a, '每题都有 correct 热区');
    top.onInput({ type: 'tap', x: a.x + 1, y: a.y + 1 });
    top.onInput({ type: 'tap', x: 5, y: 5 });
  }
  assert.deepEqual([st.quizRight, st.quizTotal], [3, 3], 'quizResult 由 NodeFlow 记账');
  assert.equal(Loop.stack.length, 2, 'quiz 后应进入 minigame');
  Loop.top().onInput({ type: 'key', action: 'confirm' });         // 脱离 minigame ready 指引屏
  for (let i = 0; i < 40 && st.mgStars.n01 == null; i++) Loop.top().update(2);   // 快进结算
  assert.equal(st.mgStars.n01, 0, 'timing 未按键 0 星');
});

test('finishMg：finishNode/存档写入/summary 压栈，确认后回到 march', () => {
  const { NodeFlow, Scenes, State, Save, Platform, NODES } = boot();
  const Loop = xh().Loop;
  Platform.storage.remove(Save.KEY);
  const st = State.create(); State.beginNode(st, NODES[0]);
  Loop.stack.length = 0;
  Loop.push(Scenes.march(st));                                    // 真实底层 march
  Loop.push({ update() {}, draw() {} });                          // 代 minigame（finishMg 将 replace 它）
  NodeFlow.finishMg(st, NODES[0], 3);
  assert.equal(st.mgStars.n01, 3, 'mgStars 写入');
  assert.ok(st.notebook.includes('n01'), 'notebook 收录');
  assert.equal(st.nodeIndex, 1, 'nodeIndex 推进');
  assert.equal(st.lastBonus, 500, 'troops 奖励计入 lastBonus');
  assert.ok(Platform.storage.get(Save.KEY), '存档已写入');
  assert.equal(Loop.stack.length, 2, '栈 = march + summary');
  assert.equal(st.morale, NODES[0].entry.morale + 8, 'mgReward 全额应用（3 星）');
  Loop.top().onInput({ type: 'key', action: 'confirm' });
  assert.equal(Loop.top().name, 'march', 'summary 确认后回到 march');
});

test('finishMg：失败路径弹 restart，onPick(i) 后资源=NODES[i].entry 并 replace 新 march', () => {
  const { NodeFlow, State, NODES } = boot();
  const Loop = xh().Loop;
  const st = State.create(); State.beginNode(st, NODES[0]); st.morale = 0;
  Loop.stack.length = 0;
  NodeFlow.finishMg(st, NODES[0], 0);                             // 0 星无 bonus，morale=0 → 失败
  assert.equal(Loop.stack.length, 1, 'finishMg 后栈顶为 summary');
  Loop.top().onInput({ type: 'key', action: 'confirm' });
  Loop.top().draw(mockCtx);
  assert.ok(Loop.top().areas && Loop.top().areas.length, '失败应弹 restart（有热区）');
  const a = Loop.top().areas[1];                                  // 选第 1 个节点（n02）
  Loop.top().onInput({ type: 'tap', x: a.x + 5, y: a.y + 5 });
  assert.equal(st.troops, NODES[1].entry.troops, 'onPick(1) 后兵力=NODES[1].entry（lastBonus 清零）');
  assert.equal(st.morale, NODES[1].entry.morale, 'onPick(1) 后士气=NODES[1].entry');
  assert.equal(st.supply, NODES[1].entry.supply);
  assert.equal(st.nodeIndex, 1, 'nodeIndex 重置到所选节点');
  assert.equal(Loop.top().name, 'march', 'replace 为新 march');
});

test('finishMg：nodeIndex>=14 走 report', () => {
  const { NodeFlow, State, NODES } = boot();
  const Loop = xh().Loop;
  const st = State.create(); State.beginNode(st, NODES[13]);
  st.nodeIndex = 14; st.morale = 80; st.troops = 30000;
  Loop.stack.length = 0;
  NodeFlow.finishMg(st, NODES[13], 3);
  Loop.top().onInput({ type: 'key', action: 'confirm' });
  assert.equal(Loop.top().name, 'report', '完成第 14 节点后应进入通关报告');
  assert.equal(Loop.stack.length, 1);
});

test('report：mock ctx draw 不抛，结语三档，重新出发清档回 title', () => {
  const { Scenes, State, Save, Platform, NODES } = boot();
  const Loop = xh().Loop;
  const base = State.create();
  base.elapsedMs = 754000; base.quizRight = 30; base.quizTotal = 42;
  base.mgStars = { n01: 3, n02: 2 }; base.troops = 27000;
  const allIds = NODES.map(n => n.id);
  assert.equal(Scenes.report({ ...base, notebook: [] }).word, '长征永远在路上', '<50% 档');
  assert.equal(Scenes.report({ ...base, notebook: allIds.slice(0, 8) }).word, '星星之火，正在燎原', '<90% 档');
  assert.equal(Scenes.report({ ...base, notebook: allIds }).word, '红军不怕远征难，万水千山只等闲', '100% 档');
  // draw 不抛 + 重新出发
  Platform.storage.remove(Save.KEY);
  Save.write(Platform.storage, base);
  const rp = Scenes.report({ ...base, notebook: allIds });
  Loop.stack.length = 0; Loop.push(rp);
  rp.draw(mockCtx); rp.update(0.016);
  rp.onInput({ type: 'tap', x: 160, y: 170 });
  assert.equal(Loop.top().name, 'title', '重新出发回 title');
  assert.equal(Loop.stack.length, 1, '清栈后仅剩 title');
  assert.equal(Platform.storage.get(Save.KEY), null, '重新出发应清除存档');
});

test('__jump(m)：新建 State 直接进入第 m 个节点流程', () => {
  const { NodeFlow, Scenes, NODES } = boot();
  const Loop = xh().Loop;
  Loop.stack.length = 0;
  const st = NodeFlow.__jump(3);
  assert.equal(st.nodeIndex, 3, 'nodeIndex 指向目标节点');
  assert.equal(st.troops, NODES[3].entry.troops, 'beginNode 已生效');
  assert.equal(Loop.stack.length, 2, '栈 = march 底 + story');
  assert.equal(Loop.stack[0].name, 'march', '栈底为 march（流程结束后可回）');
  Loop.top().onInput({ type: 'key', action: 'confirm' });         // story → 人物对话
  for (let i = 0; i < NODES[3].dialog.length; i++)
    Loop.top().onInput({ type: 'key', action: 'confirm' });       // 对话推进完 → choice
  Loop.top().draw(mockCtx);
  assert.ok(Array.isArray(Loop.top().areas), '对话完结后进入 choice');
});

test('dialog：逐句推进、完结 pop 并回调一次', () => {
  const { Overlay } = boot();
  const Loop = xh().Loop;
  Loop.stack.length = 0;
  let done = 0;
  const lines = [{ who: '毛泽东', line: '声东击西，往空虚处走。' }, { who: '朱德', line: '三渡调敌，回头四渡，南下贵阳！' }];
  Loop.push(Overlay.dialog(lines, () => { done++; }));
  Loop.top().draw(mockCtx);                                       // 第 1 句绘制不抛
  Loop.top().onInput({ type: 'key', action: 'confirm' });         // → 第 2 句
  assert.equal(Loop.stack.length, 1, '未完结不弹层');
  assert.equal(done, 0, '未完结不回调');
  Loop.top().draw(mockCtx);
  Loop.top().onInput({ type: 'tap', x: 160, y: 90 });             // 第 2 句确认 → 完结
  assert.equal(done, 1, '完结回调一次');
  assert.equal(Loop.stack.length, 0, '完结后弹层 pop');
});

test('DEBUG_LOCK：开启时 applyEffects 负值归零，关闭时正常应用', () => {
  const { NodeFlow, State } = boot();
  const X = xh();
  const st = State.create(); st.troops = 100; st.morale = 50; st.faith = 50;
  X.DEBUG_LOCK = true;
  NodeFlow.applyEffects(st, { troops: -50, morale: -10, faith: 5 });
  assert.equal(st.troops, 100, '负兵力被归零');
  assert.equal(st.morale, 50, '负士气被归零');
  assert.equal(st.faith, 55, '正值正常应用');
  X.DEBUG_LOCK = false;
  NodeFlow.applyEffects(st, { troops: -50, morale: -10 });
  assert.equal(st.troops, 50, '锁关闭后负值正常生效');
  assert.equal(st.morale, 40);
});

test('pickEvent：坏档 seed（NaN/0/负数）回退常数，事件抽取不退化且确定', () => {
  const { NodeFlow, State, EVENTS } = boot();
  const st = State.create(); st.seed = NaN;
  const ev = NodeFlow.pickEvent(st);
  assert.ok(EVENTS.includes(ev), 'seed=NaN 回退后仍抽到合法事件');
  assert.ok(Number.isFinite(st.seed) && st.seed > 0, 'seed 已回退为有限正数');
  st.seed = 0;
  assert.ok(EVENTS.includes(NodeFlow.pickEvent(st)), 'seed=0 回退后仍抽到合法事件');
  st.seed = -5;
  assert.ok(EVENTS.includes(NodeFlow.pickEvent(st)), 'seed=负数 回退后仍抽到合法事件');
  const st2 = State.create(); st2.seed = NaN;
  assert.equal(NodeFlow.pickEvent(st2).text, ev.text, '同回退常数两次抽取结果确定一致');
});

test('march：HUD 热区 tap——图鉴 push notebook，存档写档', () => {
  const { Scenes, State, Save, Platform, NODES } = boot();
  const Loop = xh().Loop;
  Platform.storage.remove(Save.KEY);
  const st = State.create(); st.nodeIndex = 1; State.beginNode(st, NODES[1]);
  Loop.stack.length = 0;
  const m = Scenes.march(st); Loop.push(m);
  m.draw(mockCtx);                                                // HUD.draw 写入 XH.HUD.areas
  m.onInput({ type: 'tap', x: 265, y: 12 });                      // 图鉴热区 (250,6,30,12)
  assert.equal(Loop.stack.length, 2, '图鉴应 push notebook');
  assert.notEqual(Loop.top(), m);
  Loop.top().onInput({ type: 'key', action: 'confirm' });         // 关闭图鉴
  assert.equal(Loop.top(), m, '图鉴关闭回到 march');
  m.onInput({ type: 'tap', x: 299, y: 12 });                      // 存档热区 (284,6,30,12)
  assert.ok(Platform.storage.get(Save.KEY), '存档热区触发 Save.write');
});

test('video：无头环境自动跳过并回调，14 节点视频资产齐全，跳过后进 story', () => {
  const { Scenes, State, NodeFlow, NODES } = boot();
  const Loop = xh().Loop;
  for (const nd of NODES) assert.ok(existsSync(new URL('../assets/videos/' + nd.id + '.mp4', import.meta.url)), '缺少视频资产 ' + nd.id);
  // 无 DOM 环境：push 后立即 pop 并回调一次
  Loop.stack.length = 0;
  const base = { name: 'base', update() {}, draw() {}, onInput() {} };
  Loop.push(base);
  let done = 0;
  Loop.push(XH.Overlay.video(NODES[0], () => done++));
  assert.equal(done, 1, '无头环境 video 应自动回调');
  assert.equal(Loop.top(), base, 'video 应自行 pop 回到底层');
  // 完整流程：NodeFlow.start 后 video 自动跳过，栈顶直接是 story
  Loop.stack.length = 0;
  const st = State.create(); st.nodeIndex = 2;
  Loop.push(Scenes.march(st));
  NodeFlow.start(st, NODES[2]);
  const m2 = Loop.stack[0];
  assert.equal(Loop.stack.length, 2, 'video 自动跳过，栈中只剩 march+story');
  assert.notEqual(Loop.top(), m2, '栈顶应是 story 而非 march');
  assert.equal(typeof Loop.top().onInput, 'function', '栈顶应为可交互的 story 弹层');
});

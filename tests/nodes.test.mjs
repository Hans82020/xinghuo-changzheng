import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, xh } from './load.mjs';

const RES = ['troops','supply','morale','faith'];
test('节点：14 个、字段完整、入口资源递减合理、坐标在画布内', () => {
  load('src/data/palette.js'); load('src/data/nodes.js');
  const N = xh().NODES;
  assert.equal(N.length, 14);
  N.forEach((n, i) => {
    assert.equal(n.id, 'n' + String(i + 1).padStart(2, '0'));
    for (const k of ['name','date','theme','pos','story','emotion','dialog','choice','quiz','mg','entry','mgReward','noteCard'])
      assert.ok(n[k] !== undefined && n[k] !== null && n[k] !== '', `${n.id} 缺 ${k}`);
    assert.ok(n.story.length >= 2 && n.story.every(s => s.length >= 20), `${n.id} story 太薄`);
    assert.ok(n.dialog.length >= 2, `${n.id} dialog 至少两句`);
    n.dialog.forEach(d => {
      assert.ok(d.who && d.who.length <= 4, `${n.id} dialog who 名牌过长或缺失`);
      assert.ok(d.line && d.line.length >= 6 && d.line.length <= 40, `${n.id} dialog line 长度越界`);
    });
    assert.ok(['史实','经典故事'].includes(n.emotion.tag));
    assert.ok(n.emotion.text.length >= 30);
    const corr = n.choice.options.filter(o => o.correct);
    assert.equal(corr.length, 1, `${n.id} choice 需恰一个正确项`);
    n.choice.options.forEach(o => { RES.forEach(r => assert.ok(r in o.effects)); assert.ok(o.explain.length >= 8); });
    RES.forEach(r => assert.ok(Number.isFinite(n.entry[r]) && n.entry[r] >= 0));
    assert.ok(n.pos[0] >= 8 && n.pos[0] <= 312 && n.pos[1] >= 32 && n.pos[1] <= 158, `${n.id} pos 越界`);
    assert.ok(n.noteCard.facts.length >= 2 && n.noteCard.story.length >= 20);
  });
  assert.equal(N[2].entry.troops, 86000, '湘江入口应为出发兵力');
  assert.equal(N[3].entry.troops, 30000, '湘江后剧情性锐减');
  assert.ok(N[13].entry.troops <= 30000 && N[13].id === 'n14');
});

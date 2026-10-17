import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, xh } from './load.mjs';

test('题库：每节点 3 题、4 选项、答案合法、解析非空', () => {
  load('src/data/palette.js'); load('src/data/nodes.js'); load('src/data/questions.js');
  const { QUESTIONS, NODES } = xh();
  for (const n of NODES) {
    const qs = QUESTIONS.filter(q => q.nodeId === n.id);
    assert.equal(qs.length, 3, `${n.id} 应有 3 题`);
    qs.forEach(q => {
      assert.equal(q.options.length, 4);
      assert.ok(q.answer >= 0 && q.answer < 4);
      assert.ok(q.explain.length >= 10, '解析过短');
      assert.ok(q.q.length >= 8);
      const uniq = new Set(q.options); assert.equal(uniq.size, 4);
    });
  }
});

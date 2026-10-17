import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, xh } from './load.mjs';

test('loop：栈 push/pop/replace/top 与输入派发到栈顶', () => {
  load('src/engine/loop.js'); const L = xh().Loop;
  const log = [];
  const a = { enter(){ log.push('enterA'); }, onInput(e){ log.push('a:' + e); } };
  const b = { enter(){ log.push('enterB'); }, onInput(e){ log.push('b:' + e); } };
  L.stack.length = 0; // 单例栈，测试前清空
  L.push(a); assert.deepEqual(log, ['enterA']); assert.equal(L.top(), a);
  L.push(b); assert.equal(L.top(), b);
  L.handleInput('go');
  assert.ok(log.includes('b:go'), '输入派发到栈顶');
  assert.ok(!log.includes('a:go'), '非栈顶场景不收输入');
  L.pop(); assert.equal(L.top(), a, 'pop 后回到下层场景');
  L.replace(b); assert.equal(L.top(), b);
  assert.equal(log.filter(s => s === 'enterB').length, 2, 'replace 会重新触发 enter');
  L.handleInput('x');
  assert.ok(log.includes('b:x') && !log.includes('a:x'));
  L.stack.length = 0;
  L.handleInput('noop'); // 空栈不抛异常
});

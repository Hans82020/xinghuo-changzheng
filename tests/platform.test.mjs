import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, xh } from './load.mjs';

test('platform：Node 下存储降级为内存实现且读写一致；输入/音频接口存在', () => {
  load('src/platform/platform.js');
  const P = xh().Platform;
  P.storage.set('t', { a: 1 });
  assert.deepEqual(P.storage.get('t'), { a: 1 });
  P.storage.remove('t'); assert.equal(P.storage.get('t'), null);
  ['on','bindCanvas'].forEach(k => assert.equal(typeof P.input[k], 'function'));
  ['init','play'].forEach(k => assert.equal(typeof P.audio[k], 'function'));
});

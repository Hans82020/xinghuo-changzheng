import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, xh } from './load.mjs';

test('调色板：颜色数 28~36 且值合法、键唯一', () => {
  load('src/data/palette.js');
  const P = xh().PALETTE;
  const keys = Object.keys(P);
  assert.ok(keys.length >= 28 && keys.length <= 36, `颜色数=${keys.length}`);
  const hex = /^#[0-9a-f]{6}$/i;
  for (const [k, v] of Object.entries(P)) assert.match(v, hex, k);
  assert.equal(new Set(Object.values(P)).size, keys.length, '存在重复色值');
});

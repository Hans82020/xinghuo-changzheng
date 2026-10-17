import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, xh } from './load.mjs';

test('精灵：矩形完整且字符合法', () => {
  load('src/data/palette.js'); load('src/data/sprites.js');
  const { SPRITES, SPRITE_MAP } = xh();
  const valid = new Set(['.', ...Object.keys(SPRITE_MAP)]);
  for (const [name, sp] of Object.entries(SPRITES)) {
    assert.equal(sp.rows.length, sp.h, name);
    for (const r of sp.rows) { assert.equal(r.length, sp.w, name); for (const c of r) assert.ok(valid.has(c), `${name} 非法字符 ${c}`); }
  }
  const need = ['soldier','soldier2','flag','boat','plane','plank','elder','enemy','campfire','banner'];
  for (const n of need) assert.ok(SPRITES[n], `缺少精灵 ${n}`);
});

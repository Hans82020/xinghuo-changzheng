import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, xh } from './load.mjs';

test('render：中文按像素宽换行；主题色存在', () => {
  load('src/data/palette.js'); load('src/engine/render.js');
  const R = xh().Render;
  const lines = R.wrapText('一二三四五六七八九十甲乙丙', 8);
  assert.deepEqual(lines, ['一二三四五六七八', '九十甲乙丙']); // 8 汉字/行；原预期串丢"九"字，据 CJK=1 语义修正
  for (const t of ['jiangnan','mountain','snow','grass','loess']) assert.ok(R.THEMES[t]);
});

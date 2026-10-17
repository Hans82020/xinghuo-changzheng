import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('build：产出 index.html，包含已存在源文件且按序排列', () => {
  execSync(`"${process.execPath}" build.mjs`, { cwd: root });
  const html = readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(html.trim().endsWith('</html>'));
  assert.ok(html.includes('<title>星火长征</title>'));
  const order = ['palette.js','sprites.js','nodes.js','questions.js','events.js','state.js','save.js'];
  let last = -1;
  for (const f of order) {
    const i = html.indexOf(`/*== ${f} ==*/`);
    assert.ok(i > last, `缺少标记 /*== ${f} ==*/ 或顺序错误`);
    last = i;
  }
  // 源码不得含 </script（防注入破坏单文件结构）
  assert.ok(!/<\/script/i.test(readFileSync(path.join(root, 'src/data/palette.js'), 'utf8')));
});

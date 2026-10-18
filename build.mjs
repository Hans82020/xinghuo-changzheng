// build.mjs —— 将 src 按序拼接为单文件 index.html（缺失的源文件自动跳过）
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const ORDER = [
  'src/data/palette.js', 'src/data/sprites.js', 'src/data/nodes.js', 'src/data/map-terrain.js',
  'src/data/questions.js', 'src/data/events.js', 'src/data/mg-configs.js',
  'src/core/state.js', 'src/core/save.js', 'src/platform/platform.js',
  'src/engine/render.js', 'src/engine/loop.js', 'src/engine/mechanics.js',
  'src/scenes/minigame.js',
  'src/ui/hud.js', 'src/ui/overlays.js', 'src/scenes/title.js', 'src/scenes/march.js',
  'src/scenes/nodeflow.js', 'src/scenes/report.js', 'src/main.js',
];

const parts = [];
const skipped = [];
for (const f of ORDER) {
  const full = path.join(root, f);
  if (!existsSync(full)) { skipped.push(f); continue; }
  const code = readFileSync(full, 'utf8');
  if (/<\/script/i.test(code)) throw new Error(`${f} 含有 </script，会破坏单文件结构`);
  parts.push(`/*== ${path.basename(f)} ==*/\n${code}`);
}
if (skipped.length) console.log('跳过缺失:\n  ' + skipped.join('\n  '));
if (parts.length === 0) throw new Error('没有任何源文件可构建');

const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>星火长征</title>
<style>
html,body{margin:0;height:100%;background:#0b0e13;overflow:hidden}
#wrap{height:100%;display:flex;align-items:center;justify-content:center}
canvas{image-rendering:pixelated;image-rendering:crisp-edges;touch-action:none}
</style></head><body><div id="wrap"><canvas id="game" width="960" height="540"></canvas></div>
<script>
${parts.join('\n')}
</script></body></html>`;
writeFileSync(path.join(root, 'index.html'), html);
console.log(`index.html 生成完毕：${parts.length}/${ORDER.length} 个源文件，${html.length} 字节`);

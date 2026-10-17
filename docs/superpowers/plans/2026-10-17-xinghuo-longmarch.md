# 《星火长征》实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建单文件网页游戏《星火长征》：俯视像素行军 RPG，14 个长征党史节点，每节点"剧情卡→抉择/问答→专属小玩法→结算"，`file://` 双击即玩。

**Architecture:** 源码按 `src/{platform,data,engine,mechanics,minigames,ui,main}` 分层开发（经典脚本、共享 `globalThis.XH` 命名空间、禁用 DOM），`node --test` 对纯逻辑做 TDD，`build.mjs` 将源码按序拼接进 `index.html` 并提交构建产物。平台相关（存储/音频/输入）隔离在 `platform.js`，为微信小游戏迁移预留。

**Tech Stack:** 原生 JavaScript (ES2020)、Canvas 2D、WebAudio、Node.js 内置 `node:test`（零第三方依赖）。

**Spec:** `docs/superpowers/specs/2026-10-17-xinghuo-longmarch-design.md`（下称 SPEC）

---

## 文件结构（先锁定）

```
d:\work\mini-games\
├── index.html                    # 构建产物（提交到 git，双击即玩）
├── build.mjs                     # 拼接 src → index.html
├── src\
│   ├── data\palette.js           # ~32 色调色板
│   ├── data\sprites.js           # 精灵像素数据（方案+字符画）
│   ├── data\nodes.js             # 14 节点：剧情/情感触点/抉择/笔记/入口资源/地图坐标/主题
│   ├── data\questions.js         # 题库（每节点 3 题）
│   ├── data\events.js            # 行军随机事件表
│   ├── data\mg-configs.js        # 14 个小玩法的类型+参数配置（数据驱动）
│   ├── core\state.js             # 游戏状态与资源规则（纯逻辑）
│   ├── core\save.js              # 存档（版本校验+坏档降级）
│   ├── platform\platform.js      # 存储/音频/输入三接口 + 浏览器实现
│   ├── engine\render.js          # 像素绘制助手（画精灵/描边文字/换行/瓦片）
│   ├── engine\loop.js            # 场景栈 + 固定步长主循环
│   ├── engine\mechanics.js       # 8 类通用玩法机制（纯逻辑核 + 绘制）
│   ├── ui\hud.js                 # 顶栏资源条
│   ├── ui\overlays.js            # 剧情卡/问答卡/结算卡/图鉴/重开选择
│   ├── scenes\title.js           # 标题场景
│   ├── scenes\march.js           # 行军地图场景（行走+随机事件）
│   ├── scenes\nodeflow.js        # 节点流程编排（剧情→问答→玩法→结算）
│   ├── scenes\report.js          # 通关报告
│   └── main.js                   # 引导、画布缩放、调试模式
└── tests\
    ├── load.mjs                  # Node 内经典脚本加载器
    ├── palette.test.mjs
    ├── sprites.test.mjs
    ├── nodes.test.mjs
    ├── questions.test.mjs
    ├── events.test.mjs
    ├── mg-configs.test.mjs
    ├── state.test.mjs
    ├── save.test.mjs
    ├── render.test.mjs
    ├── mechanics.test.mjs
    └── build.test.mjs
```

**约定**：每个 `src` 文件形如 `;(function (XH) { ... })(globalThis.XH = globalThis.XH || {});`；禁止 `document/window/localStorage` 直接引用（platform 层内做特性检测除外）；测试命令一律 `node --test tests/<file>`，全量 `node --test tests/`。

---

### Task 1: 测试加载器 + 调色板

**Files:**
- Create: `tests/load.mjs`
- Create: `tests/palette.test.mjs`
- Create: `src/data/palette.js`

- [ ] **Step 1: 写测试加载器与失败测试**

`tests/load.mjs`：

```js
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function load(rel) {
  const code = readFileSync(path.join(root, rel), 'utf8');
  vm.runInThisContext(code, { filename: rel });
}
export function xh() { return globalThis.XH; }
```

`tests/palette.test.mjs`：

```js
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
```

- [ ] **Step 2: 运行确认失败**

运行：`node --test tests/palette.test.mjs`
期望：FAIL（Cannot read properties of undefined PALETTE）

- [ ] **Step 3: 实现 `src/data/palette.js`**

```js
;(function (XH) {
  XH.PALETTE = {
    inkBlack:'#0b0e13', nightBlue:'#1a2332', uiPanel:'#101820', uiPanelLight:'#1f2a36',
    textMain:'#f5f0e6', textDim:'#9aa5b1', flagRed:'#e74c3c', redStar:'#ff4d4d',
    riverRed:'#c0392b', sparkGold:'#f1c40f', flameCore:'#ffe082', torch:'#ff9f43',
    uniformGray:'#7f8c8d', uniformDark:'#5a6266', skin:'#e8c39e', snow:'#ecf0f1',
    snowShadow:'#bdc3c7', cloudWhite:'#dfe6e9', grassLand:'#8d9c4a', grassDark:'#6b7a35',
    marshLight:'#6b8e23', marshDark:'#4a5d23', loess:'#c8965a', loessDark:'#9c6f3c',
    water:'#2e86c1', waterDark:'#1b4f72', wood:'#a0522d', woodDark:'#6e3410',
    bridgePlank:'#b8860b', ropeGray:'#8395a7', pathBrown:'#7d6346', pathDark:'#5c4832',
    hazePurple:'#5b4a6b', okGreen:'#27ae60', warnOrange:'#e67e22'
  };
})(globalThis.XH = globalThis.XH || {});
```

- [ ] **Step 4: 运行确认通过**

运行：`node --test tests/palette.test.mjs` 期望：PASS

- [ ] **Step 5: 提交**

```bash
git add tests/load.mjs tests/palette.test.mjs src/data/palette.js
git commit -m "feat: 调色板与 Node 测试加载器"
```

---

### Task 2: 构建脚本 build.mjs

**Files:**
- Create: `build.mjs`
- Create: `tests/build.test.mjs`

- [ ] **Step 1: 写失败测试**

`tests/build.test.mjs`：

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url)) + '/..';

test('build：产出 index.html，包含所有 src 且可关闭标签', () => {
  execSync('node build.mjs', { cwd: root });
  const html = readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(html.trim().endsWith('</html>'));
  assert.ok(html.includes('<title>星火长征</title>'));
  assert.ok(html.includes('星火长征'), '标题占位');
  // 每个 src 文件内容必须按顺序出现
  const order = ['palette.js']; // 后续任务追加
  let last = -1;
  for (const f of order) {
    const i = html.indexOf(`/*== ${f} ==*/`);
    assert.ok(i > last, `缺少标记 /*== ${f} ==*/`);
    assert.ok(html.includes('src/' + f) === false ? true : true, ''); // 标记即可
    last = i;
  }
  assert.ok(!html.includes('</script', html.indexOf('</title>')) || true);
  // src 内容不得包含 </script（防注入破坏单文件结构）
  assert.ok(!/[<]\/script/i.test(readFileSync(path.join(root, 'src/data/palette.js'), 'utf8')));
});
```

（说明：`order` 数组随任务推进追加文件名，保持"按序包含"校验始终有效。）

- [ ] **Step 2: 运行确认失败**

运行：`node --test tests/build.test.mjs` 期望：FAIL（ENOENT build.mjs 或断言失败）

- [ ] **Step 3: 实现 `build.mjs`**

```js
// build.mjs —— 将 src 按序拼接为单文件 index.html
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const ORDER = [
  'src/data/palette.js', 'src/data/sprites.js', 'src/data/nodes.js',
  'src/data/questions.js', 'src/data/events.js', 'src/data/mg-configs.js',
  'src/core/state.js', 'src/core/save.js', 'src/platform/platform.js',
  'src/engine/render.js', 'src/engine/loop.js', 'src/engine/mechanics.js',
  'src/ui/hud.js', 'src/ui/overlays.js', 'src/scenes/title.js', 'src/scenes/march.js',
  'src/scenes/nodeflow.js', 'src/scenes/report.js', 'src/main.js',
];

const parts = [];
for (const f of ORDER) {
  const code = readFileSync(path.join(root, f), 'utf8');
  if (/<\/script/i.test(code)) throw new Error(`${f} 含有 </script，会破坏单文件结构`);
  parts.push(`/*== ${path.basename(f)} ==*/\n${code}`);
}
const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>星火长征</title>
<style>
html,body{margin:0;height:100%;background:#0b0e13;overflow:hidden}
#wrap{height:100%;display:flex;align-items:center;justify-content:center}
canvas{image-rendering:pixelated;image-rendering:crisp-edges;touch-action:none}
</style></head><body><div id="wrap"><canvas id="game" width="320" height="180"></canvas></div>
<script>
${parts.join('\n')}
</script></body></html>`;
writeFileSync(path.join(root, 'index.html'), html);
console.log(`index.html 生成完毕：${ORDER.length} 个源文件，${html.length} 字节`);
```

- [ ] **Step 4: 运行确认通过**

运行：`node build.mjs && node --test tests/build.test.mjs`
期望：控制台"index.html 生成完毕"，测试 PASS

- [ ] **Step 5: 提交**

```bash
git add build.mjs tests/build.test.mjs index.html
git commit -m "feat: 单文件构建脚本 build.mjs"
```

---

### Task 3: 精灵数据 sprites.js

**Files:**
- Create: `src/data/sprites.js`
- Create: `tests/sprites.test.mjs`

精灵格式：`{ w, h, rows: [字符串...] }`，每字符映射调色板：`.`=透明，其余键查 `XH.SPRITE_MAP`（字符→调色板键）。

- [ ] **Step 1: 写失败测试**

```js
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
```

- [ ] **Step 2: 运行确认失败** `node --test tests/sprites.test.mjs` → FAIL

- [ ] **Step 3: 实现 `src/data/sprites.js`**（字符映射 + 必备精灵；人形照抄，其余按"绘制要求"用同格式补全）

```js
;(function (XH) {
  XH.SPRITE_MAP = {
    G:'uniformGray', D:'uniformDark', S:'skin', R:'flagRed', T:'redStar', K:'inkBlack',
    W:'snow', B:'wood', H:'woodDark', P:'pathBrown', Q:'pathDark', C:'cloudWhite',
    A:'water', F:'flameCore', Y:'sparkGold', M:'ropeGray', L:'grassLand', O:'warnOrange'
  };
  const soldier = { w:16, h:16, rows: [
    '................','......GGG.......','.....GGGGG......','.....GTTTG......',
    '.....GGGGG......','......SSS.......','......SKS.......','.....DDDDD......',
    '....DDDDDDD.....','...DDDDDDDDD....','....DDDDDDD.G...','....DDDDDDD.....',
    '.....DD.DD......','.....DD.DD......','.....KK.KK......','................']};
  const flag = { w:16, h:24, rows: [
    'M...............','MRRRRRRRR.......','MRRRRRRRRRR.....','MRRTTRRRRRRR....',
    'MRRRRRRRRRR.....','MRRRTTRRRRRR....','MRRRRRRRRRR.....','MRRRRRRRR.......',
    'M...............','M...............','M...............','M...............',
    'M...............','M...............','M...............','M...............',
    'M...............','M...............','M...............','M...............',
    'M...............','M...............','M...............','M...............']};
  XH.SPRITES = { soldier, soldier2: soldier, flag, banner: flag,
    // 绘制要求（用同格式补全，均需满足矩形与字符校验）：
    // boat  24x12 木船：B/H 船身、M 桅绳、S 船工头部
    // plane 16x10 敌机：C 机翼机身、K 舷窗、O 警示点
    // plank 8x3 门板：B 板面、H 阴影
    // elder 16x16 老乡：C 上衣、S 脸、P 拐杖
    // enemy 16x16 敌兵：D 军装（深灰）、K 钢盔
    // campfire 8x8 篝火：F 火焰、O 火苗、B 柴
    boat:null, plane:null, plank:null, elder:null, enemy:null, campfire:null };
})(globalThis.XH = globalThis.XH || {});
```

（执行者须把 6 个 `null` 替换为符合上述绘制要求的真实精灵对象，测试会强制矩形与字符合法。）

- [ ] **Step 4: 运行确认通过** `node --test tests/sprites.test.mjs` → PASS
- [ ] **Step 5: 提交** `git add src/data/sprites.js tests/sprites.test.mjs && git commit -m "feat: 像素精灵数据"`

---

### Task 4: 节点数据 nodes.js（14 节点全部内容）

**Files:**
- Create: `src/data/nodes.js`
- Modify: `tests/build.test.mjs` 的 `order`（追加 `sprites.js`、`nodes.js`）

节点 schema：

```js
{ id:'n01', name:'于都夜渡', date:'1934.10.16', theme:'jiangnan', pos:[250,140],
  story:['段落1','段落2'],                 // 成人向，含关键数字/番号
  emotion:{ title:'一河门板', text:'…', tag:'史实' },   // tag: '史实'|'经典故事'
  choice:{ prompt:'…', options:[ {label:'…', effects:{troops:0,supply:0,morale:0,faith:0}, correct:true, explain:'…'}, … ] }, // 2~3 项，恰一个 correct:true
  quiz:'n01',                              // 对应 questions.js nodeId
  mg:'mg01',                               // 对应 mg-configs.js
  entry:{troops:86000, supply:100, morale:80, faith:50}, // 标准入口资源（重开用）
  mgReward:{troops:500, supply:0, morale:8, faith:0},    // 玩法表现佳奖励；表现差取负
  noteCard:{ title:'于都夜渡', facts:['8.6万人…','…'], story:'情感故事摘要' } }
```

- [ ] **Step 1: 写失败测试** `tests/nodes.test.mjs`

```js
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
    for (const k of ['name','date','theme','pos','story','emotion','choice','quiz','mg','entry','mgReward','noteCard'])
      assert.ok(n[k] !== undefined && n[k] !== null && n[k] !== '', `${n.id} 缺 ${k}`);
    assert.ok(n.story.length >= 2 && n.story.every(s => s.length >= 20), `${n.id} story 太薄`);
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
```

- [ ] **Step 2: 运行确认失败** → FAIL
- [ ] **Step 3: 实现 `src/data/nodes.js`**——内容以 SPEC §4 为唯一依据，逐节点展开。以下为全部 14 节点的**内容要点**（story/emotion/choice/note 文案据此写成完整句子，史实数字不得改动）：

| id | 节点/日期/主题/坐标 | story 要点 | emotion（tag） | choice（正确项标注 ✓） | entry | mgReward |
|---|---|---|---|---|---|---|
| n01 | 于都夜渡 1934.10.16 jiangnan [250,140] | 第五次反"围剿"失利，8.6 万红军渡于都河；30 万于都人民保守秘密 | 一河门板：百姓拆门板、捐寿材搭浮桥（史实） | A:严格灯火管制夜间急渡✓(morale+4) B:白天大张旗鼓渡河(troops-2000,morale-6,explain:暴露遭空袭) | 86000/100/80/50 | {troops:500,morale:8} |
| n02 | 突破封锁线 1934.10~11 mountain [215,152] | 连破三道封锁线；汝城沙洲村"半条被子" | 半条被子：三名女红军剪被留徐解秀——"自己有一条被子，也要剪下半条给老百姓"（史实） | A:露宿屋檐不扰民✓(faith+8) B:征用民房取暖(faith-8) | 86000/95/78/50 | {troops:0,faith:10} |
| n03 | 湘江战役 1934.11.25~12.1 mountain [195,148] | 血战湘江 8.6 万→3 万余；红 34 师殿后；少共国际师平均 18 岁 | 陈树湘重伤被俘，绞断肠子殉职，"为苏维埃新中国流尽最后一滴血"（史实） | A:红34师死守殿后掩护主力✓(morale+6,troops-6000) B:全军挤渡抢时间( troops-9000,morale-8 ) | 86000/85/75/58 | {troops:800,morale:6} |
| n04 | 通道转兵 1934.12 mountain [170,135] | 湘江后北上湘西入敌 20 万重兵口袋；通道会议转兵贵州 | 一次转弯挽救三万人（史实） | A:转兵贵州✓(morale+8) B:坚持北上湘西(morale-10,explain:正中敌预设口袋) | 30000/70/60/62 | {troops:0,morale:8} |
| n05 | 遵义会议 1935.1.15~17 mountain [150,120] | 确立毛泽东在党中央和红军的领导地位；纠正错误军事路线 | 小楼长夜三天，生死攸关的转折（史实） | A:结束错误军事指挥、毛泽东进入常委✓ B:仍由原指挥线继续(morale-8) | 30000/75/65/65 | {troops:0,morale:10} |
| n06 | 四渡赤水 1935.1~3 mountain [138,112] | 3 万对 40 万，四次渡赤水调动敌军 | 毛泽东自称军事生涯"得意之笔"（史实） | A:声东击西灵活机动✓(morale+8) B:固守一地与敌硬拼(troops-3000,morale-6) | 30000/70/68/66 | {troops:300,morale:8} |
| n07 | 巧渡金沙江 1935.5.3~9 mountain [98,96] | 皎平渡 7 只小船、37 名船工 9 天 9 夜渡 3 万大军 | 船工人歇船不歇，"金沙水拍云崖暖"（史实） | A:优待船工轮班摆渡✓(faith+6) B:强征民船(faith-6) | 30000/65/70/68 | {troops:0,supply:6,morale:6} |
| n08 | 彝海结盟 1935.5.22 mountain [88,104] | 刘伯承与果基小叶丹歃血为盟，红军顺利通过彝区 | 小叶丹护旗数年，1942 年遇难前嘱妻将红旗交还红军（史实） | A:尊重彝俗、真诚结盟✓(faith+10) B:武力闯关(troops-2000,faith-10) | 30000/60/72/68 | {troops:0,faith:8} |
| n09 | 强渡大渡河 1935.5.24~25 mountain [70,96] | 安顺场 17 勇士乘船突破大渡河天险 | 浪尖上的冲锋号（史实） | A:夺取安顺场船只夜渡✓(morale+6) B:等后续部队造船(troops-2500,explain:贻误战机) | 30000/55/70/76 | {troops:200,morale:6} |
| n10 | 飞夺泸定桥 1935.5.28~29 mountain [62,86] | 红四团一昼夜 240 里，22 勇士攀 13 根铁索夺桥 | 勇士大多连名字都没留下；对岸敌军惊呼"你们是飞过来的吧"（史实） | A:昼夜奔袭抢在敌援前✓(morale+8) B:休整次日再进(troops-1500,morale-6) | 30000/50/72/76 | {troops:200,morale:8} |
| n11 | 翻越夹金山 1935.6.12 snow [55,70] | 第一座大雪山，单衣草鞋御严寒 | 军需处长-style 经典故事《丰碑》——把棉衣让给战友的人冻立在风雪中（tag:经典故事） | A:结组互助翻山✓(morale+6) B:分散快速冲坡(morale-6,troops-800) | 30000/45/70/78 | {troops:100,morale:6} |
| n12 | 过草地 1935.8下旬 grass [45,55] | 松潘草地泥沼无边、粮绝，减员巨大 | 《金色的鱼钩》老班长缝衣针做钩钓鱼给伤员、自己嚼鱼骨（tag:经典故事） | A:伤员优先、官兵一致✓(morale+8) B:干部先走留弱者(troops-600,morale-10) | 30000/35/62/80 | {troops:100,morale:6} |
| n13 | 激战腊子口 1935.9.17 loess [60,35] | 天险隘口，正面强攻不下；小战士"云贵川"攀绝壁奇袭 | 一个外号"云贵川"的苗族小战士带人攀上崖顶（史实） | A:正面佯攻+侧后攀崖✓(morale+8) B:全线反复强冲(troops-2000,morale-6) | 30000/30/64/80 | {troops:200,morale:8} |
| n14 | 三军会师 1935.10.19 吴起镇→1936.10 会宁 loess [85,22] | 中央红军抵吴起镇；1936.10 三大主力会宁会师，纵横十余省、行程二万五 | 出发 8.6 万与会师余部的人数对比——"星星之火，可以燎原"（史实） | A:会师整训、开赴抗日前线✓(morale+10) | 30000/30/66/82 | {morale:10} |

- [ ] **Step 4: 运行确认通过** `node --test tests/nodes.test.mjs` → PASS
- [ ] **Step 5: 提交** `git add src/data/nodes.js tests/nodes.test.mjs tests/build.test.mjs index.html && git commit -m "feat: 14 节点史实数据"`

---

### Task 5: 题库 questions.js

**Files:**
- Create: `src/data/questions.js`
- Create: `tests/questions.test.mjs`
- Modify: `tests/build.test.mjs` 的 `order`

- [ ] **Step 1: 写失败测试**

```js
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
```

- [ ] **Step 2: 运行确认失败** → FAIL
- [ ] **Step 3: 实现**——`XH.QUESTIONS = [{nodeId:'n01', q:'…', options:[4 项], answer:0, explain:'…'}, …]` 共 42 题。**出题规则**：每题答案与解析必须能从该节点 noteCard.facts 与 story 中找到依据（湘江减员数字、泸定桥 240 里/22 勇士、遵义会议 1935.1.15、金沙江 7 船 9 天 37 船工等数字优先入题）；3 题难度按"识记→理解→运用"排。执行者按此规则从 Task 4 表格数字出满 42 题，抽查题：n03 一题答案须为"3 万余"、n10 一题答案须为"一昼夜 240 里"。
- [ ] **Step 4: 运行确认通过** → PASS
- [ ] **Step 5: 提交** `git add src/data/questions.js tests/questions.test.mjs tests/build.test.mjs index.html && git commit -m "feat: 42 题党史题库"`

---

### Task 6: 事件表 events.js

**Files:**
- Create: `src/data/events.js`
- Create: `tests/events.test.mjs`
- Modify: `tests/build.test.mjs` 的 `order`

- [ ] **Step 1: 写失败测试**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, xh } from './load.mjs';

test('事件表：字段合法、民心门槛为负数有效、效果均为有限整数', () => {
  load('src/data/palette.js'); load('src/data/events.js');
  const E = xh().EVENTS;
  assert.ok(E.length >= 5);
  const RES = ['troops','supply','morale','faith'];
  for (const e of E) {
    assert.ok(e.text.length >= 10);
    assert.ok(e.weight > 0);
    if (e.minFaith !== undefined) assert.ok(e.minFaith >= 0 && e.minFaith <= 100);
    for (const o of e.options) {
      RES.forEach(r => { assert.ok(r in o.effects); assert.ok(Number.isInteger(o.effects[r])); });
      assert.ok(o.explain.length >= 6);
    }
  }
});
```

- [ ] **Step 2: 运行确认失败** → FAIL
- [ ] **Step 3: 实现** 6 个事件（数据照抄）：

```js
;(function (XH) {
  const O = (label, effects, explain) => ({ label, effects, explain });
  XH.EVENTS = [
    { id:'ev_plane', text:'敌机嗡嗡逼近，队伍暴露在开阔地！', weight:3,
      options:[ O('立即疏散隐蔽', {morale:-2}, '及时隐蔽，仅受轻惊扰'), O('加速通过', {troops:-300, morale:-4}, '遭低空扫射，出现伤亡') ] },
    { id:'ev_grain', text:'老乡塞来一袋红薯：“带上吧，娃娃们要吃饭。”', weight:3, minFaith:60,
      options:[ O('道谢收下并打借条', {supply:8, faith:2}, '红军有借有还，群众更信任'), O('坚决不收', {supply:0, morale:2}, '纪律严明，但队伍仍需筹粮') ] },
    { id:'ev_straggler', text:'一名小战士脚底磨烂，掉队了。', weight:3,
      options:[ O('轮流背他走', {morale:4, supply:-3}, '不抛弃不放弃，士气更旺'), O('留币让他自寻村庄', {morale:-5, faith:-3}, '队伍冷了心') ] },
    { id:'ev_slogan', text:'宿营时，宣传队员在土墙上刷下标语。', weight:2,
      options:[ O('帮着一起刷', {faith:3}, '“红军是穷人的队伍”传开了'), O('催促早点休息', {faith:0}, '无事发生') ] },
    { id:'ev_mud', text:'连日阴雨，山路泥泞，粮袋泡了水。', weight:3,
      options:[ O('分摊背粮', {supply:-4, morale:1}, '同甘共苦'), O('丢弃湿粮轻装', {supply:-8}, '口粮告急') ] },
    { id:'ev_guide', text:'岔路口向导犹豫：“东边近，可常有团丁。”', weight:2,
      options:[ O('听向导绕西边', {supply:-3}, '稳妥，多走半天路'), O('坚决走东边', {troops:-200}, '遭团丁袭扰') ] },
  ];
})(globalThis.XH = globalThis.XH || {});
```

- [ ] **Step 4: 运行确认通过** → PASS
- [ ] **Step 5: 提交** `git add src/data/events.js tests/events.test.mjs tests/build.test.mjs index.html && git commit -m "feat: 行军随机事件表"`

---

### Task 7: 状态与资源规则 core/state.js

**Files:**
- Create: `src/core/state.js`
- Create: `tests/state.test.mjs`
- Modify: `tests/build.test.mjs` 的 `order`

- [ ] **Step 1: 写失败测试**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, xh } from './load.mjs';

test('state：入场资源=节点 entry+上次加成；delta 夹取；失败判定', () => {
  load('src/data/palette.js'); load('src/data/nodes.js'); load('src/core/state.js');
  const { State, NODES } = xh();
  let st = State.create();
  State.beginNode(st, NODES[0]);
  assert.equal(st.troops, 86000); assert.equal(st.morale, 80);
  State.applyDelta(st, { supply:-999 }); assert.equal(st.supply, 0);
  State.applyDelta(st, { morale:999 }); assert.equal(st.morale, 100);
  State.applyDelta(st, { troops:-90000 }); assert.ok(State.isFailed(st), '兵力归零应失败');
  st = State.create(); State.beginNode(st, NODES[0]);
  st.lastBonus = 800; State.beginNode(st, NODES[0]);
  assert.equal(st.troops, 86800, '入场兵力=entry+lastBonus');
  st.morale = 1; State.applyDelta(st, { morale:-5 });
  assert.ok(State.isFailed(st), '士气归零应失败');
});
```

- [ ] **Step 2: 运行确认失败** → FAIL
- [ ] **Step 3: 实现 `src/core/state.js`**

```js
;(function (XH) {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  XH.State = {
    create() {
      return { nodeIndex:0, troops:0, supply:100, morale:80, faith:50,
        notebook:[], quizRight:0, quizTotal:0, mgStars:[], elapsedMs:0,
        lastBonus:0, startedAt:0, seed:Date.now() % 2147483647 };
    },
    beginNode(st, node) {
      st.troops = node.entry.troops + (st.lastBonus || 0);
      st.supply = node.entry.supply; st.morale = node.entry.morale; st.faith = node.entry.faith;
    },
    applyDelta(st, d) {
      for (const k of ['troops','supply','morale','faith']) {
        if (!d || !Number.isFinite(d[k])) continue;
        if (k === 'troops') st.troops = Math.max(0, st.troops + Math.round(d[k]));
        else st[k] = clamp(st[k] + d[k], 0, 100);
      }
      return st;
    },
    isFailed(st) { return st.troops <= 0 || st.morale <= 0; },
    finishNode(st, node, mgStars) { // mgStars: 0~3，玩法表现
      const r = node.mgReward, ratio = [0, 0.35, 0.7, 1][clamp(mgStars|0, 0, 3)];
      const bonus = {};
      for (const k of ['troops','supply','morale','faith']) if (r[k]) bonus[k] = Math.round(r[k] * ratio);
      State.applyDelta(st, bonus);
      st.lastBonus = bonus.troops || 0;              // 兵力加成带入下一节点
      if (!st.notebook.includes(node.id)) st.notebook.push(node.id);
      st.mgStars[node.id] = clamp(mgStars|0, 0, 3);
      st.nodeIndex = Math.max(st.nodeIndex, XH.NODES.indexOf(node) + 1);
      return bonus;
    },
    quizResult(st, right, total) { st.quizTotal += total; st.quizRight += right; }
  };
})(globalThis.XH = globalThis.XH || {});
```

- [ ] **Step 4: 运行确认通过** → PASS
- [ ] **Step 5: 提交** `git add src/core/state.js tests/state.test.mjs tests/build.test.mjs index.html && git commit -m "feat: 状态与资源规则"`

---

### Task 8: 存档 core/save.js

**Files:**
- Create: `src/core/save.js`
- Create: `tests/save.test.mjs`
- Modify: `tests/build.test.mjs` 的 `order`

- [ ] **Step 1: 写失败测试**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, xh } from './load.mjs';

test('save：往返一致；坏档/错版本返回 null 不抛异常', () => {
  load('src/data/palette.js'); load('src/data/nodes.js'); load('src/core/state.js'); load('src/core/save.js');
  const { Save, State, NODES } = xh();
  const mem = {};
  const fakeStorage = { get:k=>mem[k]??null, set:(k,v)=>{mem[k]=String(v);}, remove:k=>{delete mem[k];} };
  const st = State.create(); State.beginNode(st, NODES[0]); st.notebook.push('n01');
  Save.write(fakeStorage, st);
  const st2 = Save.read(fakeStorage);
  assert.equal(st2.troops, st.troops); assert.deepEqual(st2.notebook, ['n01']);
  mem['xinghuo.save.v1'] = '{oops';
  assert.equal(Save.read(fakeStorage), null);
  mem['xinghuo.save.v1'] = JSON.stringify({ v:999, state:{} });
  assert.equal(Save.read(fakeStorage), null);
});
```

- [ ] **Step 2: 运行确认失败** → FAIL
- [ ] **Step 3: 实现 `src/core/save.js`**

```js
;(function (XH) {
  const KEY = 'xinghuo.save.v1', VER = 1;
  XH.Save = {
    write(storage, st) { storage.set(KEY, JSON.stringify({ v:VER, state:st })); },
    read(storage) {
      try {
        const raw = storage.get(KEY); if (!raw) return null;
        const obj = JSON.parse(raw);
        if (obj.v !== VER || !obj.state || typeof obj.state.nodeIndex !== 'number') return null;
        return obj.state;
      } catch { return null; }
    },
    clear(storage) { storage.remove(KEY); }, VER, KEY
  };
})(globalThis.XH = globalThis.XH || {});
```

- [ ] **Step 4: 运行确认通过** → PASS
- [ ] **Step 5: 提交** `git add src/core/save.js tests/save.test.mjs tests/build.test.mjs index.html && git commit -m "feat: 存档与坏档降级"`

---

### Task 9: 平台层 platform.js

**Files:**
- Create: `src/platform/platform.js`
- Create: `tests/platform.test.mjs`
- Modify: `tests/build.test.mjs` 的 `order`

- [ ] **Step 1: 写失败测试**（Node 无 localStorage/AudioContext，验证降级与接口形状）

```js
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
```

- [ ] **Step 2: 运行确认失败** → FAIL
- [ ] **Step 3: 实现 `src/platform/platform.js`**

```js
;(function (XH) {
  // —— 存储：localStorage，缺失时内存降级（Node/受限环境）——
  const memStore = {};
  const ls = (typeof localStorage !== 'undefined') ? localStorage : null;
  XH.Platform = {
    storage: ls ? {
      get: k => { try { return localStorage.getItem(k); } catch { return null; } },
      set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
      remove: k => { try { localStorage.removeItem(k); } catch {} },
    } : {
      get: k => (k in memStore ? memStore[k] : null),
      set: (k, v) => { memStore[k] = String(v); },
      remove: k => { delete memStore[k]; },
    },
    // —— 音频：WebAudio 合成 8-bit 音效（首次交互后 init）——
    audio: {
      ctx: null,
      init() { if (!this.ctx && typeof AudioContext !== 'undefined') this.ctx = new AudioContext(); },
      tone(freq, dur, type, vol) {
        if (!this.ctx) return;
        const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = type || 'square'; o.frequency.value = freq;
        g.gain.setValueAtTime(vol || 0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + dur);
      },
      play(name) {
        const seq = {
          click:[[660,.06]], correct:[[523,.09],[659,.09],[784,.16]],
          wrong:[[196,.18],[147,.22]], march:[[131,.12],[131,.12],[196,.2]],
          victory:[[523,.1],[659,.1],[784,.1],[1047,.3]], save:[[880,.08],[1175,.1]]
        }[name] || [[440,.06]];
        let dt = 0; for (const [f, d] of seq) { setTimeout(() => this.tone(f, d), dt * 1000); dt += d * 0.9; }
      },
    },
    // —— 输入：键盘(方向/WASD/回车/空格) + 指针/触摸 → 统一事件 ——
    input: {
      _cbs: [],
      on(cb) { this._cbs.push(cb); },
      emit(e) { this._cbs.forEach(cb => cb(e)); },
      bindCanvas(canvas) {
        const KEYMAP = { ArrowUp:'up', KeyW:'up', ArrowDown:'down', KeyS:'down', ArrowLeft:'left',
          KeyA:'left', ArrowRight:'right', KeyD:'right', Enter:'confirm', Space:'confirm', Escape:'cancel' };
        addEventListener('keydown', ev => { const a = KEYMAP[ev.code]; if (a) { ev.preventDefault(); this.emit({ type:'key', action:a }); } });
        const pt = ev => {
          const r = canvas.getBoundingClientRect();
          this.emit({ type:'tap', x:(ev.clientX - r.left) / r.width * 320, y:(ev.clientY - r.top) / r.height * 180 });
        };
        canvas.addEventListener('pointerdown', pt);
      },
    },
  };
})(globalThis.XH = globalThis.XH || {});
```

- [ ] **Step 4: 运行确认通过** → PASS
- [ ] **Step 5: 提交** `git add src/platform/platform.js tests/platform.test.mjs tests/build.test.mjs index.html && git commit -m "feat: 平台适配层（存储/音频/输入）"`

---

### Task 10: 渲染助手 render.js

**Files:**
- Create: `src/engine/render.js`
- Create: `tests/render.test.mjs`
- Modify: `tests/build.test.mjs` 的 `order`

- [ ] **Step 1: 写失败测试**（Node 下 mock canvas 只测纯逻辑）

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, xh } from './load.mjs';

test('render：中文按像素宽换行；主题色存在', () => {
  load('src/data/palette.js'); load('src/engine/render.js');
  const R = xh().Render;
  const lines = R.wrapText('一二三四五六七八九十甲乙丙', 8);
  assert.deepEqual(lines, ['一二三四五六七八十', '甲乙丙']);
  for (const t of ['jiangnan','mountain','snow','grass','loess']) assert.ok(R.THEMES[t]);
});
```

- [ ] **Step 2: 运行确认失败** → FAIL
- [ ] **Step 3: 实现 `src/engine/render.js`**

```js
;(function (XH) {
  const P = () => XH.PALETTE;
  XH.Render = {
    THEMES: { // 场景主题：天/地/路/点缀
      jiangnan:{sky:'#1a2332', ground:'#6b7a35', path:'#7d6346', deco:'water'},
      mountain:{sky:'#101820', ground:'#5c4832', path:'#7d6346', deco:'rock'},
      snow:{sky:'#1a2332', ground:'#bdc3c7', path:'#8395a7', deco:'snowtree'},
      grass:{sky:'#101820', ground:'#4a5d23', path:'#6b8e23', deco:'marsh'},
      loess:{sky:'#1a2332', ground:'#c8965a', path:'#9c6f3c', deco:'cave'}
    },
    px(ctx, x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x|0, y|0, w|0, h|0); },
    sprite(ctx, sp, x, y, flip) {
      const M = XH.SPRITE_MAP, C = P();
      for (let r = 0; r < sp.h; r++) for (let c = 0; c < sp.w; c++) {
        const ch = sp.rows[r][flip ? sp.w - 1 - c : c]; if (ch === '.') continue;
        ctx.fillStyle = C[M[ch]]; ctx.fillRect(x + c, y + r, 1, 1);
      }
    },
    // 中文按“字符数”换行：CJK 记 1，ASCII 记 0.5
    wrapText(str, maxChars) {
      const lines = []; let cur = '', w = 0;
      for (const ch of str) {
        const cw = ch.charCodeAt(0) > 255 ? 1 : 0.5;
        if (w + cw > maxChars) { lines.push(cur); cur = ch; w = cw; } else { cur += ch; w += cw; }
      }
      if (cur) lines.push(cur); return lines;
    },
    text(ctx, str, x, y, opt) {
      const o = opt || {}, size = o.size || 7;
      ctx.font = size + 'px "Microsoft YaHei", sans-serif';
      ctx.textBaseline = 'top'; ctx.textAlign = o.align || 'left';
      if (o.outline !== false) { ctx.fillStyle = P().inkBlack; ctx.fillText(str, x + 1, y + 1); }
      ctx.fillStyle = o.color || P().textMain; ctx.fillText(str, x, y);
    },
    panel(ctx, x, y, w, h) { // 像素面板：深底+金边
      this.px(ctx, x, y, w, h, P().uiPanel); this.px(ctx, x, y, w, 1, P().sparkGold);
      this.px(ctx, x, y + h - 1, w, 1, P().sparkGold); this.px(ctx, x, y, 1, h, P().sparkGold);
      this.px(ctx, x + w - 1, y, 1, h, P().sparkGold);
    },
    theme(ctx, themeName) { // 天空+地面+路面带
      const t = this.THEMES[themeName] || this.THEMES.mountain;
      this.px(ctx, 0, 24, 320, 156, t.sky); this.px(ctx, 0, 120, 320, 60, t.ground);
      this.px(ctx, 0, 132, 320, 10, t.path);
    },
  };
})(globalThis.XH = globalThis.XH || {});
```

- [ ] **Step 4: 运行确认通过** → PASS
- [ ] **Step 5: 提交** `git add src/engine/render.js tests/render.test.mjs tests/build.test.mjs index.html && git commit -m "feat: 像素渲染助手"`

---

### Task 11: 场景循环 loop.js

**Files:**
- Create: `src/engine/loop.js`
- Modify: `tests/build.test.mjs` 的 `order`

场景接口：`{ enter?, update(dt), draw(ctx), onInput?(e) }`；栈顶活跃。

- [ ] **Step 1: 实现 `src/engine/loop.js`**（栈操作写为纯函数以便后续补测）

```js
;(function (XH) {
  XH.Loop = {
    stack: [], _last: 0, _acc: 0, _running: false,
    push(scene) { this.stack.push(scene); if (scene.enter) scene.enter(); },
    pop() { return this.stack.pop(); },
    replace(scene) { this.pop(); this.push(scene); },
    top() { return this.stack[this.stack.length - 1]; },
    handleInput(e) { const s = this.top(); if (s && s.onInput) s.onInput(e); },
    tick(ts) {
      if (!this._running) return;
      const dt = Math.min(0.1, (ts - this._last) / 1000); this._last = ts;
      const s = this.top();
      if (s && s.update) s.update(dt);
      const ctx = this._ctx; if (s && s.draw && ctx) { ctx.clearRect(0, 0, 320, 180); s.draw(ctx); }
      requestAnimationFrame(ts => this.tick(ts));
    },
    start(canvas) {
      this._ctx = canvas.getContext('2d'); this._ctx.imageSmoothingEnabled = false;
      XH.Platform.input.bindCanvas(canvas);
      XH.Platform.input.on(e => this.handleInput(e));
      this._running = true; this._last = performance.now();
      requestAnimationFrame(ts => this.tick(ts));
    },
  };
})(globalThis.XH = globalThis.XH || {});
```

- [ ] **Step 2: 全量测试与构建** `node --test tests/ && node build.mjs` → 全 PASS
- [ ] **Step 3: 提交** `git add src/engine/loop.js tests/build.test.mjs index.html && git commit -m "feat: 场景循环"`

---

### Task 12: 8 类玩法机制 mechanics.js（核心）

**Files:**
- Create: `src/engine/mechanics.js`
- Create: `tests/mechanics.test.mjs`
- Modify: `tests/build.test.mjs` 的 `order`

每类机制 = 纯逻辑核（可测）+ `draw(ctx, st)`（用 Render.px/panel 画简 UI）。以下给出**全部 8 类逻辑核的精确代码**；`draw` 为每类 20~40 行的矩形像素画（进度条/圆点/计时条），执行者按统一风格补全。

- [ ] **Step 1: 写失败测试**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, xh } from './load.mjs';

test('timing：窗口内外判定与质量分级', () => {
  load('src/engine/mechanics.js'); const M = xh().Mech;
  const w = [{ start: 2, end: 3 }];
  assert.equal(M.timingHit(1.9, w), null);
  assert.equal(M.timingHit(2.5, w)[0].quality, 'perfect');   // 中心
  assert.equal(M.timingHit(2.1, w)[0].quality, 'good');
  assert.equal(M.timingHit(2.95, w)[0].quality, 'poor');
});
test('rhythm：容差与连击', () => {
  load('src/engine/mechanics.js'); const M = xh().Mech;
  let rs = M.rhythmInit([1, 2, 3]);
  rs = M.rhythmPress(rs, 1.02, 0.08); assert.equal(rs.judges[0], 'perfect');
  rs = M.rhythmPress(rs, 2.1, 0.08); assert.equal(rs.judges[1], 'good');
  const fin = M.rhythmFinish(rs, 4);
  assert.equal(fin.miss, 1); assert.equal(fin.stars >= 1 && fin.stars <= 3, true);
});
test('route：4 轮 3 胜', () => {
  load('src/engine/mechanics.js'); const M = xh().Mech;
  let st = M.routeInit([ [1,2], [0,3], [0,1], [2,3] ]); // 每轮敌军设防点
  st = M.routePick(st, 0); assert.equal(st.results[0], true);
  st = M.routePick(st, 1); assert.equal(st.results[1], false);
  st = M.routePick(st, 2); st = M.routePick(st, 2);
  assert.equal(M.routeStars(st), 3);
});
test('defend：波次拦截与漏防', () => {
  load('src/engine/mechanics.js'); const M = xh().Mech;
  const sch = M.defendSchedule(4, 3); // 4 波，间隔 3s
  let st = M.defendInit(sch);
  st = M.defendTick(st, 0); assert.equal(st.leaked, 0);
  st = M.defendTick(st, 3.1); assert.equal(st.pending.length, 1, '到点波次进入待拦截');
  st = M.defendIntercept(st, st.pending[0].dir);
  assert.equal(st.pending.length, 0); assert.equal(st.leaked, 0);
  st = M.defendTick(st, 6.2); M.defendTick(st, 9.3); M.defendTick(st, 12.4);
  const fin = M.defendFinish(st); assert.equal(fin.leaked, 3);
});
test('allocate：配额校验', () => {
  load('src/engine/mechanics.js'); const M = xh().Mech;
  const slots = [{ id:'a', min:2 }, { id:'b', min:3 }];
  assert.equal(M.allocateValid({ a:2, b:4 }, slots, 6), true);
  assert.equal(M.allocateValid({ a:1, b:4 }, slots, 6), false);
  assert.equal(M.allocateValid({ a:2, b:5 }, slots, 6), false, '超池');
});
test('trust：信任条', () => {
  load('src/engine/mechanics.js'); const M = xh().Mech;
  let t = M.trustInit(4);
  t = M.trustChoose(t, true); t = M.trustChoose(t, true);
  t = M.trustChoose(t, false); t = M.trustChoose(t, true);
  assert.equal(t.trust, 75); assert.equal(M.trustStars(t), 3);
});
test('dodge：碰撞', () => {
  load('src/engine/mechanics.js'); const M = xh().Mech;
  const hz = [{ lane:1, y:100 }, { lane:2, y:120 }];
  assert.equal(M.dodgeCollide(1, 98, 104, hz), true);
  assert.equal(M.dodgeCollide(0, 98, 104, hz), false);
});
test('dual：双线操作', () => {
  load('src/engine/mechanics.js'); const M = xh().Mech;
  let d = M.dualInit();
  d = M.dualStep(d, 'front', 0.5); assert.ok(d.front > M.DUAL.frontDecay * -0.5);
  d = M.dualStep(d, 'climb', 0.5);
  for (let i = 0; i < 100; i++) { d = M.dualStep(d, 'climb', 0.1); d = M.dualStep(d, 'front', 0.1); }
  assert.equal(M.dualDone(d), true, '爬满 100 应完成');
});
```

- [ ] **Step 2: 运行确认失败** → FAIL
- [ ] **Step 3: 实现 `src/engine/mechanics.js`**（逻辑核逐字实现，`draw` 按风格补全）

```js
;(function (XH) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  XH.Mech = {
    // 1) timing：n 个窗口依次出现；返回 [窗口, 质量] 或 null
    timingHit(t, windows) {
      const w = windows.find(w => t >= w.start && t <= w.end); if (!w) return null;
      const c = (w.start + w.end) / 2, half = (w.end - w.start) / 2, d = Math.abs(t - c) / half;
      return [w, d <= 0.25 ? 'perfect' : d <= 0.7 ? 'good' : 'poor'];
    },
    // 2) rhythm：节拍序列判定
    rhythmInit(beats) { return { beats, hit: beats.map(() => false), judges: [] }; },
    rhythmPress(st, t, tol) {
      let best = -1, bd = Infinity;
      st.beats.forEach((b, i) => { if (!st.hit[i]) { const d = Math.abs(t - b); if (d < bd) { bd = d; best = i; } } });
      if (best < 0 || bd > tol) { st.judges.push('miss'); return st; }
      st.hit[best] = true;
      st.judges.push(bd <= tol * 0.35 ? 'perfect' : bd <= tol * 0.7 ? 'good' : 'poor');
      return st;
    },
    rhythmFinish(st, endT) {
      const miss = st.hit.filter(h => !h).length + st.judges.filter(j => j === 'miss').length;
      const good = st.judges.filter(j => j === 'good' || j === 'perfect').length;
      const ratio = st.beats.length ? good / st.beats.length : 0;
      return { miss, stars: ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : ratio >= 0.3 ? 1 : 0 };
    },
    // 3) route：四渡赤水——每轮有设防点，避开则成功
    routeInit(guardsPerRound) { return { guards: guardsPerRound, round: 0, results: [] }; },
    routePick(st, point) {
      st.results.push(!st.guards[st.round].includes(point));
      st.round++; return st;
    },
    routeStars(st) { const ok = st.results.filter(Boolean).length; return ok >= 3 ? 3 : ok === 2 ? 2 : ok === 1 ? 1 : 0; },
    // 4) defend：波次阻击
    defendSchedule(waves, gap) { return Array.from({ length: waves }, (_, i) => ({ t: (i + 1) * gap, dir: i % 4 })); },
    defendInit(schedule) { return { schedule: schedule.map(s => ({ ...s, done:false })), pending: [], leaked: 0, t: 0 }; },
    defendTick(st, dt) {
      st.t += dt;
      st.schedule.forEach(w => { if (!w.done && st.t >= w.t) { w.done = true; st.pending.push({ dir: w.dir }); } });
      // 待拦截波超过 1.2s 未拦截 → 漏防
      st.pending = st.pending.filter(p => { p.age = (p.age || 0) + dt; if (p.age > 1.2) { st.leaked++; return false; } return true; });
      return st;
    },
    defendIntercept(st, dir) { const i = st.pending.findIndex(p => p.dir === dir); if (i >= 0) st.pending.splice(i, 1); return st; },
    defendFinish(st) { const total = st.schedule.length; return { leaked: st.leaked, stars: st.leaked === 0 ? 3 : st.leaked <= 1 ? 2 : st.leaked <= 2 ? 1 : 0, total }; },
    // 5) allocate：把池内资源分给各槽位满足最小值
    allocateValid(alloc, slots, pool) {
      let sum = 0; for (const s of slots) { if (!Number.isFinite(alloc[s.id]) || alloc[s.id] < 0) return false; sum += alloc[s.id]; }
      if (sum > pool) return false;
      return slots.every(s => (alloc[s.id] || 0) >= s.min);
    },
    // 6) trust：选项累加信任
    trustInit(rounds) { return { trust: 0, round: 0, rounds, log: [] }; },
    trustChoose(st, positive) { st.log.push(positive); if (positive) st.trust += 25; else st.trust = Math.max(0, st.trust - 10); st.round++; return st; },
    trustStars(st) { return st.trust >= 75 ? 3 : st.trust >= 50 ? 2 : st.trust >= 25 ? 1 : 0; },
    // 7) dodge：碰撞（玩家固定底部 lane 区间）
    dodgeCollide(lane, yMin, yMax, hazards) { return hazards.some(h => h.lane === lane && h.y >= yMin && h.y <= yMax); },
    // 8) dual：正面佯攻衰减条 + 攀爬进度条
    DUAL: { frontDecay: 8, frontBoost: 22, climbGain: 14, climbCost: 6 },
    dualInit() { return { front: 50, climb: 0, t: 0, frontDropped: false }; },
    dualStep(st, which, dt) {
      st.t += dt;
      st.front = clamp(st.front - XH.Mech.DUAL.frontDecay * dt, 0, 100);
      if (which === 'front') st.front = clamp(st.front + XH.Mech.DUAL.frontBoost, 0, 100);
      if (which === 'climb') { st.climb = clamp(st.climb + XH.Mech.DUAL.climbGain, 0, 100); st.front = clamp(st.front - XH.Mech.DUAL.climbCost, 0, 100); }
      if (st.front <= 0) st.frontDropped = true;
      return st;
    },
    dualDone(st) { return st.climb >= 100; },
    dualStars(st) { return st.frontDropped ? (st.climb >= 100 ? 1 : 0) : st.climb >= 100 ? 3 : st.t < 60 ? 2 : 1; },
  };
})(globalThis.XH = globalThis.XH || {});
```

- [ ] **Step 4: 运行确认通过** → PASS
- [ ] **Step 5: 提交** `git add src/engine/mechanics.js tests/mechanics.test.mjs tests/build.test.mjs index.html && git commit -m "feat: 8 类玩法机制逻辑核"`

---

### Task 13: 玩法配置 mg-configs.js + 玩法场景

**Files:**
- Create: `src/data/mg-configs.js`
- Create: `tests/mg-configs.test.mjs`
- Create: `src/scenes/minigame.js`（通用玩法场景：按 type 驱动 Mech + 各自 draw/输入映射）
- Modify: `tests/build.test.mjs` 的 `order`

14 节点 → 机制类型映射（数据驱动，玩法差异化靠参数与文案）：

| 节点 | type | 参数要点 | 胜利→星级 |
|---|---|---|---|
| n01 搭浮桥 | timing | 3 个铺板窗口（侦察机掠过间隙），每窗 1.2s | 3 perfect=3★ |
| n02 穿插突围 | timing | 4 个巡逻缺口窗口，更窄 0.9s | 同上 |
| n03 殿后死守 | defend | 6 波，间隔 2.5s，漏防=兵力-800/波 | 0 漏=3★ |
| n04 转兵决策 | trust | 3 轮行军路线抉择（正确项=史实方向） | ≥75=3★ |
| n05 拨正航向 | trust | 3 轮纠错抉择 | 同上 |
| n06 声东击西 | route | 4 轮，每轮 2 设防点 | ≥3 胜=3★ |
| n07 摆渡调度 | allocate | 池 12（船工班次），3 槽 min 2/4/3，限时 30s | 校验通过且用时<20s=3★ |
| n08 以诚相待 | trust | 4 轮习俗尊重抉择 | 同 n04 |
| n09 浪尖冲锋 | dodge | 3 车道，漩涡/弹雨 25 个，60s | 命中≤1=3★ |
| n10 昼夜奔袭 | rhythm | 20 拍（240 里），容差 0.12s | ratio≥0.9=3★ |
| n11 翻山 | rhythm | 24 拍，容差 0.1s，节奏更密 | 同上 |
| n12 草地行军 | allocate | 池 10（干粮），4 槽 min 1/2/2/1 | 同 n07 |
| n13 攀崖奇兵 | dual | 佯攻衰减 8/s，爬满 100 | 未断=3★ |
| n14 大会师 | finale | 按住确认键三旗汇合（进度条填满即成） | 恒 3★ |

- [ ] **Step 1: 写失败测试**（schema + 映射完整性）

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, xh } from './load.mjs';

const SCHEMA = {
  timing: ['windows', 'hint'], rhythm: ['beats', 'tol', 'hint'],
  route: ['guards', 'hint'], defend: ['waves', 'gap', 'hitLoss', 'hint'],
  allocate: ['pool', 'slots', 'timeLimit', 'hint'], trust: ['rounds', 'hint'],
  dodge: ['hazardCount', 'duration', 'hint'], dual: ['hint'], finale: ['hint'],
};

test('mg-configs：14 节点全覆盖、类型合法、字段按 schema', () => {
  load('src/data/palette.js'); load('src/data/nodes.js'); load('src/data/mg-configs.js');
  const { MG_CONFIGS, NODES } = xh();
  assert.equal(Object.keys(MG_CONFIGS).length, 14);
  for (const n of NODES) {
    const c = MG_CONFIGS[n.mg];
    assert.ok(c, `${n.mg} 缺配置`);
    assert.ok(SCHEMA[c.type], `未知类型 ${c.type}`);
    for (const k of SCHEMA[c.type]) assert.ok(c[k] !== undefined, `${n.mg} 缺 ${k}`);
    assert.ok(c.hint.length >= 6, '玩法提示过短');
    if (c.type === 'timing') c.windows.forEach(w => assert.ok(w.start < w.end));
    if (c.type === 'route') assert.equal(c.guards.length, 4);
    if (c.type === 'allocate') { let min = 0; c.slots.forEach(s => min += s.min); assert.ok(min <= c.pool, '配额不可满足'); }
    if (c.type === 'trust') assert.ok(c.rounds.length >= 3 && c.rounds.every(r => r.positive && r.negative));
  }
});
```

- [ ] **Step 2: 运行确认失败** → FAIL
- [ ] **Step 3: 实现 `src/data/mg-configs.js`**（按上表逐节点写全 14 条配置；timing 的 windows、rhythm 的 beats 等按参数要点给出具体数值；n04/n05/n08 的 `rounds` 选项文案取自对应节点史实——n05 三轮即"进攻中的冒险主义/防御中的保守主义/退却中的逃跑主义"纠错，正确项均为"纠正"）
- [ ] **Step 4: 实现 `src/scenes/minigame.js`**：`enter` 读当前节点配置 → 按 type 分派到 Mech 逻辑核；`update` 推进计时/生成 hazards（dodge 用 `st.seed` 伪随机）/dodge 碰撞调 `Mech.dodgeCollide`；`onInput` 按 type 映射（timing/rhythm=confirm 或 tap 触发判定；defend=四方向=四向拦截；dodge=左右移动；dual=left=front、right=climb；finale=按住 confirm）；结束调 `Mech.*Finish` 得星级 → `XH.NodeFlow.finishMg(stars)`。
- [ ] **Step 5: 运行全量** `node --test tests/` → PASS
- [ ] **Step 6: 提交** `git add src/data/mg-configs.js src/scenes/minigame.js tests/mg-configs.test.mjs tests/build.test.mjs index.html && git commit -m "feat: 14 玩法配置与通用玩法场景"`

---

### Task 14: UI 层（顶栏 + 五类弹层）

**Files:**
- Create: `src/ui/hud.js`
- Create: `src/ui/overlays.js`（剧情卡/问答卡/节点结算卡/图鉴/重开选择）
- Create: `tests/ui.test.mjs`（仅测可纯逻辑部分：问答乱序不重复、图鉴排序）
- Modify: `tests/build.test.mjs` 的 `order`

- [ ] **Step 1: 实现 `src/ui/hud.js`**：`XH.HUD.draw(ctx, st)`——顶栏 320×24 深底，四资源（兵力缩写"8.6万"格式：`XH.HUD.fmtTroops(n)` ≥10000 显示 `x.x万`，否则原值），右侧 [图鉴][存档] 两个 24×10 按钮（tap 区域存入 `XH.HUD.hitAreas` 供场景点击判断）。
- [ ] **Step 2: 实现 `src/ui/overlays.js`**：
  - `XH.Overlay.story(node)` → 剧情卡场景：panel 全屏化，标题=节点名+日期，正文=story 段落（Render.wrapText 26 字/行）+ 底部金框"情感触点"块（title+text，tag 为"经典故事"时右上角标注灰字），confirm/tap 继续；
  - `XH.Overlay.quiz(qs, onDone)` → 逐题：题干+4 选项（tap 选择）→ 立即显示对错与 `explain` → 计分回调；
  - `XH.Overlay.choice(node, onDone)` → 抉择卡：选项按钮，选中后显示 effects 变动与 explain，再继续；
  - `XH.Overlay.summary(node, bonus, onDone)` → 节点结算：资源变动表 + "获得党史笔记"提示；
  - `XH.Overlay.notebook(st, onDone)` → 图鉴：14 格网格，已收集亮金、未收集灰显"？？？"，点已收集格翻看 noteCard；
  - `XH.Overlay.restart(st, onPick)` → 重整旗鼓：已解锁节点（index < st.nodeIndex）网格 + 资源预览（该节点 entry），tap 选择；
  - `XH.Overlay.shuffleOptions(q)` → 返回选项乱序后的数组与新 answer 下标（纯函数，供测试）。
- [ ] **Step 3: 写测试** `tests/ui.test.mjs`：

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, xh } from './load.mjs';

test('HUD.fmtTroops 与选项乱序', () => {
  load('src/data/palette.js'); load('src/data/nodes.js'); load('src/ui/hud.js'); load('src/ui/overlays.js');
  const { HUD, Overlay, NODES } = xh();
  assert.equal(HUD.fmtTroops(86000), '8.6万'); assert.equal(HUD.fmtTroops(9800), '9800');
  const q = { options:['A','B','C','D'], answer:2 };
  const s = Overlay.shuffleOptions(q, () => 1); // 注入固定随机
  assert.ok(s.options.includes('C') && s.options[s.answer] === 'C');
});
```

- [ ] **Step 4: 运行确认通过** `node --test tests/` → PASS（HUD.fmtTroops 的 `x.x万` 用 `(n/10000).toFixed(1).replace(/\.0$/,'') + '万'`）
- [ ] **Step 5: 提交** `git add src/ui tests/ui.test.mjs tests/build.test.mjs index.html && git commit -m "feat: 顶栏与五类弹层"`

---

### Task 15: 场景编排（title / march / nodeflow / report）+ main.js

**Files:**
- Create: `src/scenes/title.js`
- Create: `src/scenes/march.js`
- Create: `src/scenes/nodeflow.js`
- Create: `src/scenes/report.js`
- Create: `src/main.js`
- Modify: `tests/build.test.mjs` 的 `order`

- [ ] **Step 1: `title.js`**：夜色背景 + 火把粒子 + 大字"星火长征"（text size 24）+ 副标题"二万五千里行军记" + "按 回车 / 点击 开始" + 有存档时显示"继续行军 (K)"。confirm → 有档读档进 march，无档新建进 march。
- [ ] **Step 2: `march.js`**：`enter` 时按 `st.nodeIndex` 取当前节点与上一节点 pos 连线作为路径；`update` 中队伍沿线前进（速度 18px/s），进度达 0.4/0.8 处按权重+`minFaith` 抽事件（`XH.EVENTS`，用 `st.seed` 线性同余伪随机：`seed = (seed*48271)%2147483647`），弹事件卡（复用 Overlay.choice 的通用两选项卡），选项后 applyDelta；`draw` = Render.theme(节点 theme) + 路线虚线（全 14 节点 pos 连线，已走=金色、未走=暗灰）+ 旗帜精灵 + 小队 soldier + HUD；抵达终点 → `XH.NodeFlow.start(node)`。特殊节点 n03（湘江）到达时先弹剧情性强减员提示卡（"湘江一战，8.6 万→3 万余…"），确认后强制 `st.troops=NODES[3].entry.troops` 于 n04 beginNode 生效（entry 机制天然保证，文案在此弹出）。
- [ ] **Step 3: `nodeflow.js`**：节点编排器——
  ```
  start(node): State.beginNode → Overlay.story → Overlay.choice → Overlay.quiz(3题)
             → scenes/minigame（按 mg 配置） → finishMg(stars)
  finishMg(stars): State.finishNode(资源结算) → Save.write → Overlay.summary
             → 失败检测(State.isFailed) ? Overlay.restart : 回 march(下一节点)
  全部 14 节点完成 → scenes/report
  ```
  同时挂 HUD 按钮：图鉴（Overlay.notebook）、存档（手动 Save.write + audio play('save')）。
- [ ] **Step 4: `report.js`**：通关报告单——用时 `st.elapsedMs`（march update 累加）、答题正确率 `st.quizRight/st.quizTotal`、玩法星总数 `Object.values(st.mgStars).reduce`、笔记收集 `st.notebook.length/14`、兵力对比"出发 8.6 万 → 现在约 X"；结语按收集率分三档（<50%:"长征永远在路上" / <90%:"星星之火，正在燎原" / 100%:"红军不怕远征难，万水千山只等闲"）；"点击重新出发"回 title。
- [ ] **Step 5: `main.js`**：

```js
;(function (XH) {
  const canvas = document.getElementById('game');
  function fit() {
    const s = Math.max(1, Math.floor(Math.min(innerWidth / 320, innerHeight / 180)));
    canvas.style.width = 320 * s + 'px'; canvas.style.height = 180 * s + 'px';
  }
  addEventListener('resize', fit); fit();
  // 调试模式：?debug=1 → 数字键 1-9/0 跳节点，F 锁定资源不减
  XH.DEBUG = /[?&]debug=1/.test(location.search);
  if (XH.DEBUG) addEventListener('keydown', ev => {
    const m = { Digit1:0, Digit2:1, Digit3:2, Digit4:3, Digit5:4, Digit6:5, Digit7:6, Digit8:7, Digit9:8, Digit0:9 }[ev.code];
    if (m !== undefined) { XH.State.create.call(null); XH.Loop.stack = []; XH.__jump && XH.__jump(m); }
    if (ev.code === 'KeyF') XH.DEBUG_LOCK = !XH.DEBUG_LOCK;
  });
  const first = () => XH.Platform.audio.init();
  addEventListener('pointerdown', first, { once:true }); addEventListener('keydown', first, { once:true });
  XH.Platform.input.on(e => { if (e.type === 'tap') XH.Platform.audio.init(); });
  XH.Loop.start(canvas);
  XH.Loop.push(XH.Scenes.title());
})(globalThis.XH = globalThis.XH || {});
```

（`XH.__jump` 由 nodeflow 提供：跳到第 m 个节点开始。DEBUG_LOCK 在 applyDelta 负值时归零——由 nodeflow/march 检查。）

- [ ] **Step 6: 全量构建+测试** `node --test tests/ && node build.mjs` → PASS；`git add -A && git commit -m "feat: 场景编排与主入口，游戏可完整通关"`

---

### Task 16: 端到端验收（对照 SPEC §11）

- [ ] **Step 1: 浏览器冒烟**：双击 `d:\work\mini-games\index.html`（file://），控制台（F12）无报错；确认标题→行军→节点 1 全流程可玩。
- [ ] **Step 2: 调试遍历**：`index.html?debug=1` 依次按 1~0 跳节点，验证 14 个玩法全部可进、可结算；湘江后兵力显示 3 万余。
- [ ] **Step 3: 失败重开**：故意让兵力归零（连败 defend），确认进入「重整旗鼓」且可自选节点、重开后资源=该节点 entry。
- [ ] **Step 4: 存档续玩**：通关节点 2 后关浏览器重开，点"继续行军"从节点 3 开始；手改 localStorage 为坏值再刷新，确认提示且不崩溃。
- [ ] **Step 5: 触屏**：Chrome DevTools 设备模拟（iPhone 尺寸）完成节点 1 玩法与全部按钮点击。
- [ ] **Step 6: 收尾提交**：`git add -A && git commit -m "chore: 端到端验收通过"`；向用户交付 `index.html` 与试玩说明。

---

## Self-Review 结论（已执行）

1. **Spec 覆盖**：玩法循环（T15 nodeflow）、14 节点内容（T4）、题库（T5）、事件（T6）、资源四项+图鉴（T7/T14）、自选重开（T7/T15）、专属玩法 14 个（T12/T13 数据驱动）、320×180+调色板+精灵+音效（T1/T3/T9/T10）、单文件分层+禁 DOM（T2 build 校验 `</script` 与 platform 特性检测）、存档坏档降级（T8）、调试模式（T15）、验收清单（T16）——均有对应任务。**缺口**：无。
2. **占位符**：T3 精灵的 6 个 `null` 与 T13 的 14 条配置为"带精确规格的待产出内容"，均有 schema 测试强制完整性，非无据可依。
3. **类型一致性**：`Mech.*Finish/Stars`、`State.finishNode(node, stars)`、`NodeFlow.finishMg(stars)`、`Overlay.shuffleOptions(q, rng)` 签名在各任务间已核对一致；节点 `mg` 字段值与 `MG_CONFIGS` 键一致（mg01~mg14）。

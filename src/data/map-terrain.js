;(function (XH) {
  // 像素地形层（march 底图）：河流折线 / 雪山符号 / 草地沼泽 / 省名标注
  // 画在 theme 之后、行军路线之前，坐标与 NODES.pos 同一 320×180 逻辑坐标系
  const RIVERS = [
    { name: '湘江',   pts: [[236,96], [231,116], [227,136], [222,156], [218,174]] },
    { name: '乌江',   pts: [[206,120], [202,136], [197,152], [192,168]] },
    { name: '赤水',   pts: [[185,128], [177,140], [169,150], [159,140], [153,154]] },  // 迂回河曲呼应四渡
    { name: '金沙江', pts: [[149,100], [141,120], [133,140], [123,158], [113,174]] },
    { name: '大渡河', pts: [[109,70], [105,86], [101,102], [97,120], [93,140]] },
  ];
  const PEAKS = [[80,58], [94,60], [76,66], [100,68], [70,60]];      // 夹金山一带雪峰顶点
  const MARSH = { x: 54, y: 36, w: 32, h: 17 };                       // 松潘草地
  const PROVINCES = [['江西', 268, 132], ['湖南', 239, 114], ['贵州', 197, 160],
    ['云南', 142, 166], ['四川', 101, 74], ['西康', 74, 92], ['甘肃', 125, 38]];
  const BLUE = '#3d6b9e', SNOW_TOP = '#e8edf2', SNOW_BODY = '#9aa7b5';

  XH.drawTerrain = (ctx) => {
    const R = XH.Render, C = XH.PALETTE;
    // 草地：暗绿块 + 沼泽斑驳点
    R.px(ctx, MARSH.x, MARSH.y, MARSH.w, MARSH.h, '#3b4d22');
    for (let i = 0; i < 14; i++) {
      const mx = MARSH.x + (i * 7 + 3) % MARSH.w, my = MARSH.y + (i * 5 + 2) % (MARSH.h - 2);
      R.px(ctx, mx, my, 2, 1, i % 2 ? '#55693a' : '#2a3a18');
    }
    // 河流：2px 折线（步进插值）
    for (const rv of RIVERS) {
      for (let i = 1; i < rv.pts.length; i++) {
        const a = rv.pts[i - 1], b = rv.pts[i];
        const dx = b[0] - a[0], dy = b[1] - a[1], n = Math.max(1, Math.max(Math.abs(dx), Math.abs(dy)));
        for (let s = 0; s <= n; s++)
          R.px(ctx, Math.round(a[0] + dx * s / n), Math.round(a[1] + dy * s / n), 2, 2, BLUE);
      }
    }
    // 雪峰：^ 形小三角（白雪顶 + 灰山体）
    for (const [x, y] of PEAKS) {
      R.px(ctx, x + 2, y, 1, 1, SNOW_TOP);
      R.px(ctx, x + 1, y + 1, 3, 1, SNOW_BODY);
      R.px(ctx, x, y + 2, 5, 1, SNOW_BODY);
    }
    // 省名：暗色小字
    for (const [name, x, y] of PROVINCES) R.text(ctx, name, x, y, { size: 7, color: C.textDim });
  };
})(globalThis.XH = globalThis.XH || {});

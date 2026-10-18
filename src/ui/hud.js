;(function (XH) {
  // 顶栏 HUD：320×24 资源条 + 图鉴/存档按钮（热区写入 XH.HUD.areas 供 march 场景判定 tap）
  const R = () => XH.Render, P = () => XH.PALETTE;
  XH.HUD = {
    areas: [],
    // 兵力缩写：≥1万 → x.x万（去尾零），否则原数
    fmtTroops(n) {
      if (n >= 10000) return (Math.round(n / 1000) / 10).toFixed(1).replace(/\.0$/, '') + '万';
      return String(n);
    },
    draw(ctx, st) {
      const C = P(), s = st || {};
      R().px(ctx, 0, 0, 320, 24, C.uiPanel);                 // 顶栏底
      R().px(ctx, 0, 23, 320, 1, C.sparkGold);               // 1px 金色下边线
      const flash = Math.floor(Date.now() / 400) % 2;        // 低资源预警闪烁节拍
      const items = [
        { label: '兵力', value: this.fmtTroops(s.troops || 0), color: C.textMain },
        { label: '粮草', value: String(s.supply == null ? 0 : s.supply), color: C.sparkGold },
        { label: '士气', value: String(s.morale == null ? 0 : s.morale), color: C.okGreen },
        { label: '民心', value: String(s.faith == null ? 0 : s.faith), color: C.torch },
      ];
      items.forEach((it, i) => {
        const x = 8 + i * 56, low = i > 0 && (s[['supply', 'morale', 'faith'][i - 1]] || 0) < 30;
        R().text(ctx, it.label, x, 5, { size: 8, color: C.textDim });
        R().text(ctx, it.value, x + 18, 5, { size: 8, color: low && flash ? C.flagRed : it.color });
      });
      R().panel(ctx, 250, 6, 30, 12);                        // [图鉴]
      R().text(ctx, '图鉴', 265, 8, { size: 7, align: 'center' });
      R().panel(ctx, 284, 6, 30, 12);                        // [存档]
      R().text(ctx, '存档', 299, 8, { size: 7, align: 'center' });
      this.areas = [
        { x: 250, y: 6, w: 30, h: 12, action: 'notebook' },
        { x: 284, y: 6, w: 30, h: 12, action: 'save' },
      ];
    },
  };
})(globalThis.XH = globalThis.XH || {});

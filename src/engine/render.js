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
    // 中文按"字符数"换行：CJK 记 1，ASCII 记 0.5
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

;(function (XH) {
  // 通关报告：用时 / 答题正确率 / 玩法星总数 / 笔记收集 / 兵力对比 + 结语三档 + 重新出发回 title
  XH.Scenes = XH.Scenes || {};
  XH.Scenes.report = (st) => {
    const R = () => XH.Render, C = () => XH.PALETTE;
    const total = XH.NODES.length;
    const ratio = ((st.notebook || []).length) / total;
    const word = ratio < 0.5 ? '长征永远在路上'
      : ratio < 0.9 ? '星星之火，正在燎原'
      : '红军不怕远征难，万水千山只等闲';
    const stars = Object.keys(st.mgStars || {}).reduce((s, k) => s + (st.mgStars[k] || 0), 0);
    const mins = Math.floor((st.elapsedMs || 0) / 60000), secs = Math.floor((st.elapsedMs || 0) / 1000) % 60;
    const scene = {
      name: 'report', st, word,
      update() {},
      draw(ctx) {
        const R0 = R(), C0 = C();
        R0.px(ctx, 0, 0, 320, 180, C0.inkBlack);
        R0.panel(ctx, 20, 8, 280, 150);
        R0.text(ctx, '长 征 胜 利', 160, 16, { size: 14, align: 'center', color: C0.sparkGold });
        const rows = [
          '行军用时：' + mins + ' 分 ' + secs + ' 秒',
          '答题正确：' + (st.quizRight || 0) + ' / ' + (st.quizTotal || 0),
          '玩法星数：' + stars + ' / ' + total * 3,
          '党史笔记：' + ((st.notebook || []).length) + ' / ' + total,
          '出发 8.6 万 → 现在约 ' + XH.HUD.fmtTroops(st.troops || 0),
        ];
        rows.forEach((ln, i) => R0.text(ctx, ln, 40, 40 + i * 14, { size: 8, color: C0.textMain }));
        R0.panel(ctx, 44, 116, 232, 28);
        R0.text(ctx, word, 160, 126, { size: 9, align: 'center', color: C0.sparkGold });
        R0.text(ctx, '点击重新出发', 160, 166, { size: 8, align: 'center', color: C0.textMain });
      },
      onInput(e) {
        if (e.type !== 'tap' && !(e.type === 'key' && e.action === 'confirm')) return;
        XH.Save.clear(XH.Platform.storage);                // 新一局：清除旧存档
        XH.Loop.stack.length = 0;
        XH.Loop.push(XH.Scenes.title());
      },
    };
    return scene;
  };
})(globalThis.XH = globalThis.XH || {});

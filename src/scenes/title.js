;(function (XH) {
  // 标题场景：夜色星空 + 火把粒子 + 大字标题；confirm 开始（有档读档），K 继续行军
  XH.Scenes = XH.Scenes || {};
  XH.Scenes.title = () => {
    const R = () => XH.Render, C = () => XH.PALETTE;
    let t = 0, hasSave = false;
    // 固定星空点位（确定性伪随机，不随帧抖动）
    const stars = [];
    for (let i = 0; i < 42; i++) {
      const s = (i * 137 + 29) % 251;
      stars.push([2 + (i * 53 + s) % 316, 3 + s % 92]);
    }
    const go = () => {
      const saved = XH.Save.read(XH.Platform.storage);
      XH.Loop.replace(XH.Scenes.march(saved || XH.State.create()));
    };
    const scene = {
      name: 'title',
      enter() { hasSave = !!XH.Save.read(XH.Platform.storage); },
      update(dt) { t += dt; },
      draw(ctx) {
        const R0 = R(), C0 = C();
        R0.px(ctx, 0, 0, 320, 180, C0.nightBlue);
        R0.px(ctx, 0, 150, 320, 30, C0.inkBlack);            // 地平线剪影
        for (const p of stars) R0.px(ctx, p[0], p[1], 1, 1, C0.textDim);
        for (const tx of [36, 284]) {                        // 两侧火把
          R0.px(ctx, tx, 118, 3, 26, C0.woodDark);
          R0.px(ctx, tx - 2, 108, 7, 10, C0.torch);
          R0.px(ctx, tx, 111, 3, 5, C0.flameCore);
        }
        for (let i = 0; i < 10; i++) {                       // 上升火星粒子
          const ph = (t * 20 + i * 9) % 42;
          const px = (i % 2 ? 284 : 36) + Math.round(Math.sin(t * 3 + i * 2) * 4);
          R0.px(ctx, px, Math.round(108 - ph), 1, 1, i % 3 ? C0.torch : C0.flameCore);
        }
        R0.text(ctx, '星火长征', 160, 38, { size: 24, align: 'center', color: C0.sparkGold });
        R0.text(ctx, '二万五千里行军记', 160, 80, { size: 8, align: 'center', color: C0.textDim });
        R0.text(ctx, '按 回车 / 点击 开始', 160, 122, { size: 8, align: 'center', color: C0.textMain });
        if (hasSave) R0.text(ctx, '继续行军 (K)', 160, 138, { size: 7, align: 'center', color: C0.torch });
      },
      onInput(e) {
        if (e.type === 'tap') { go(); return; }
        if (e.type !== 'key') return;
        if (e.action === 'confirm') go();
        else if (e.action === 'continue' && hasSave) go();
      },
    };
    return scene;
  };
})(globalThis.XH = globalThis.XH || {});

;(function (XH) {
  // 行军场景：队伍沿节点连线前进（18px/s），0.4/0.8 进度抽事件，抵达进入节点流程；
  // HUD 图鉴/存档按钮热区由本场景 onInput 判定（hud.js 注释约定）
  XH.Scenes = XH.Scenes || {};
  XH.Scenes.march = (st) => {
    const R = () => XH.Render, C = () => XH.PALETTE;
    const SPD = 18;                                        // 行军速度 px/s
    let idx = 0, node = null;
    let ax = 0, ay = 0, bx = 0, by = 0, len = 1;
    let progress = 0, arrived = false, ev40 = false, ev80 = false;

    const enter = () => {
      idx = Math.min(st.nodeIndex || 0, XH.NODES.length - 1);
      node = XH.NODES[idx];
      const from = idx > 0 ? XH.NODES[idx - 1].pos : [node.pos[0], node.pos[1] + 26];  // 首节点：从集结地出发
      ax = from[0]; ay = from[1]; bx = node.pos[0]; by = node.pos[1];
      len = Math.max(1, Math.hypot(bx - ax, by - ay));
      progress = 0; ev40 = false; ev80 = false; arrived = false;
    };

    const triggerEvent = () => {
      const ev = XH.NodeFlow.pickEvent(st);
      const card = { choice: { prompt: ev.text, options: ev.options } };
      XH.Loop.push(XH.Overlay.choice(card, opt => XH.NodeFlow.applyEffects(st, opt.effects)));
    };

    const arrive = () => {
      arrived = true;
      // n03（湘江）特殊编排：先弹强减员剧情卡，确认后再进入节点流程
      if (node.id === 'n03') XH.Loop.push(XH.Overlay.story(node, () => XH.NodeFlow.start(st, node)));
      else XH.NodeFlow.start(st, node);
    };

    const scene = {
      name: 'march', st,
      enter,
      update(dt) {
        if (st.nodeIndex !== idx) { enter(); return; }     // 节点流程完成后重同步路径，本帧不前进
        if (arrived) return;
        st.elapsedMs += dt * 1000;
        progress += SPD * dt / len;
        if (!ev40 && progress >= 0.4) { ev40 = true; triggerEvent(); }
        if (!ev80 && progress >= 0.8) { ev80 = true; triggerEvent(); }
        if (progress >= 1) { progress = 1; arrive(); }
      },
      draw(ctx) {
        const R0 = R(), C0 = C(), N = XH.NODES;
        R0.theme(ctx, node.theme);
        for (let i = 1; i < N.length; i++) {               // 全程路线虚线：已走金色 / 未走暗灰
          const p = N[i - 1].pos, q = N[i].pos, col = i <= st.nodeIndex ? C0.sparkGold : C0.textDim;
          for (let d = 0; d < 1; d += 0.07) {
            R0.px(ctx, Math.round(p[0] + (q[0] - p[0]) * d), Math.round(p[1] + (q[1] - p[1]) * d), 2, 2, col);
          }
        }
        N.forEach((nd, i) => {                             // 节点标记：已到金 / 当前红 / 未到灰
          const col = i < st.nodeIndex ? C0.sparkGold : i === st.nodeIndex ? C0.flagRed : C0.uiPanelLight;
          R0.px(ctx, nd.pos[0] - 1, nd.pos[1] - 1, 3, 3, col);
        });
        R0.sprite(ctx, XH.SPRITES.flag, node.pos[0] + 4, Math.max(25, node.pos[1] - 26));  // 终点旗帜
        const px = ax + (bx - ax) * progress, py = ay + (by - ay) * progress;
        R0.sprite(ctx, XH.SPRITES.soldier, Math.round(px) - 8, Math.max(25, Math.round(py) - 15));
        XH.HUD.draw(ctx, st);
      },
      onInput(e) {
        if (e.type !== 'tap') return;
        const a = (XH.HUD.areas || []).find(a => e.x >= a.x && e.x <= a.x + a.w && e.y >= a.y && e.y <= a.y + a.h);
        if (!a) return;
        if (a.action === 'notebook') XH.Loop.push(XH.Overlay.notebook(st));
        else if (a.action === 'save') {
          XH.Save.write(XH.Platform.storage, st);
          try { XH.Platform.audio.play('save'); } catch (err) {}
        }
      },
    };
    return scene;
  };
})(globalThis.XH = globalThis.XH || {});

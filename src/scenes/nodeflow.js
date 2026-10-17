;(function (XH) {
  // 节点编排器：
  //   start    → beginNode → story → choice(applyDelta) → quiz(3题) → MinigameScene → finishMg
  //   finishMg → finishNode → Save → summary → 失败弹 restart / 完成 14 节点弹 report / 否则回 march
  XH.NodeFlow = {
    // 资源变动统一入口：DEBUG_LOCK 开启时把负值归零（调试锁，供 march 事件与节点抉择复用）
    applyEffects(st, d) {
      if (XH.DEBUG_LOCK && d) {
        const safe = {};
        for (const k of ['troops', 'supply', 'morale', 'faith'])
          if (Number.isFinite(d[k])) safe[k] = Math.max(0, d[k]);
        d = safe;
      }
      return XH.State.applyDelta(st, d);
    },

    // 行军事件抽取：seed 线性同余伪随机（seed=(seed*48271)%2147483647），按权重抽，minFaith 过滤
    pickEvent(st) {
      st.seed = (st.seed * 48271) % 2147483647;
      const pool = XH.EVENTS.filter(ev => !ev.minFaith || st.faith >= ev.minFaith);
      let r = (st.seed / 2147483647) * pool.reduce((s, e) => s + e.weight, 0);
      for (const ev of pool) { r -= ev.weight; if (r < 0) return ev; }
      return pool[pool.length - 1];
    },

    start(st, node) {
      XH.State.beginNode(st, node);
      XH.Loop.push(XH.Overlay.story(node, () => {
        XH.Loop.push(XH.Overlay.choice(node, opt => {
          XH.NodeFlow.applyEffects(st, opt.effects);
          const qs = XH.QUESTIONS.filter(q => q.nodeId === node.id);
          XH.Loop.push(XH.Overlay.quiz(qs, (right, total) => {
            XH.State.quizResult(st, right, total);
            XH.Loop.push(XH.MinigameScene.create(node, st,
              stars => XH.NodeFlow.finishMg(st, node, stars)));
          }));
        }));
      }));
    },

    finishMg(st, node, stars) {
      const bonus = XH.State.finishNode(st, node, stars);
      XH.Save.write(XH.Platform.storage, st);
      // MinigameScene 不自行 pop，用 replace 换入 summary
      XH.Loop.replace(XH.Overlay.summary(node, bonus, () => {
        if (XH.State.isFailed(st)) {
          XH.Loop.push(XH.Overlay.restart(st, i => {
            st.lastBonus = 0;
            XH.State.beginNode(st, XH.NODES[i]);
            st.nodeIndex = i;
            XH.Loop.replace(XH.Scenes.march(st));
          }));
        } else if (st.nodeIndex >= XH.NODES.length) {
          XH.Loop.replace(XH.Scenes.report(st));
        }
        // 否则 summary 已自行 pop，栈顶自然回到 march
      }));
    },

    // 调试/T16 验收：新建 State 直接进入第 m 个节点流程（m：0~13），返回新建的 st
    __jump(m) {
      const idx = Math.max(0, Math.min(13, m | 0));
      const st = XH.State.create();
      st.nodeIndex = idx;
      XH.Loop.stack.length = 0;
      XH.Loop.push(XH.Scenes.march(st));                   // 底层 march：流程结束后可回
      XH.NodeFlow.start(st, XH.NODES[idx]);
      return st;
    },
  };
})(globalThis.XH = globalThis.XH || {});

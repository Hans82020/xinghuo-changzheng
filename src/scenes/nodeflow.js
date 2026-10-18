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

    // 行军事件抽取：seed 线性同余伪随机（seed=(seed*48271)%2147483647），按权重抽；
    // 条件过滤：min*/max* 字段限定事件抽取的资源区间（max 为开区间，如 maxSupply:30 表示仅 supply<30 时抽取）
    pickEvent(st) {
      if (!Number.isFinite(st.seed) || st.seed <= 0) st.seed = 1;   // 守卫：坏档 seed=NaN/非正数回退常数，防抽取退化
      st.seed = (st.seed * 48271) % 2147483647;
      const ok = (v, min, max) => (min == null || v >= min) && (max == null || v < max);
      let pool = XH.EVENTS.filter(ev =>
        ok(st.faith, ev.minFaith, ev.maxFaith) && ok(st.supply, ev.minSupply, ev.maxSupply) &&
        ok(st.morale, ev.minMorale, ev.maxMorale) && ok(st.troops, ev.minTroops, ev.maxTroops));
      const crisis = pool.filter(ev => ev.crisis);
      if (crisis.length) pool = crisis;                       // 资源告急时必抽危机事件，强化资源存在感
      let r = (st.seed / 2147483647) * pool.reduce((s, e) => s + e.weight, 0);
      for (const ev of pool) { r -= ev.weight; if (r < 0) return ev; }
      return pool[pool.length - 1];
    },

    start(st, node) {
      XH.State.beginNode(st, node);
      const toChoice = () => {
        XH.Loop.push(XH.Overlay.choice(node, opt => {
          XH.NodeFlow.applyEffects(st, opt.effects);
          const qs = XH.QUESTIONS.filter(q => q.nodeId === node.id);
          XH.Loop.push(XH.Overlay.quiz(qs, (right, total) => {
            XH.State.quizResult(st, right, total);
            XH.Loop.push(XH.MinigameScene.create(node, st,
              stars => XH.NodeFlow.finishMg(st, node, stars)));
          }));
        }));
      };
      XH.Loop.push(XH.Overlay.story(node, () => {
        // 人物对话：story 确认后逐句展示，完结再进抉择（缺省/空对话直接进抉择）
        const lines = (node.dialog || []).filter(d => d && d.who && d.line);
        if (lines.length) XH.Loop.push(XH.Overlay.dialog(lines, toChoice));
        else toChoice();
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

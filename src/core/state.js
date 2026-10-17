;(function (XH) {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  XH.State = {
    create() {
      return { nodeIndex:0, troops:0, supply:100, morale:80, faith:50,
        notebook:[], quizRight:0, quizTotal:0, mgStars:{}, elapsedMs:0,
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
    finishNode(st, node, mgStars) {
      const r = node.mgReward, ratio = [0, 0.35, 0.7, 1][clamp(mgStars|0, 0, 3)];
      const bonus = {};
      for (const k of ['troops','supply','morale','faith']) if (r[k]) bonus[k] = Math.round(r[k] * ratio);
      XH.State.applyDelta(st, bonus);
      st.lastBonus = bonus.troops || 0;
      if (!st.notebook.includes(node.id)) st.notebook.push(node.id);
      st.mgStars[node.id] = clamp(mgStars|0, 0, 3);
      st.nodeIndex = Math.max(st.nodeIndex, XH.NODES.indexOf(node) + 1);
      return bonus;
    },
    quizResult(st, right, total) { st.quizTotal += total; st.quizRight += right; }
  };
})(globalThis.XH = globalThis.XH || {});

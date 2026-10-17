;(function (XH) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  XH.Mech = {
    // 1) timing：窗口判定；命中返回 [窗口(含 quality), quality]，未命中 null
    //    质量：|t-中心|/半宽 ≤0.25 perfect、≤0.8 good、否则 poor
    timingHit(t, windows) {
      const w = windows.find(v => t >= v.start && t <= v.end); if (!w) return null;
      const c = (w.start + w.end) / 2, half = (w.end - w.start) / 2, d = Math.abs(t - c) / half;
      const q = d <= 0.25 ? 'perfect' : d <= 0.8 ? 'good' : 'poor';
      return [Object.assign({}, w, { quality: q }), q];
    },
    // 2) rhythm：节拍判定（tol 为基准容差：0.35 内 perfect、1.3 内 good、1.5 内 poor、之外 miss）
    rhythmInit(beats) { return { beats, hit: beats.map(() => false), judges: [] }; },
    rhythmPress(st, t, tol) {
      let best = -1, bd = Infinity;
      st.beats.forEach((b, i) => { if (!st.hit[i]) { const d = Math.abs(t - b); if (d < bd) { bd = d; best = i; } } });
      if (best < 0 || bd > tol * 1.5) { st.judges.push('miss'); return st; }
      st.hit[best] = true;
      st.judges.push(bd <= tol * 0.35 ? 'perfect' : bd <= tol * 1.3 ? 'good' : 'poor');
      return st;
    },
    rhythmFinish(st, endT) {
      const miss = st.hit.filter(h => !h).length + st.judges.filter(j => j === 'miss').length;
      const good = st.judges.filter(j => j === 'good' || j === 'perfect').length;
      const ratio = st.beats.length ? good / st.beats.length : 0;
      return { miss, stars: ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : ratio >= 0.3 ? 1 : 0 };
    },
    // 3) route：避开设防点则成功（轮次越界时忽略选择，不动结果）
    routeInit(guardsPerRound) { return { guards: guardsPerRound, round: 0, results: [] }; },
    routePick(st, point) { if (st.round >= st.guards.length) return st; st.results.push(!st.guards[st.round].includes(point)); st.round++; return st; },
    routeStars(st) { const ok = st.results.filter(Boolean).length; return ok >= 3 ? 3 : ok === 2 ? 2 : ok === 1 ? 1 : 0; },
    // 4) defend：波次阻击（先老化在场波次，再生成到点波次，新波次不在出生当拍漏防）
    defendSchedule(waves, gap) { return Array.from({ length: waves }, (_, i) => ({ t: (i + 1) * gap, dir: i % 4 })); },
    defendInit(schedule) { return { schedule: schedule.map(s => ({ ...s, done:false })), pending: [], leaked: 0, t: 0 }; },
    defendTick(st, dt) {
      st.t += dt;
      st.pending = st.pending.filter(p => { p.age = (p.age || 0) + dt; if (p.age > 1.2) { st.leaked++; return false; } return true; });
      st.schedule.forEach(w => { if (!w.done && st.t >= w.t) { w.done = true; st.pending.push({ dir: w.dir, age: 0 }); } });
      return st;
    },
    defendIntercept(st, dir) { const i = st.pending.findIndex(p => p.dir === dir); if (i >= 0) st.pending.splice(i, 1); return st; },
    defendFinish(st) { const total = st.schedule.length; return { leaked: st.leaked, stars: st.leaked === 0 ? 3 : st.leaked <= 1 ? 2 : st.leaked <= 2 ? 1 : 0, total }; },
    // 5) allocate：池内资源分配满足最小值
    allocateValid(alloc, slots, pool) {
      let sum = 0; for (const s of slots) { if (!Number.isFinite(alloc[s.id]) || alloc[s.id] < 0) return false; sum += alloc[s.id]; }
      if (sum > pool) return false;
      return slots.every(s => (alloc[s.id] || 0) >= s.min);
    },
    // 6) trust：信任累加（初始信任 10，正选择 +25，负选择 -10）
    trustInit(rounds) { return { trust: 10, round: 0, rounds, log: [] }; },
    trustChoose(st, positive) { st.log.push(positive); if (positive) st.trust += 25; else st.trust = Math.max(0, st.trust - 10); st.round++; return st; },
    trustStars(st) { return st.trust >= 75 ? 3 : st.trust >= 50 ? 2 : st.trust >= 25 ? 1 : 0; },
    // 7) dodge：碰撞
    dodgeCollide(lane, yMin, yMax, hazards) { return hazards.some(h => h.lane === lane && h.y >= yMin && h.y <= yMax); },
    // 8) dual：佯攻衰减条 + 攀爬进度条
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

  // ===== 绘制层：XH.MechDraw（320×180；view 由各玩法场景组装，字段均可缺省）=====
  const PD = () => XH.PALETTE, RD = () => XH.Render;
  XH.MechDraw = {
    // 通用计量条：黑槽 + 前景比例
    _bar(ctx, x, y, w, h, ratio, fg) {
      const C = PD();
      RD().px(ctx, x, y, w, h, C.inkBlack);
      RD().px(ctx, x + 1, y + 1, Math.round((w - 2) * clamp(ratio || 0, 0, 1)), h - 2, fg);
    },
    // timing：移动光标与窗口带。view={t,span,windows}
    timing(ctx, view) {
      const C = PD(), v = view || {};
      const span = v.span || 4, windows = v.windows || [{ start: 2, end: 3 }];
      RD().text(ctx, '时机判定——光标入金区再出手！', 6, 6, { size: 8, color: C.sparkGold });
      RD().px(ctx, 40, 96, 240, 14, C.uiPanelLight);               // 判定轨道
      for (let i = 0; i <= 8; i++) RD().px(ctx, 40 + i * 30, 110, 1, 3, C.ropeGray);
      for (const w of windows) {                                   // 窗口带
        const x1 = 40 + (w.start / span) * 240, x2 = 40 + (w.end / span) * 240;
        RD().px(ctx, x1, 96, Math.max(2, x2 - x1), 14, C.sparkGold);
        RD().px(ctx, x1, 96, Math.max(1, (x2 - x1) / 2), 14, C.flameCore);
      }
      const t = v.t == null ? span / 2 : v.t;
      RD().px(ctx, 40 + (t / span) * 240 - 1, 90, 3, 26, C.flagRed); // 光标
      this._bar(ctx, 40, 128, 240, 6, t / span, C.torch);          // 进度/计时条
      RD().text(ctx, 'PERFECT · GOOD · POOR', 160, 144, { size: 7, align: 'center', color: C.textDim });
    },
    // rhythm：节拍点从右向左滚动至判定线。view={beats,hit,judges,now}
    rhythm(ctx, view) {
      const C = PD(), v = view || {};
      const now = v.now || 0, speed = 56, lineX = 56;
      RD().text(ctx, '节奏行军——鼓点到金线再踏步！', 6, 6, { size: 8, color: C.sparkGold });
      RD().px(ctx, 0, 82, 320, 16, C.uiPanel);                     // 节拍带
      RD().px(ctx, lineX, 76, 2, 28, C.sparkGold);                 // 判定线
      const beats = v.beats || [], hit = v.hit || [];
      for (let i = 0; i < beats.length; i++) {
        const x = lineX + (beats[i] - now) * speed;
        if (x < -6 || x > 326) continue;
        RD().px(ctx, x - 3, 86, 6, 8, hit[i] ? C.okGreen : C.textMain);
      }
      const js = (v.judges || []).slice(-6);
      for (let i = 0; i < js.length; i++) {
        RD().text(ctx, js[i], 70 + i * 42, 88, { size: 7, align: 'center',
          color: js[i] === 'perfect' ? C.sparkGold : js[i] === 'miss' ? C.flagRed : C.textMain });
      }
      const done = hit.filter(Boolean).length;
      this._bar(ctx, 96, 128, 128, 8, beats.length ? done / beats.length : 0, C.okGreen);
      RD().text(ctx, '节拍 ' + done + '/' + beats.length, 160, 144, { size: 7, align: 'center' });
    },
    // route：4 个渡口按钮+敌军旗。view={guards,round,results}
    route(ctx, view) {
      const C = PD(), v = view || {};
      const guards = v.guards || [], round = v.round || 0;
      RD().text(ctx, '四渡赤水——避开设防渡口！', 6, 6, { size: 8, color: C.sparkGold });
      RD().px(ctx, 0, 96, 320, 24, C.water);                       // 江面
      for (let i = 0; i < 4; i++) {
        const x = 20 + i * 72, y = 42;
        RD().panel(ctx, x, y, 60, 78);
        RD().text(ctx, '渡口' + '一二三四'[i], x + 8, y + 6, { size: 8 });
        RD().px(ctx, x + 6, y + 34, 48, 8, C.waterDark);           // 栈桥
        for (let k = 0; k < 4; k++) RD().px(ctx, x + 8 + k * 12, y + 33, 8, 2, C.bridgePlank);
        if ((guards[round] || []).includes(i)) {                   // 敌军旗
          RD().px(ctx, x + 28, y + 18, 2, 16, C.woodDark);
          RD().px(ctx, x + 30, y + 18, 12, 8, C.flagRed);
          RD().text(ctx, '敌', x + 32, y + 17, { size: 7, color: C.textMain });
        }
        const r = (v.results || [])[i];
        if (r === true) RD().text(ctx, '通过', x + 14, y + 58, { size: 8, color: C.okGreen });
        else if (r === false) RD().text(ctx, '遭遇', x + 14, y + 58, { size: 8, color: C.flagRed });
      }
      this._bar(ctx, 96, 134, 128, 8, (v.results || []).filter(Boolean).length / 4, C.okGreen);
      RD().text(ctx, '第 ' + (round + 1) + '/4 轮', 160, 150, { size: 8, align: 'center' });
    },
    // defend：中军帐+四向来袭箭头。view={schedule,pending,t}
    defend(ctx, view) {
      const C = PD(), v = view || {};
      const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]], names = ['北', '东', '南', '西'];
      RD().text(ctx, '阻击战——来敌抵帐前点对应方向！', 6, 6, { size: 8, color: C.sparkGold });
      RD().px(ctx, 0, 24, 320, 156, C.loess);                      // 黄土战场
      RD().px(ctx, 148, 74, 24, 34, C.loessDark);                  // 中军帐
      RD().px(ctx, 142, 78, 36, 8, C.flagRed);
      RD().px(ctx, 156, 64, 8, 8, C.sparkGold);
      RD().text(ctx, '帅', 152, 82, { size: 9, align: 'center' });
      for (const p of (v.pending || [])) {                         // 待拦截敌兵
        const d = dirs[p.dir % 4] || dirs[0], dist = 64 - (p.age || 0) * 44;
        const x = 159 + d[0] * dist, y = 88 + d[1] * dist;
        RD().px(ctx, x - 4, y - 4, 9, 9, C.uniformDark);
        RD().px(ctx, x - 2, y - 7, 5, 3, C.flagRed);
      }
      const sch = v.schedule || [];
      for (let i = 0; i < sch.length; i++) {                       // 来袭预告
        if (sch[i].done) continue;
        RD().text(ctx, names[sch[i].dir % 4] + ' ' + Math.max(0, sch[i].t - (v.t || 0)).toFixed(1) + 's',
          8 + i * 44, 154, { size: 7, color: C.warnOrange });
      }
      this._bar(ctx, 96, 140, 128, 6, (v.pending || []).length / Math.max(1, sch.length), C.flagRed);
      RD().text(ctx, '防线压力', 160, 150, { size: 7, align: 'center', color: C.textDim });
    },
    // allocate：槽位条可点加减。view={slots,alloc,pool}
    allocate(ctx, view) {
      const C = PD(), v = view || {};
      const slots = v.slots || [], alloc = v.alloc || {};
      let sum = 0; for (const s of slots) sum += alloc[s.id] || 0;
      RD().text(ctx, '物资分配——每项不低于最低限额', 6, 6, { size: 8, color: C.sparkGold });
      this._bar(ctx, 96, 20, 100, 8, (v.pool || 0) ? sum / (v.pool || 0) : 0, C.torch);
      RD().text(ctx, '已配 ' + sum + '/' + (v.pool || 0), 204, 19, { size: 8,
        color: sum > (v.pool || 0) ? C.flagRed : C.okGreen });
      for (let i = 0; i < slots.length; i++) {
        const s = slots[i], y = 44 + i * 32, n = alloc[s.id] || 0;
        RD().px(ctx, 20, y + 2, 12, 12, C.uiPanelLight);           // 减号钮
        RD().px(ctx, 23, y + 7, 6, 2, C.textMain);
        RD().text(ctx, s.name || s.id, 44, y + 3, { size: 8 });
        RD().px(ctx, 100, y, 110, 16, C.inkBlack);
        RD().px(ctx, 101, y + 1, Math.round(108 * Math.min(1, n / 10)), 14, C.okGreen);
        for (let k = 1; k < 10; k += 2) RD().px(ctx, 100 + k * 11, y, 1, 16, C.inkBlack);
        RD().text(ctx, String(n), 216, y + 3, { size: 8, color: n >= s.min ? C.okGreen : C.flagRed });
        RD().px(ctx, 236, y + 2, 12, 12, C.uiPanelLight);          // 加号钮
        RD().px(ctx, 239, y + 7, 6, 2, C.textMain);
        RD().px(ctx, 241, y + 4, 2, 8, C.textMain);
        RD().text(ctx, '≥' + s.min, 260, y + 4, { size: 7, color: C.textDim });
      }
    },
    // trust：信任条+两选项。view={trust,round,rounds,prompt,options}
    trust(ctx, view) {
      const C = PD(), v = view || {};
      RD().text(ctx, v.prompt || '老乡指路——这话能信几分？', 6, 6, { size: 8, color: C.sparkGold });
      RD().px(ctx, 60, 26, 200, 12, C.inkBlack);                   // 信任条
      RD().px(ctx, 61, 27, Math.round(198 * clamp((v.trust || 0) / 100, 0, 1)), 10, C.okGreen);
      RD().text(ctx, '信任 ' + (v.trust || 0) + '/100', 160, 42, { size: 7, align: 'center' });
      RD().panel(ctx, 36, 66, 116, 72);                            // 选项·相信
      RD().px(ctx, 78, 78, 32, 24, C.skin);
      RD().px(ctx, 86, 84, 4, 4, C.inkBlack); RD().px(ctx, 100, 84, 4, 4, C.inkBlack);
      RD().text(ctx, (v.options || ['相信他', '有所保留'])[0], 94, 112, { size: 8, align: 'center' });
      RD().panel(ctx, 168, 66, 116, 72);                           // 选项·保留
      RD().px(ctx, 210, 78, 32, 24, C.uniformGray);
      RD().px(ctx, 218, 84, 4, 4, C.inkBlack); RD().px(ctx, 232, 84, 4, 4, C.inkBlack);
      RD().text(ctx, (v.options || ['相信他', '有所保留'])[1], 226, 112, { size: 8, align: 'center' });
      RD().text(ctx, '第 ' + ((v.round || 0) + 1) + '/' + (v.rounds || 4) + ' 问', 160, 152,
        { size: 8, align: 'center', color: C.textDim });
    },
    // dodge：底部小船+下落漩涡。view={lane,hazards}
    dodge(ctx, view) {
      const C = PD(), v = view || {};
      RD().text(ctx, '强渡大渡河——躲开漩涡与暗礁！', 6, 6, { size: 8, color: C.sparkGold });
      RD().px(ctx, 0, 24, 320, 156, C.water);                      // 江面
      for (let i = 1; i < 4; i++) for (let k = 0; k < 13; k++)     // 分道浪线
        RD().px(ctx, i * 80 - 1, 28 + k * 12 + (k % 2 ? 2 : 0), 2, 6, C.waterDark);
      for (const h of (v.hazards || [])) {                         // 下落漩涡
        const x = (h.lane || 0) * 80 + 40, y = h.y || 0;
        RD().px(ctx, x - 10, y - 6, 20, 12, C.waterDark);
        RD().px(ctx, x - 5, y - 2, 10, 5, C.nightBlue);
        RD().px(ctx, x - 1, y, 3, 2, C.inkBlack);
      }
      const bx = ((v.lane == null ? 1 : v.lane) % 4) * 80 + 40;    // 底部小船
      RD().px(ctx, bx - 14, 158, 28, 6, C.wood);
      RD().px(ctx, bx - 10, 154, 20, 4, C.woodDark);
      RD().px(ctx, bx - 1, 142, 2, 12, C.uniformGray);
      RD().px(ctx, bx + 1, 142, 10, 6, C.flagRed);
      RD().px(ctx, bx + 2, 143, 3, 3, C.sparkGold);
    },
    // dual：左右两条计量条（佯攻/攀城）。view={front,climb}
    dual(ctx, view) {
      const C = PD(), v = view || {};
      const front = v.front == null ? 50 : v.front, climb = v.climb || 0;
      RD().text(ctx, '声东击西——佯攻不落、攀城不停！', 6, 6, { size: 8, color: C.sparkGold });
      RD().px(ctx, 0, 24, 320, 156, C.nightBlue);
      RD().text(ctx, '佯攻', 30, 44, { size: 8 });
      this._bar(ctx, 30, 56, 104, 12, front / 100, C.flagRed);
      RD().text(ctx, String(Math.round(front)), 138, 57, { size: 7 });
      RD().text(ctx, '攀城', 30, 84, { size: 8 });
      this._bar(ctx, 30, 96, 104, 12, climb / 100, C.okGreen);
      RD().text(ctx, Math.round(climb) + '%', 138, 97, { size: 7 });
      RD().px(ctx, 210, 40, 70, 120, C.loessDark);                 // 城墙
      for (let k = 0; k < 6; k++) RD().px(ctx, 214, 48 + k * 20, 62, 2, C.pathDark);
      const cy = 148 - Math.round(96 * clamp(climb / 100, 0, 1));
      RD().px(ctx, 240, cy, 8, 10, C.uniformGray);                 // 攀城战士
      RD().px(ctx, 241, cy - 4, 6, 5, C.skin);
      RD().px(ctx, 247, cy - 3, 8, 5, C.flagRed);
    },
    // finale：三面向中心移动的旗。view={progress}
    finale(ctx, view) {
      const C = PD(), v = view || {};
      const p = clamp(v.progress == null ? 0 : v.progress, 0, 1);
      RD().text(ctx, '会宁会师——三支红旗向中央靠拢！', 6, 6, { size: 8, color: C.sparkGold });
      RD().px(ctx, 0, 24, 320, 156, C.hazePurple);                 // 黄昏天幕
      for (let k = 0; k < 40; k++) RD().px(ctx, (k * 97) % 320, 28 + (k * 53) % 80, 1, 1, C.cloudWhite);
      RD().px(ctx, 0, 148, 320, 32, C.loess);                      // 黄土大地
      RD().px(ctx, 136, 96, 48, 52, C.loessDark);                  // 会宁城楼
      RD().px(ctx, 132, 88, 56, 10, C.woodDark);
      RD().px(ctx, 154, 118, 12, 30, C.woodDark);
      const off = Math.round(p * 78);                              // 三面旗向中心移动
      const flags = [[26 + off, 44], [147, 32 + Math.round(p * 12)], [268 - off, 44]];
      for (let i = 0; i < flags.length; i++) {
        const fx = flags[i][0], fy = flags[i][1];
        RD().px(ctx, fx + 7, fy, 2, 148 - fy, C.wood);
        RD().px(ctx, fx - 8, fy, 15, 9, i === 1 ? C.redStar : C.flagRed);
        RD().px(ctx, fx - 4, fy + 2, 4, 4, C.sparkGold);
      }
      this._bar(ctx, 96, 154, 128, 8, p, C.sparkGold);
      RD().text(ctx, '星星之火，可以燎原', 160, 168, { size: 8, align: 'center', color: C.flameCore });
    },
  };
})(globalThis.XH = globalThis.XH || {});

;(function (XH) {
  // 通用玩法场景：读 MG_CONFIGS[node.mg]，按 type 组装 Mech 状态与 MechDraw 视图
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const starStr = n => '★'.repeat(n) + '☆'.repeat(3 - n);

  XH.MinigameScene = {
    // 结算星级映射（纯函数）：timing/dodge 按比例，rhythm/route/defend/trust/dual 直通 Mech 规则
    scoreStars(type, result, cfg) {
      const M = XH.Mech, r = result || {};
      switch (type) {
        case 'timing': {
          const total = cfg.windows.length, p = r.perfect || 0;
          return p >= total ? 3 : p >= total / 2 ? 2 : p >= 1 ? 1 : 0;
        }
        case 'rhythm': return r.stars || 0;
        case 'route': return M.routeStars({ results: [0, 1, 2, 3].map(i => i < (r.ok || 0)) });
        case 'defend': return M.defendFinish({ schedule: [], leaked: r.leaked || 0 }).stars;
        case 'allocate': return (r.valid && r.time < cfg.timeLimit * 2 / 3) ? 3 : r.valid ? 2 : 0;
        case 'trust': return M.trustStars({ trust: r.trust || 0 });
        case 'dodge': {
          const hz = cfg.hazardCount, h = r.hits || 0;
          return h <= Math.ceil(hz * 0.04) ? 3 : h <= Math.ceil(hz * 0.1) ? 2 : h <= Math.ceil(hz * 0.2) ? 1 : 0;
        }
        case 'dual': return M.dualStars(r);
        case 'finale': return 3;
        default: return 0;
      }
    },

    create(node, st, onDone) {
      const M = XH.Mech, MD = XH.MechDraw, R = XH.Render, C = () => XH.PALETTE;
      const cfg = XH.MG_CONFIGS[node.mg];
      const g = { type: cfg.type, phase: 'ready', t: 0, resultT: 0, stars: 0, finished: false };  // ready：指引屏，任意 tap/confirm 开玩

      // —— 结算：0.8s 展示成功/失败与星级后回调一次 ——
      const finish = (stars) => {
        if (g.phase === 'result') return;
        g.stars = stars; g.phase = 'result'; g.resultT = 0;
        try { if (XH.Platform && XH.Platform.audio) XH.Platform.audio.play(stars >= 2 ? 'victory' : 'wrong'); } catch (e) {}
      };
      const settle = (type, result) => finish(XH.MinigameScene.scoreStars(type, result, cfg));

      // —— 各类型私有状态 ——
      let span = 10, widx = 0, pq = { perfect: 0, good: 0, poor: 0 };            // timing
      let rhy = null;                                                           // rhythm
      let rt = null;                                                            // route
      let df = null, dTimeout = 20;                                             // defend
      let alloc = {}, aTime = 0;                                                // allocate
      let ts = null, sub = 'ask', explain = '', subT = 0;                       // trust
      let dg = null;                                                            // dodge
      let du = null, press = null;                                              // dual
      let prog = 0, holdT = 0;                                                  // finale

      switch (cfg.type) {
        case 'timing': span = cfg.windows[cfg.windows.length - 1].end + 1; break;
        case 'rhythm': rhy = M.rhythmInit(cfg.beats); break;
        case 'route': rt = M.routeInit(cfg.guards); break;
        case 'defend':
          df = M.defendInit(M.defendSchedule(cfg.waves, cfg.gap));
          dTimeout = cfg.waves * cfg.gap + 2;
          break;
        case 'allocate': cfg.slots.forEach(s => { alloc[s.id] = 0; }); break;
        case 'trust': ts = M.trustInit(cfg.rounds); break;
        case 'dodge': dg = { lane: 1, hazards: [], hits: 0, left: cfg.hazardCount, spawnT: 0 }; break;
        case 'dual': du = M.dualInit(); break;
        case 'finale': break;
      }

      const confirmAlloc = () => {
        const valid = M.allocateValid(alloc, cfg.slots, cfg.pool);
        settle('allocate', { valid, time: aTime });
      };

      const scene = {
        update(dt) {
          if (g.finished || g.phase === 'ready') return;   // ready 指引屏：不计时、不推进
          if (g.phase === 'result') {                 // 结算展示 0.8s 后回调
            g.resultT += dt;
            if (g.resultT >= 0.8) { g.finished = true; onDone(g.stars); }
            return;
          }
          g.t += dt;
          switch (cfg.type) {
            case 'timing': {                          // 错过的窗口计 poor
              while (widx < cfg.windows.length && g.t > cfg.windows[widx].end) { pq.poor++; widx++; }
              if (widx >= cfg.windows.length) settle('timing', pq);
              break;
            }
            case 'rhythm': {
              if (g.t > cfg.beats[cfg.beats.length - 1] + 1) settle('rhythm', M.rhythmFinish(rhy, g.t));
              break;
            }
            case 'defend': {
              M.defendTick(df, dt);
              if ((df.schedule.every(w => w.done) && df.pending.length === 0) || df.t > dTimeout)
                settle('defend', M.defendFinish(df));
              break;
            }
            case 'allocate': {
              aTime += dt;
              if (aTime >= cfg.timeLimit) settle('allocate', { valid: false, time: aTime });
              break;
            }
            case 'trust': {
              if (sub === 'explain') { subT += dt; if (subT >= 1.2) sub = 'ask'; }
              break;
            }
            case 'dodge': {
              const iv = cfg.duration / cfg.hazardCount;
              dg.spawnT += dt;
              while (dg.spawnT >= iv && dg.left > 0) {  // 总量 hazardCount，速度随进度加快
                dg.spawnT -= iv; dg.left--;
                dg.hazards.push({ lane: Math.floor(Math.random() * 3), y: -10,
                  speed: 60 + (g.t / cfg.duration) * 90 });
              }
              for (const h of dg.hazards) h.y += h.speed * dt;
              dg.hazards = dg.hazards.filter(h => h.y <= 190);
              if (M.dodgeCollide(dg.lane, 146, 168, dg.hazards)) {
                dg.hits++;
                dg.hazards = dg.hazards.filter(h => !(h.lane === dg.lane && h.y >= 146 && h.y <= 168));
              }
              if (g.t >= cfg.duration) settle('dodge', { hits: dg.hits });
              break;
            }
            case 'dual': {
              M.dualStep(du, press, dt); press = null;  // 无按键帧 undefined，衰减照常
              if (du.climb >= 100 || du.t >= 60) settle('dual', du);
              break;
            }
            case 'finale': {
              if (holdT > 0) { prog += dt * 40; holdT = Math.max(0, holdT - dt); }
              else prog = Math.max(0, prog - dt * 10);
              if (prog >= 100) { prog = 100; settle('finale', {}); }
              break;
            }
          }
        },

        onInput(e) {
          if (g.phase === 'ready') {                 // 指引屏：tap / 回车进入玩法
            if (e.type === 'tap' || (e.type === 'key' && e.action === 'confirm')) g.phase = 'play';
            return;
          }
          if (g.phase !== 'play') return;
          const isTap = e.type === 'tap', isConfirm = e.type === 'key' && e.action === 'confirm';
          switch (cfg.type) {
            case 'timing': {
              if ((!isTap && !isConfirm) || widx >= cfg.windows.length) return;
              const hit = M.timingHit(g.t, [cfg.windows[widx]]);
              if (!hit) return;                       // 未进窗口：忽略，由超时兜底
              pq[hit[1]]++; widx++;
              if (widx >= cfg.windows.length) settle('timing', pq);
              break;
            }
            case 'rhythm':
              if (isTap || isConfirm) M.rhythmPress(rhy, g.t, cfg.tol);
              break;
            case 'route': {
              if (!isTap) return;
              const i = Math.floor((e.x - 20) / 72);  // 4 等分渡口热区
              if (i < 0 || i > 3 || e.y < 42 || e.y > 120 || rt.round >= cfg.guards.length) return;
              M.routePick(rt, i);
              if (rt.round >= cfg.guards.length) settle('route', { ok: rt.results.filter(Boolean).length });
              break;
            }
            case 'defend': {
              let dir = -1;
              if (e.type === 'key') dir = { up: 0, right: 1, down: 2, left: 3 }[e.action] ?? -1;
              else if (isTap) dir = e.y < 90 ? (e.x < 160 ? 0 : 1) : (e.x < 160 ? 3 : 2);  // 触屏四象限：左上↑ 右上→ 右下↓ 左下←
              if (dir >= 0) M.defendIntercept(df, dir);
              break;
            }
            case 'allocate': {
              const inBtn = (x, y, bx, by) => x >= bx && x <= bx + 12 && y >= by && y <= by + 12;
              if (isTap) {
                for (let i = 0; i < cfg.slots.length; i++) {
                  const s = cfg.slots[i], y = 44 + i * 32;
                  if (inBtn(e.x, e.y, 20, y + 2)) { alloc[s.id] = Math.max(0, (alloc[s.id] || 0) - 1); return; }
                  if (inBtn(e.x, e.y, 236, y + 2)) {
                    let sum = 0; cfg.slots.forEach(k => { sum += alloc[k.id] || 0; });
                    if (sum < cfg.pool) alloc[s.id] = (alloc[s.id] || 0) + 1;
                    return;
                  }
                }
                if (e.x >= 96 && e.x <= 224 && e.y >= 164 && e.y <= 178) confirmAlloc();
              } else if (isConfirm) confirmAlloc();
              break;
            }
            case 'trust': {
              if (!isTap || sub !== 'ask') return;
              const cur = cfg.rounds[ts.round]; if (!cur) return;
              let positive = null;
              if (e.x >= 36 && e.x <= 152 && e.y >= 66 && e.y <= 138) positive = true;
              else if (e.x >= 168 && e.x <= 284 && e.y >= 66 && e.y <= 138) positive = false;
              if (positive === null) return;
              M.trustChoose(ts, positive);
              if (ts.round >= cfg.rounds.length) settle('trust', ts);
              else { explain = cur.explain || ''; sub = 'explain'; subT = 0; }
              break;
            }
            case 'dodge': {
              if (e.type === 'key' && e.action === 'left') dg.lane = Math.max(0, dg.lane - 1);
              else if (e.type === 'key' && e.action === 'right') dg.lane = Math.min(2, dg.lane + 1);
              else if (isTap) dg.lane = e.x < 107 ? 0 : e.x < 213 ? 1 : 2;
              break;
            }
            case 'dual': {
              if (e.type === 'key' && e.action === 'left') press = 'front';
              else if (e.type === 'key' && e.action === 'right') press = 'climb';
              else if (isTap) press = e.x < 160 ? 'front' : 'climb';
              break;
            }
            case 'finale':
              if (isConfirm || isTap) holdT = 1.6;    // 按住窗口内进度推进，松开回落
              break;
          }
        },

        draw(ctx) {
          const P = C();
          this.areas = [];                                       // 每帧重建热区（与 overlays 契约统一）
          if (g.phase === 'ready') {                             // 玩法指引屏：名称 + 操作说明 + 开始提示
            R.px(ctx, 0, 0, 320, 180, 'rgba(11,14,19,0.82)');
            R.panel(ctx, 40, 44, 240, 92);
            R.text(ctx, node.name, 160, 56, { size: 11, align: 'center', color: P.sparkGold });
            const gl = R.wrapText(cfg.guide || cfg.hint, 24);
            gl.forEach((ln, i) => R.text(ctx, ln, 160, 76 + i * 12, { size: 8, align: 'center', color: P.textMain }));
            R.text(ctx, '—— 点击画面 / 按回车 开始 ——', 160, 80 + gl.length * 12, { size: 8, align: 'center', color: P.okGreen });
            return;
          }
          switch (cfg.type) {
            case 'timing': MD.timing(ctx, { t: g.t, span, windows: cfg.windows }); break;
            case 'rhythm': MD.rhythm(ctx, { beats: rhy.beats, hit: rhy.hit, judges: rhy.judges, now: g.t }); break;
            case 'route': MD.route(ctx, { guards: cfg.guards, round: rt.round, results: rt.results }); break;
            case 'defend': MD.defend(ctx, { schedule: df.schedule, pending: df.pending, t: df.t }); break;
            case 'allocate':
              MD.allocate(ctx, { slots: cfg.slots.map(s => Object.assign({}, s, { name: s.label })), alloc, pool: cfg.pool });
              R.panel(ctx, 96, 164, 128, 14);
              R.text(ctx, '确认分配', 160, 168, { size: 8, align: 'center', color: P.sparkGold });
              break;
            case 'trust': {
              const cur = cfg.rounds[Math.min(ts.round, cfg.rounds.length - 1)];
              MD.trust(ctx, { trust: ts.trust, round: ts.round, rounds: cfg.rounds.length,
                prompt: cur.prompt, options: [cur.positive, cur.negative] });
              this.areas.push({ x: 36, y: 66, w: 116, h: 72, action: 'positive' },
                { x: 168, y: 66, w: 116, h: 72, action: 'negative' });
              if (sub === 'explain') {
                R.panel(ctx, 40, 56, 240, 64);
                const lines = R.wrapText(explain || '', 26);
                lines.forEach((ln, i) => R.text(ctx, ln, 52, 68 + i * 12, { size: 8, color: P.textMain }));
              }
              break;
            }
            case 'dodge': MD.dodge(ctx, { lane: dg.lane, hazards: dg.hazards }); break;
            case 'dual': MD.dual(ctx, { front: du.front, climb: du.climb }); break;
            case 'finale': MD.finale(ctx, { progress: prog }); break;
          }
          // 顶部统一：提示条 + 计时条
          R.px(ctx, 0, 0, 320, 13, P.inkBlack);
          R.text(ctx, cfg.hint, 160, 3, { size: 7, align: 'center', color: P.sparkGold });
          const ratio = clamp((() => {
            switch (cfg.type) {
              case 'timing': return g.t / span;
              case 'rhythm': return g.t / (cfg.beats[cfg.beats.length - 1] + 1);
              case 'route': return rt.results.length / 4;
              case 'defend': return df.t / dTimeout;
              case 'allocate': return aTime / cfg.timeLimit;
              case 'trust': return ts.round / cfg.rounds.length;
              case 'dodge': return g.t / cfg.duration;
              case 'dual': return du.t / 60;
              case 'finale': return prog / 100;
              default: return 0;
            }
          })(), 0, 1);
          R.px(ctx, 0, 13, 320, 2, P.uiPanelLight);
          R.px(ctx, 0, 13, Math.round(320 * ratio), 2, P.torch);
          // 结算面板：短暂展示成功/失败与星级
          if (g.phase === 'result') {
            R.px(ctx, 0, 0, 320, 180, 'rgba(11,14,19,0.78)');
            R.panel(ctx, 84, 58, 152, 64);
            R.text(ctx, g.stars >= 2 ? '成 功' : '失 败', 160, 70,
              { size: 12, align: 'center', color: g.stars >= 2 ? P.okGreen : P.flagRed });
            R.text(ctx, starStr(g.stars), 160, 96, { size: 12, align: 'center', color: P.sparkGold });
          }
        },
      };
      return scene;
    },
  };
})(globalThis.XH = globalThis.XH || {});

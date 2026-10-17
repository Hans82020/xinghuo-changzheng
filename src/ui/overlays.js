;(function (XH) {
  // 弹层：可 push 到 XH.Loop 的全屏场景，完成后 pop 并回调
  const R = () => XH.Render, P = () => XH.PALETTE;
  const RES = { troops: '兵力', supply: '粮草', morale: '士气', faith: '民心' };
  const play = name => { try { XH.Platform.audio.play(name); } catch (e) {} };
  const hit = (areas, x, y) => (areas || []).find(a => x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h);
  const popIfTop = scene => {
    try { if (XH.Loop && typeof XH.Loop.top === 'function' && XH.Loop.top() === scene) XH.Loop.pop(); } catch (e) {}
  };
  // 文字像素宽估算（CJK 记 1、ASCII 记 0.5），用于追绘 ✓ 等尾标
  const wOf = (str, size) => { let w = 0; for (const ch of String(str)) w += (ch.charCodeAt(0) > 255 ? 1 : 0.5) * (size || 7); return w; };
  // 资源变动摘要：只列非零项，如『士气+8 兵力-2000』
  const fmtDelta = v => (v > 0 ? '+' : v < 0 ? '-' : '') + (Math.abs(v) >= 10000 ? XH.HUD.fmtTroops(Math.abs(v)) : Math.abs(v));
  const effText = eff => Object.keys(RES).filter(k => eff && eff[k]).map(k => RES[k] + fmtDelta(eff[k])).join(' ');

  XH.Overlay = {
    // 打乱选项：Fisher-Yates，不改原数组；answer 为正确项在新数组中的下标
    shuffleOptions(q, rng) {
      const rand = rng || Math.random;
      const idx = q.options.map((_, i) => i);
      for (let i = idx.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        const t = idx[i]; idx[i] = idx[j]; idx[j] = t;
      }
      return { options: idx.map(i => q.options[i]), answer: idx.indexOf(q.answer) };
    },

    // 剧情卡：节点名+日期、正文段落、金框情感块
    story(node, onDone) {
      const C = P(), R0 = R(), em = node.emotion || {};
      let closed = false;
      const scene = {
        update() {},
        draw(ctx) {
          R0.px(ctx, 0, 0, 320, 180, C.inkBlack);
          R0.panel(ctx, 16, 24, 288, 144);
          R0.text(ctx, node.name + ' · ' + node.date, 28, 34, { size: 10, color: C.textMain });
          let y = 50;
          for (const para of (node.story || [])) {
            for (const ln of R0.wrapText(para, 26)) { R0.text(ctx, ln, 28, y, { size: 7, color: C.textMain }); y += 11; }
            y += 2;
          }
          R0.panel(ctx, 24, 120, 272, 40);                     // 金框情感块
          R0.text(ctx, em.title || '', 32, 125, { size: 8, color: C.sparkGold });
          if (em.tag) R0.text(ctx, em.tag, 288, 125, { size: 7, align: 'right', color: C.textDim });
          let ty = 136;
          for (const ln of R0.wrapText(em.text || '', 24)) { R0.text(ctx, ln, 32, ty, { size: 7, color: C.textMain }); ty += 9; }
          R0.text(ctx, '回车 / 点击 继续', 160, 171, { size: 7, align: 'center', color: C.textDim });
        },
        onInput(e) {
          if (closed) return;
          if (e.type !== 'tap' && !(e.type === 'key' && (e.action === 'confirm' || e.action === 'cancel'))) return;
          closed = true; play('click'); popIfTop(scene);
          if (onDone) onDone();
        },
      };
      return scene;
    },

    // 抉择卡：选项行高 22，tap 选中高亮+摘要+解析，confirm/tap 确认
    choice(node, onDone) {
      const C = P(), R0 = R(), ch = node.choice || { prompt: '', options: [] };
      let picked = -1, closed = false;
      const confirmPick = () => {
        if (closed || picked < 0) return;
        closed = true; play('click'); popIfTop(scene);
        if (onDone) onDone(ch.options[picked]);
      };
      const scene = {
        update() {}, areas: [],
        draw(ctx) {
          R0.px(ctx, 0, 0, 320, 180, C.inkBlack);
          R0.panel(ctx, 16, 16, 288, 148);
          R0.text(ctx, '抉 择', 160, 24, { size: 10, align: 'center', color: C.sparkGold });
          let y = 42;
          for (const ln of R0.wrapText(ch.prompt || '', 24)) { R0.text(ctx, ln, 28, y, { size: 8, color: C.textMain }); y += 11; }
          y += 6;
          scene.areas = [];
          ch.options.forEach((opt, i) => {
            R0.panel(ctx, 28, y, 264, 22);
            if (i === picked) R0.px(ctx, 29, y + 1, 262, 20, C.uiPanelLight);
            R0.text(ctx, opt.label, 36, y + 5, { size: 8, color: i === picked ? C.sparkGold : C.textMain });
            if (i === picked && opt.correct) R0.text(ctx, '✓', 284, y + 5, { size: 8, align: 'right', color: C.okGreen });
            scene.areas.push({ x: 28, y, w: 264, h: 22, action: 'option', index: i, option: opt });
            y += 26;
          });
          if (picked >= 0) {
            const opt = ch.options[picked], sum = effText(opt.effects);
            const sy = y + 8;
            R0.text(ctx, sum, 36, sy, { size: 8, color: C.textMain });
            if (opt.correct) R0.text(ctx, '✓', 36 + wOf(sum, 8) + 6, sy, { size: 8, color: C.okGreen });
            let ey = sy + 12;
            for (const ln of R0.wrapText(opt.explain || '', 26)) { R0.text(ctx, ln, 28, ey, { size: 7, color: C.textDim }); ey += 10; }
          } else {
            R0.text(ctx, '点击选项作出抉择', 160, 152, { size: 7, align: 'center', color: C.textDim });
          }
        },
        onInput(e) {
          if (closed) return;
          if (e.type === 'tap') {
            const a = hit(scene.areas, e.x, e.y);
            if (!a || a.action !== 'option') return;
            if (a.index === picked) { confirmPick(); return; }   // 再点已选中行=确认
            picked = a.index; play('click');
          } else if (e.type === 'key' && (e.action === 'confirm' || e.action === 'cancel')) {
            confirmPick();
          }
        },
      };
      return scene;
    },

    // 问答卡：逐题作答（每题 create 时 shuffle 一次），结算回调 (right, total)
    quiz(qs, st, onDone) {
      const C = P(), R0 = R();
      const list = (qs || []).map(q => ({ q, s: XH.Overlay.shuffleOptions(q) }));
      let idx = 0, picked = -1, right = 0, closed = false;
      const scene = {
        update() {}, areas: [],
        draw(ctx) {
          R0.px(ctx, 0, 0, 320, 180, C.inkBlack);
          const cur = list[idx];
          if (!cur) return;
          R0.panel(ctx, 16, 12, 288, 156);
          R0.text(ctx, '党史问答 ' + (idx + 1) + '/' + list.length, 160, 20, { size: 8, align: 'center', color: C.sparkGold });
          let y = 36;
          for (const ln of R0.wrapText(cur.q.q, 26)) { R0.text(ctx, ln, 28, y, { size: 8, color: C.textMain }); y += 11; }
          y += 6;
          scene.areas = [];
          cur.s.options.forEach((opt, i) => {
            R0.panel(ctx, 28, y, 264, 18);
            let col = C.textMain;
            if (picked >= 0) {
              if (i === cur.s.answer) { R0.px(ctx, 29, y + 1, 262, 16, 'rgba(39,174,96,0.35)'); col = C.okGreen; }
              else if (i === picked) { R0.px(ctx, 29, y + 1, 262, 16, 'rgba(231,76,60,0.30)'); col = C.flagRed; }
            }
            R0.text(ctx, String.fromCharCode(65 + i) + '. ' + opt, 36, y + 4, { size: 8, color: col });
            scene.areas.push({ x: 28, y, w: 264, h: 18, action: 'option', index: i, correct: i === cur.s.answer });
            y += 20;
          });
          if (picked >= 0) {
            const ok = picked === cur.s.answer;
            R0.text(ctx, ok ? '回答正确' : '回答错误', 28, y + 6, { size: 8, color: ok ? C.okGreen : C.flagRed });
            let ey = y + 17;
            for (const ln of R0.wrapText(cur.q.explain || '', 30)) { R0.text(ctx, ln, 28, ey, { size: 7, color: C.textDim }); ey += 9; }
          } else {
            R0.text(ctx, '点击选项作答', 160, 158, { size: 7, align: 'center', color: C.textDim });
          }
        },
        onInput(e) {
          if (closed) return;
          if (e.type === 'tap') {
            if (picked >= 0) return;                            // 已作答，等 confirm
            const a = hit(scene.areas, e.x, e.y);
            if (!a || a.action !== 'option') return;
            picked = a.index;
            if (a.correct) { right++; play('correct'); } else play('wrong');
          } else if (e.type === 'key' && (e.action === 'confirm' || e.action === 'cancel')) {
            if (picked < 0) return;
            picked = -1; idx++;
            if (idx >= list.length) { closed = true; play('click'); popIfTop(scene); if (onDone) onDone(right, list.length); }
            else play('click');
          }
        },
      };
      return scene;
    },

    // 结算卡：资源变动 + 收录笔记
    summary(node, bonus, onDone) {
      const C = P(), R0 = R();
      let closed = false;
      const scene = {
        update() {}, areas: [],
        draw(ctx) {
          R0.px(ctx, 0, 0, 320, 180, C.inkBlack);
          R0.panel(ctx, 60, 36, 200, 124);
          R0.text(ctx, '节点完成', 160, 46, { size: 12, align: 'center', color: C.sparkGold });
          let y = 70;
          for (const k of Object.keys(RES)) {
            const v = (bonus || {})[k];
            if (!v) continue;
            R0.text(ctx, RES[k], 84, y, { size: 8, color: C.textDim });
            R0.text(ctx, fmtDelta(v), 136, y, { size: 8, color: v > 0 ? C.okGreen : C.flagRed });
            y += 12;
          }
          const nc = node.noteCard || {};
          R0.text(ctx, '已收录党史笔记：' + (nc.title || ''), 160, 122, { size: 7, align: 'center', color: C.textMain });
          R0.text(ctx, '回车 / 点击 继续', 160, 146, { size: 7, align: 'center', color: C.textDim });
        },
        onInput(e) {
          if (closed) return;
          if (e.type !== 'tap' && !(e.type === 'key' && (e.action === 'confirm' || e.action === 'cancel'))) return;
          closed = true; play('click'); popIfTop(scene);
          if (onDone) onDone();
        },
      };
      return scene;
    },

    // 图鉴：14 格网格，已收集可看详情，cancel/confirm 逐层返回
    notebook(st, onDone) {
      const C = P(), R0 = R();
      const nodes = XH.NODES || [];
      const got = id => ((st && st.notebook) || []).includes(id);
      let sub = 'grid', cur = -1, closed = false;
      const backOrClose = () => {
        if (sub === 'detail') { sub = 'grid'; play('click'); }
        else if (!closed) { closed = true; play('click'); popIfTop(scene); if (onDone) onDone(); }
      };
      const scene = {
        update() {}, areas: [],
        draw(ctx) {
          R0.px(ctx, 0, 0, 320, 180, C.inkBlack);
          if (sub === 'grid') {
            const n = nodes.filter(nd => got(nd.id)).length;
            R0.text(ctx, '党史图鉴 ' + n + '/' + nodes.length, 160, 26, { size: 9, align: 'center', color: C.sparkGold });
            scene.areas = [];
            nodes.forEach((nd, i) => {
              const gx = 26 + (i % 7) * 39, gy = 44 + Math.floor(i / 7) * 44;
              if (got(nd.id)) {
                R0.px(ctx, gx, gy, 36, 36, C.sparkGold);
                R0.text(ctx, nd.name.slice(0, 2), gx + 18, gy + 13, { size: 8, align: 'center', color: C.inkBlack, outline: false });
                scene.areas.push({ x: gx, y: gy, w: 36, h: 36, action: 'cell', index: i });
              } else {
                R0.px(ctx, gx, gy, 36, 36, C.uiPanelLight);
                R0.text(ctx, '？', gx + 18, gy + 13, { size: 8, align: 'center', color: C.textDim, outline: false });
              }
            });
            R0.text(ctx, '点击已收集条目查看详情', 160, 168, { size: 7, align: 'center', color: C.textDim });
          } else {
            const nd = nodes[cur] || {}, nc = nd.noteCard || {};
            R0.panel(ctx, 16, 12, 288, 156);
            R0.text(ctx, nc.title || nd.name || '', 28, 20, { size: 10, color: C.sparkGold });
            let y = 40;
            for (const f of (nc.facts || [])) {
              for (const ln of R0.wrapText('· ' + f, 26)) { R0.text(ctx, ln, 28, y, { size: 7, color: C.textMain }); y += 10; }
            }
            y += 3;
            for (const ln of R0.wrapText(nc.story || '', 26)) { R0.text(ctx, ln, 28, y, { size: 7, color: C.textDim }); y += 10; }
            R0.text(ctx, '回车 / Esc 返回网格', 160, 158, { size: 7, align: 'center', color: C.textDim });
          }
        },
        onInput(e) {
          if (closed) return;
          if (e.type === 'tap') {
            if (sub !== 'grid') { sub = 'grid'; play('click'); return; }
            const a = hit(scene.areas, e.x, e.y);
            if (!a || a.action !== 'cell') return;
            cur = a.index; sub = 'detail'; play('click');
          } else if (e.type === 'key' && (e.action === 'confirm' || e.action === 'cancel')) {
            backOrClose();
          }
        },
      };
      return scene;
    },

    // 重整旗鼓：列出已解锁节点（索引 ≤ nodeIndex 且 <14），tap 选择重新出发
    restart(st, onPick) {
      const C = P(), R0 = R();
      const nodes = XH.NODES || [];
      const maxIdx = Math.min((st ? st.nodeIndex : 0), nodes.length - 1, 13);
      let closed = false;
      const scene = {
        update() {}, areas: [],
        draw(ctx) {
          R0.px(ctx, 0, 0, 320, 180, C.inkBlack);
          R0.text(ctx, '重整旗鼓——选择重新出发的节点', 160, 10, { size: 9, align: 'center', color: C.sparkGold });
          scene.areas = [];
          nodes.forEach((nd, i) => {
            if (i > maxIdx) return;
            const gx = 8 + (i % 2) * 156, gy = 28 + Math.floor(i / 2) * 20, en = nd.entry || {};
            R0.panel(ctx, gx, gy, 148, 18);
            R0.text(ctx, nd.name, gx + 6, gy + 2, { size: 8, color: C.textMain });
            R0.text(ctx, '兵' + XH.HUD.fmtTroops(en.troops || 0) + ' 粮' + (en.supply || 0) + ' 气' + (en.morale || 0) + ' 民' + (en.faith || 0),
              gx + 6, gy + 10, { size: 7, color: C.textDim });
            scene.areas.push({ x: gx, y: gy, w: 148, h: 18, action: 'pick', index: i });
          });
          R0.text(ctx, '点击节点卡重新出发', 160, 172, { size: 7, align: 'center', color: C.textDim });
        },
        onInput(e) {
          if (closed) return;
          if (e.type === 'tap') {
            const a = hit(scene.areas, e.x, e.y);
            if (!a || a.action !== 'pick') return;
            closed = true; play('click'); popIfTop(scene);
            if (onPick) onPick(a.index);
          }
        },
      };
      return scene;
    },
  };
})(globalThis.XH = globalThis.XH || {});

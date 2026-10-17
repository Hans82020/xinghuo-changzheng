;(function (XH) {
  // —— 存储：localStorage，缺失时内存降级（Node/受限环境）——
  const memStore = {};
  const ls = (typeof localStorage !== 'undefined') ? localStorage : null;
  XH.Platform = {
    storage: ls ? {
      get: k => { try { return localStorage.getItem(k); } catch { return null; } },
      set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
      remove: k => { try { localStorage.removeItem(k); } catch {} },
    } : {
      get: k => (k in memStore ? memStore[k] : null),
      set: (k, v) => { memStore[k] = v; },
      remove: k => { delete memStore[k]; },
    },
    // —— 音频：WebAudio 合成 8-bit 音效（首次交互后 init）——
    audio: {
      ctx: null,
      init() {
        if (!this.ctx && typeof AudioContext !== 'undefined') {
          this.ctx = new AudioContext();
          if (this.ctx.state === 'suspended') { try { this.ctx.resume(); } catch {} }
        }
      },
      tone(freq, dur, type, vol) {
        if (!this.ctx) return;
        const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = type || 'square'; o.frequency.value = freq;
        g.gain.setValueAtTime(vol || 0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + dur);
      },
      play(name) {
        if (this.ctx && this.ctx.state === 'suspended') { try { this.ctx.resume(); } catch {} }
        const seq = {
          click:[[660,.06]], correct:[[523,.09],[659,.09],[784,.16]],
          wrong:[[196,.18],[147,.22]], march:[[131,.12],[131,.12],[196,.2]],
          victory:[[523,.1],[659,.1],[784,.1],[1047,.3]], save:[[880,.08],[1175,.1]]
        }[name] || [[440,.06]];
        let dt = 0; for (const [f, d] of seq) { setTimeout(() => this.tone(f, d), dt * 1000); dt += d * 0.9; }
      },
    },
    // —— 输入：键盘(方向/WASD/回车/空格) + 指针/触摸 → 统一事件 ——
    input: {
      _cbs: [],
      on(cb) { this._cbs.push(cb); },
      emit(e) { this._cbs.forEach(cb => cb(e)); },
      bindCanvas(canvas) {
        const KEYMAP = { ArrowUp:'up', KeyW:'up', ArrowDown:'down', KeyS:'down', ArrowLeft:'left',
          KeyA:'left', ArrowRight:'right', KeyD:'right', Enter:'confirm', Space:'confirm', Escape:'cancel' };
        addEventListener('keydown', ev => { if (ev.repeat) return; const a = KEYMAP[ev.code]; if (a) { ev.preventDefault(); this.emit({ type:'key', action:a }); } });
        const pt = ev => {
          const r = canvas.getBoundingClientRect();
          this.emit({ type:'tap', x:(ev.clientX - r.left) / r.width * 320, y:(ev.clientY - r.top) / r.height * 180 });
        };
        canvas.addEventListener('pointerdown', pt);
      },
    },
  };
})(globalThis.XH = globalThis.XH || {});

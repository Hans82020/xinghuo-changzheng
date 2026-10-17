;(function (XH) {
  XH.Loop = {
    stack: [], _last: 0, _running: false,
    push(scene) { this.stack.push(scene); if (scene.enter) scene.enter(); },
    pop() { return this.stack.pop(); },
    replace(scene) { this.pop(); this.push(scene); },
    top() { return this.stack[this.stack.length - 1]; },
    handleInput(e) { const s = this.top(); if (s && s.onInput) s.onInput(e); },
    tick(ts) {
      if (!this._running) return;
      try {
        const dt = Math.min(0.1, (ts - this._last) / 1000); this._last = ts;
        const s = this.top();
        if (s && s.update) s.update(dt);
        const cur = this.top(); // update 内可能 replace/pop，重取栈顶再绘制
        const ctx = this._ctx; if (cur && cur.draw && ctx) { ctx.clearRect(0, 0, 320, 180); cur.draw(ctx); }
      } catch (err) { console.error('[XH.Loop] 帧异常', err); }
      finally { requestAnimationFrame(t => this.tick(t)); } // 单帧抛错不永久停转
    },
    start(canvas) {
      this._ctx = canvas.getContext('2d'); this._ctx.imageSmoothingEnabled = false;
      XH.Platform.input.bindCanvas(canvas);
      XH.Platform.input.on(e => this.handleInput(e));
      this._running = true; this._last = performance.now();
      requestAnimationFrame(ts => this.tick(ts));
    },
  };
})(globalThis.XH = globalThis.XH || {});

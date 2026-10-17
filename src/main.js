;(function (XH) {
  // —— 浏览器唯一入口（Node 测试不加载本文件；本文件是唯一允许 document/addEventListener/location 的源码）——
  XH.DEBUG_LOCK = false;
  const canvas = document.getElementById('game');

  // 画布整数倍缩放适配窗口（保持像素风）
  function fit() {
    const s = Math.max(1, Math.floor(Math.min(window.innerWidth / 320, window.innerHeight / 180)));
    canvas.style.width = (320 * s) + 'px';
    canvas.style.height = (180 * s) + 'px';
  }
  window.addEventListener('resize', fit); fit();

  // 调试：?debug=1 时数字键 1~9/0 跳节点（XH.NodeFlow.__jump），F 键切 DEBUG_LOCK（负值归零锁）
  if (/(?:\?|&)debug=1/.test(window.location.search)) {
    window.addEventListener('keydown', e => {
      if (e.key >= '1' && e.key <= '9') XH.NodeFlow.__jump(e.key.charCodeAt(0) - 49);
      else if (e.key === '0') XH.NodeFlow.__jump(9);
      else if (e.code === 'KeyF') XH.DEBUG_LOCK = !XH.DEBUG_LOCK;
    });
  }

  // 首次交互初始化音频（浏览器自动播放策略：需用户手势后才能出声）
  const initAudio = () => {
    XH.Platform.audio.init();
    window.removeEventListener('pointerdown', initAudio);
    window.removeEventListener('keydown', initAudio);
  };
  window.addEventListener('pointerdown', initAudio);
  window.addEventListener('keydown', initAudio);

  XH.Loop.start(canvas);
  XH.Loop.push(XH.Scenes.title());
})(globalThis.XH = globalThis.XH || {});

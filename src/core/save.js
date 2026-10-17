;(function (XH) {
  const KEY = 'xinghuo.save.v1', VER = 1;
  XH.Save = {
    write(storage, st) { storage.set(KEY, JSON.stringify({ v:VER, state:st })); },
    read(storage) {
      try {
        const raw = storage.get(KEY); if (!raw) return null;
        const obj = JSON.parse(raw);
        const s = obj.state;
        if (obj.v !== VER || !s || typeof s.nodeIndex !== 'number') return null;
        if (!Array.isArray(s.notebook)) return null;
        if (!s.mgStars || typeof s.mgStars !== 'object' || Array.isArray(s.mgStars)) return null;
        if (!Number.isFinite(s.quizRight) || !Number.isFinite(s.quizTotal)) return null;
        return s;
      } catch { return null; }
    },
    clear(storage) { storage.remove(KEY); }, VER, KEY
  };
})(globalThis.XH = globalThis.XH || {});

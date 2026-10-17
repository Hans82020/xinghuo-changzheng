;(function (XH) {
  const KEY = 'xinghuo.save.v1', VER = 1;
  XH.Save = {
    write(storage, st) { storage.set(KEY, JSON.stringify({ v:VER, state:st })); },
    read(storage) {
      try {
        const raw = storage.get(KEY); if (!raw) return null;
        const obj = JSON.parse(raw);
        if (obj.v !== VER || !obj.state || typeof obj.state.nodeIndex !== 'number') return null;
        return obj.state;
      } catch { return null; }
    },
    clear(storage) { storage.remove(KEY); }, VER, KEY
  };
})(globalThis.XH = globalThis.XH || {});

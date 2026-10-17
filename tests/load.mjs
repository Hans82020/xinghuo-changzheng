import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function load(rel) {
  const code = readFileSync(path.join(root, rel), 'utf8');
  vm.runInThisContext(code, { filename: rel });
}
export function xh() { return globalThis.XH; }

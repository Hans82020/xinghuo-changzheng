import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, xh } from './load.mjs';

test('save：往返一致；坏档/错版本返回 null 不抛异常', () => {
  load('src/data/palette.js'); load('src/data/nodes.js'); load('src/core/state.js'); load('src/core/save.js');
  const { Save, State, NODES } = xh();
  const mem = {};
  const fakeStorage = { get:k=>mem[k]??null, set:(k,v)=>{mem[k]=String(v);}, remove:k=>{delete mem[k];} };
  const st = State.create(); State.beginNode(st, NODES[0]); st.notebook.push('n01');
  Save.write(fakeStorage, st);
  const st2 = Save.read(fakeStorage);
  assert.equal(st2.troops, st.troops); assert.deepEqual(st2.notebook, ['n01']);
  mem['xinghuo.save.v1'] = '{oops';
  assert.equal(Save.read(fakeStorage), null);
  mem['xinghuo.save.v1'] = JSON.stringify({ v:999, state:{} });
  assert.equal(Save.read(fakeStorage), null);
});

test('save：mgStars 对象经存档往返保留', () => {
  load('src/data/palette.js'); load('src/data/nodes.js'); load('src/core/state.js'); load('src/core/save.js');
  const { Save, State } = xh();
  const mem = {};
  const fakeStorage = { get:k=>mem[k]??null, set:(k,v)=>{mem[k]=String(v);}, remove:k=>{delete mem[k];} };
  const st = State.create(); st.notebook.push('n01'); st.mgStars.n01 = 2;
  Save.write(fakeStorage, st);
  const st2 = Save.read(fakeStorage);
  assert.ok(st2, '合法存档应可读回');
  assert.deepEqual(st2.mgStars, { n01:2 }, 'mgStars 应保留 nodeId 键');
});

test('save：notebook 非数组的存档返回 null', () => {
  load('src/data/palette.js'); load('src/data/nodes.js'); load('src/core/state.js'); load('src/core/save.js');
  const { Save, State } = xh();
  const mem = {};
  const fakeStorage = { get:k=>mem[k]??null, set:(k,v)=>{mem[k]=String(v);}, remove:k=>{delete mem[k];} };
  const st = State.create();
  mem['xinghuo.save.v1'] = JSON.stringify({ v:Save.VER, state:{ ...st, notebook:'n01' } });
  assert.equal(Save.read(fakeStorage), null, 'notebook 为字符串应判为坏档');
});

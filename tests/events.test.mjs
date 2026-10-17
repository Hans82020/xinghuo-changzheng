import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, xh } from './load.mjs';

test('事件表：字段合法、民心门槛有效、效果均为有限整数', () => {
  load('src/data/palette.js'); load('src/data/events.js');
  const E = xh().EVENTS;
  assert.ok(E.length >= 5);
  const RES = ['troops','supply','morale','faith'];
  for (const e of E) {
    assert.ok(e.text.length >= 10);
    assert.ok(e.weight > 0);
    if (e.minFaith !== undefined) assert.ok(e.minFaith >= 0 && e.minFaith <= 100);
    for (const o of e.options) {
      RES.forEach(r => { assert.ok(r in o.effects); assert.ok(Number.isInteger(o.effects[r])); });
      assert.ok(o.explain.length >= 6);
    }
  }
});

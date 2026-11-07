import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWave, enemyPos, WAVE_COUNT } from '../src/waves.js';

test('every wave has pigs with unique ids, positive health and a colour', () => {
  for (let i = 0; i < WAVE_COUNT; i++) {
    const w = makeWave(i);
    assert.ok(w.enemies.length >= 15);
    assert.equal(new Set(w.enemies.map((e) => e.id)).size, w.enemies.length);
    assert.ok(w.enemies.every((e) => e.hp > 0 && e.color));
  }
});

test('waves get harder: more blobs, faster blobs, more aimed shots', () => {
  const ws = [0, 1, 2, 3].map(makeWave);
  for (let i = 1; i < ws.length; i++) {
    assert.ok(ws[i].blobRate > ws[i - 1].blobRate);
    assert.ok(ws[i].blobSpeed > ws[i - 1].blobSpeed);
    assert.ok(ws[i].aimed > ws[i - 1].aimed);
  }
});

test('pigs fly in from above the screen and are on screen once ready', () => {
  for (let i = 0; i < WAVE_COUNT; i++) {
    for (const e of makeWave(i).enemies) {
      assert.ok(enemyPos(e, e.delay).y < -50);
      for (let t = e.delay + 1.6; t < e.delay + 40; t += 0.37) {
        const p = enemyPos(e, t);
        assert.ok(p.ready);
        assert.ok(p.x > 10 && p.x < 350, `wave ${i} x=${p.x}`);
        assert.ok(p.y > 40 && p.y < 340, `wave ${i} y=${p.y}`);
      }
    }
  }
});

test('pigs in a wave never sit on top of each other once settled', () => {
  for (let i = 0; i < WAVE_COUNT; i++) {
    const w = makeWave(i);
    for (const t of [4, 9, 15]) {
      const ps = w.enemies.map((e) => enemyPos(e, t));
      let closest = Infinity;
      for (let a = 0; a < ps.length; a++) for (let b = a + 1; b < ps.length; b++) closest = Math.min(closest, Math.hypot(ps[a].x - ps[b].x, ps[a].y - ps[b].y));
      // the snake crosses itself in the middle of its figure-eight, so allow a brief near-touch there
      assert.ok(closest > (i === 3 ? 7 : 18), `wave ${i} t=${t} closest=${closest.toFixed(1)}`);
    }
  }
});

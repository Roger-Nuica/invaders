import test from 'node:test';
import assert from 'node:assert/strict';
import { createBoss, stepBoss, phaseOf, BOSS_HP, BOSS_INTRO } from '../src/boss.js';
import { mulberry32 } from '../src/math.js';

const ctx = () => ({ shipX: 180, shipY: 560, W: 360, rng: mulberry32(5) });

function run(b, seconds, c = ctx()) {
  const blobs = [];
  const events = [];
  for (let t = 0; t < seconds; t += 1 / 60) {
    const r = stepBoss(b, 1 / 60, c);
    blobs.push(...r.blobs);
    events.push(...r.events);
  }
  return { blobs, events };
}

test('the boss descends during the intro and throws nothing yet', () => {
  const b = createBoss();
  const { blobs } = run(b, BOSS_INTRO - 0.1);
  assert.equal(blobs.length, 0);
  assert.ok(b.y > -220);
  run(b, 0.5);
  assert.ok(Math.abs(b.y - 140) < 1);
});

test('phase follows remaining health', () => {
  const b = createBoss();
  assert.equal(phaseOf(b), 1);
  b.hp = BOSS_HP * 0.5;
  assert.equal(phaseOf(b), 2);
  b.hp = BOSS_HP * 0.2;
  assert.equal(phaseOf(b), 3);
});

test('the boss throws blobs at many different angles and rests between patterns', () => {
  const b = createBoss();
  const { blobs } = run(b, 30);
  assert.ok(blobs.length > 60);
  const angles = new Set(blobs.map((e) => Math.round(Math.atan2(e.vy, e.vx) * 4)));
  assert.ok(angles.size >= 6, `only ${angles.size} distinct angles`);
  assert.ok(b.pat === null || b.patT < 4);
});

test('dropping below a health threshold announces the new phase and the next pattern set starts', () => {
  const b = createBoss();
  run(b, BOSS_INTRO + 0.2);
  b.hp = BOSS_HP * 0.6;
  const { events } = run(b, 0.1);
  assert.deepEqual(events.map((e) => e.type), ['bossPhase']);
  assert.equal(b.phase, 2);
  b.hp = BOSS_HP * 0.2;
  assert.equal(run(b, 0.1).events[0].phase, 3);
});

test('phase 3 includes blobs that split in three', () => {
  const b = createBoss();
  b.hp = BOSS_HP * 0.1;
  const { blobs } = run(b, 40);
  assert.ok(blobs.some((e) => e.kind === 'big'));
});

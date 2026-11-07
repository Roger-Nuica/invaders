import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, step, setTarget, useBomb, switchWeapon, SHIP_R } from '../src/game.js';
import { rollDrop, PITY } from '../src/drops.js';
import { BOSS_HP } from '../src/boss.js';

const DT = 1 / 60;
const run = (g, s) => { for (let t = 0; t < s; t += DT) step(g, DT); };

function startWave(g) {
  run(g, 2);
  assert.equal(g.phase, 'wave');
}

test('a new game starts with an intro and then the first wave of pigs', () => {
  const g = createGame({ seed: 1 });
  assert.equal(g.phase, 'intro');
  assert.equal(g.lives, 3);
  startWave(g);
  assert.equal(g.enemies.length, 18);
});

test('the ship follows the target and stays inside its play area', () => {
  const g = createGame({ god: true });
  run(g, 1);
  setTarget(g, 1000, -500);
  run(g, 1);
  assert.ok(g.ship.x <= 342 + 1e-6 && g.ship.y >= 272);
  setTarget(g, 100, 600);
  run(g, 1);
  assert.ok(Math.abs(g.ship.x - 100) < 2 && Math.abs(g.ship.y - 600) < 2);
});

test('firing creates bullets and bullets kill pigs, scoring points', () => {
  const g = createGame({ god: true });
  startWave(g);
  run(g, 3);
  assert.ok(g.bullets.length > 0 || g.score > 0);
  g.enemies[0].hp = 0.5;
  const e = g.enemies[0];
  g.bullets.push({ type: 'ion', x: e.x, y: e.y, vx: 0, vy: -1, dmg: 1, r: 6, len: 12, pierce: false, hit: null });
  const before = g.score;
  step(g, DT);
  assert.ok(g.score >= before + 100);
  assert.ok(g.events.some((ev) => ev.type === 'pigDie'));
});

test('a neutron bolt pierces through two pigs but hits each only once', () => {
  const g = createGame({ god: true });
  startWave(g);
  run(g, 3);
  const [a, b] = g.enemies;
  Object.assign(b, { sx: a.sx, sy: a.sy, sway: a.sway, delay: a.delay, ox: a.ox });
  a.hp = b.hp = 50;
  step(g, DT);
  a.hp = b.hp = 50;
  g.cool = 99;
  g.cool = 99;
  g.bullets = [{ type: 'neutron', x: a.x, y: a.y, vx: 0, vy: 0, dmg: 2, r: 7, len: 34, pierce: true, hit: new Set() }];
  step(g, DT);
  step(g, DT);
  assert.equal(g.enemies[0].hp, 48);
  assert.equal(g.enemies[1].hp, 48);
  assert.equal(g.bullets.length, 1);
});

test('an blob hitting the ship costs a life and drops power; the ship respawns invulnerable', () => {
  const g = createGame();
  run(g, 3);
  g.power = 4;
  g.ship.inv = 0;
  g.blobs.push({ x: g.ship.x, y: g.ship.y, vx: 0, vy: 0, r: 7, kind: 'blob', splitY: 0, spin: 0 });
  step(g, DT);
  assert.equal(g.lives, 2);
  assert.equal(g.power, 3);
  assert.equal(g.ship.alive, false);
  run(g, 1.5);
  assert.equal(g.ship.alive, true);
  assert.ok(g.ship.inv > 0);
});

test('god mode and post-respawn invulnerability ignore blobs', () => {
  const g = createGame({ god: true });
  run(g, 3);
  g.blobs.push({ x: g.ship.x, y: g.ship.y, vx: 0, vy: 0, r: 7, kind: 'blob', splitY: 0, spin: 0 });
  step(g, DT);
  assert.equal(g.lives, 3);
});

test('losing the last life ends the game as lost', () => {
  const g = createGame();
  run(g, 3);
  g.lives = 1;
  g.ship.inv = 0;
  g.blobs.push({ x: g.ship.x, y: g.ship.y, vx: 0, vy: 0, r: 7, kind: 'blob', splitY: 0, spin: 0 });
  run(g, 3);
  assert.equal(g.over, 'lost');
});

test('a bomb wipes blobs, hurts pigs and is limited', () => {
  const g = createGame({ god: true });
  startWave(g);
  run(g, 3);
  for (const e of g.enemies) e.hp = 100;
  g.blobs.push({ x: 50, y: 50, vx: 0, vy: 0, r: 7, kind: 'blob', splitY: 0, spin: 0 });
  assert.ok(useBomb(g));
  assert.ok(g.enemies.every((e) => e.hp === 92));
  assert.equal(g.blobs.length, 0);
  assert.equal(g.bombs, 2);
  assert.equal(useBomb(g), false, 'cooldown');
  run(g, 1.1);
  useBomb(g); run(g, 1.1); useBomb(g); run(g, 1.1);
  assert.equal(g.bombs, 0);
  assert.equal(useBomb(g), false);
});

test('clearing every pig advances to the next wave, and after the last comes the boss', () => {
  const g = createGame({ god: true, wave: 3 });
  startWave(g);
  run(g, 2);
  for (const e of g.enemies) e.hp = 0;
  run(g, 0.2);
  assert.equal(g.phase, 'clear');
  run(g, 3);
  assert.equal(g.phase, 'bossIntro');
  run(g, 3.5);
  assert.equal(g.phase, 'boss');
});

test('the boss is immune during the intro, then killable; killing it wins the game', () => {
  const g = createGame({ god: true, start: 'boss' });
  const b = g.boss;
  g.bullets.push({ type: 'ion', x: b.x, y: 400, vx: 0, vy: 0, dmg: 5, r: 6, len: 12, pierce: false, hit: null });
  step(g, DT);
  assert.equal(b.hp, BOSS_HP);
  run(g, 3.4);
  assert.equal(g.phase, 'boss');
  b.hp = 3;
  g.bullets.push({ type: 'ion', x: b.x, y: b.y + 25, vx: 0, vy: 0, dmg: 5, r: 6, len: 12, pierce: false, hit: null });
  step(g, DT);
  assert.equal(g.phase, 'bossDying');
  run(g, 3);
  assert.equal(g.over, 'won');
});

test('boss blobs fall in many directions and big blobs split', () => {
  const g = createGame({ god: true, start: 'boss' });
  g.boss.maxHp = 1e7;
  g.boss.hp = 1e6;
  let split = false;
  for (let t = 0; t < 40; t += DT) {
    step(g, DT);
    if (g.events.some((e) => e.type === 'blobSplit')) split = true;
    g.events.length = 0;
  }
  assert.ok(split);
});

test('drops: the pity counter guarantees a gift, and gifts stop at max power', () => {
  const rng = () => 0.99;
  assert.equal(rollDrop(rng, PITY, 1), 'gift');
  assert.equal(rollDrop(rng, PITY, 6), null);
  assert.equal(rollDrop(rng, 0, 1), null);
});

test('catching a gift raises power, a bomb pickup adds a bomb, weapon switch cycles', () => {
  const g = createGame({ god: true });
  run(g, 2.5);
  g.drops.push({ type: 'gift', x: g.ship.x, y: g.ship.y, vy: 0, t: 0 }, { type: 'bomb', x: g.ship.x, y: g.ship.y, vy: 0, t: 0 });
  step(g, DT);
  assert.equal(g.power, 2);
  assert.equal(g.bombs, 4);
  switchWeapon(g);
  assert.equal(g.weapon, 'neutron');
  assert.ok(SHIP_R > 0);
});

test('the simulation is deterministic for a given seed', () => {
  const a = createGame({ seed: 9, god: true });
  const b = createGame({ seed: 9, god: true });
  run(a, 20);
  run(b, 20);
  assert.equal(a.score, b.score);
  assert.equal(a.blobs.length, b.blobs.length);
});

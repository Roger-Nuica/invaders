// Game rules: one `step(g, dt)` advances the whole world. No DOM in here.
// The renderer/audio read `g.events` (and clear it) to know what just happened.

import { mulberry32, clamp, circlesHit } from './math.js';
import { fire, cooldownOf, nextWeapon, MAX_POWER } from './weapons.js';
import { makeWave, enemyPos, WAVE_COUNT, PIG_R } from './waves.js';
import { createBoss, stepBoss, bossCircles, makeBlob, BOSS_INTRO } from './boss.js';
import { rollDrop, DROP_VALUES } from './drops.js';

export const W = 360;
export const SHIP_R = 6;
export const START_LIVES = 3;
export const START_BOMBS = 3;
const MAX_BLOBS = 70;

/** opts: { seed, H, god, start: 'wave' | 'boss', wave } */
export function createGame(opts = {}) {
  const H = opts.H ?? 640;
  const g = {
    W, H, rng: mulberry32(opts.seed ?? 1), t: 0,
    phase: 'intro', phaseT: 0, wave: opts.wave ?? 0, waveData: null, wt: 0,
    enemies: [], bullets: [], blobs: [], drops: [], boss: null, events: [],
    score: 0, lives: START_LIVES, bombs: START_BOMBS, power: 1, weapon: 'ion',
    cool: 0, bombCd: 0, sinceGift: 0, kills: 0, god: !!opts.god, over: null, endT: 0,
    target: { x: W / 2, y: H - 120 },
    ship: { x: W / 2, y: H + 50, alive: true, inv: 2, respawn: 0 },
  };
  if (opts.start === 'boss') g.power = 4;
  enter(g, opts.start === 'boss' ? 'bossIntro' : 'intro');
  return g;
}

const shipMinY = (g) => Math.max(272, g.H * 0.4);

function enter(g, phase) {
  g.phase = phase;
  g.phaseT = 0;
  if (phase === 'intro') g.events.push({ type: 'banner', text: `Valul ${g.wave + 1}`, sub: 'Pregătiți-vă!' });
  if (phase === 'wave') {
    g.waveData = makeWave(g.wave);
    g.enemies = g.waveData.enemies.map((e) => ({ ...e, x: 180, y: -100, ready: false, flash: 0, maxHp: e.hp, r: PIG_R }));
    g.wt = 0;
  }
  if (phase === 'clear') g.events.push({ type: 'banner', text: 'Val învins!', sub: '' });
  if (phase === 'bossIntro') {
    g.boss = createBoss();
    g.events.push({ type: 'banner', text: 'ATENȚIE!', sub: 'Porcul Uriaș se apropie', boss: true });
    g.events.push({ type: 'bossWarn' });
  }
}

export function setTarget(g, x, y) {
  g.target.x = clamp(x, 22, W - 22);
  g.target.y = clamp(y, shipMinY(g), g.H - 36);
}

export function switchWeapon(g, to) {
  g.weapon = to ?? nextWeapon(g.weapon);
  g.events.push({ type: 'weapon', weapon: g.weapon });
}

export function useBomb(g) {
  if (g.over || g.bombs <= 0 || g.bombCd > 0 || !g.ship.alive) return false;
  if (g.phase !== 'wave' && g.phase !== 'boss') return false;
  g.bombs--;
  g.bombCd = 1;
  g.ship.inv = Math.max(g.ship.inv, 1.2);
  g.events.push({ type: 'bomb', x: g.ship.x, y: g.ship.y });
  g.blobs.length = 0;
  for (const e of g.enemies) damageEnemy(g, e, 8);
  if (g.boss && g.phase === 'boss') damageBoss(g, 45);
  return true;
}

function damageEnemy(g, e, dmg) {
  if (e.hp <= 0) return;
  e.hp -= dmg;
  e.flash = 0.08;
  if (e.hp > 0) return;
  g.kills++;
  g.score += 100;
  g.sinceGift++;
  g.events.push({ type: 'pigDie', x: e.x, y: e.y, color: e.color });
  g.events.push({ type: 'score', x: e.x, y: e.y, v: 100 });
  const d = rollDrop(g.rng, g.sinceGift, g.power);
  if (d) {
    if (d === 'gift') g.sinceGift = 0;
    g.drops.push({ type: d, x: e.x, y: e.y, vy: 80 + g.rng() * 20, t: 0 });
  }
}

function damageBoss(g, dmg) {
  const b = g.boss;
  if (!b || b.dead || b.t < BOSS_INTRO) return;
  b.hp -= dmg;
  b.flash = 0.07;
  g.score += Math.round(dmg * 2);
  if (b.hp <= 0) {
    b.hp = 0;
    b.dead = true;
    g.blobs.length = 0;
    g.bullets.length = 0;
    g.score += 5000;
    g.events.push({ type: 'bossDie', x: b.x, y: b.y });
    enter(g, 'bossDying');
  }
}

function killShip(g) {
  const s = g.ship;
  s.alive = false;
  s.respawn = 1.3;
  g.lives--;
  g.power = Math.max(1, g.power - 1);
  g.events.push({ type: 'shipDie', x: s.x, y: s.y });
  if (g.lives <= 0) g.endT = 1.8;
}

function stepShip(g, dt) {
  const s = g.ship;
  s.inv = Math.max(0, s.inv - dt);
  g.bombCd = Math.max(0, g.bombCd - dt);
  if (!s.alive) {
    if (g.lives <= 0) {
      g.endT -= dt;
      if (g.endT <= 0 && !g.over) {
        g.over = 'lost';
        g.events.push({ type: 'over', result: 'lost' });
      }
      return;
    }
    s.respawn -= dt;
    if (s.respawn <= 0) {
      s.alive = true;
      s.x = W / 2;
      s.y = g.H + 50;
      s.inv = 2.6;
      g.blobs = g.blobs.filter((e) => Math.hypot(e.x - W / 2, e.y - (g.H - 110)) > 130);
    }
    return;
  }
  const k = 1 - Math.exp(-16 * dt);
  const maxStep = 1500 * dt;
  const dx = (g.target.x - s.x) * k;
  const dy = (g.target.y - s.y) * k;
  const d = Math.hypot(dx, dy);
  const f = d > maxStep ? maxStep / d : 1;
  s.x += dx * f;
  s.y += dy * f;
  s.x = clamp(s.x, 18, W - 18);
  s.y = Math.min(s.y, g.H - 28);
}

function stepFire(g, dt) {
  const s = g.ship;
  g.cool -= dt;
  if (!s.alive || g.phase === 'bossDying' || g.cool > 0) return;
  g.cool = cooldownOf(g.weapon);
  const vs = fire(g.weapon, g.power, s.x, s.y - 24, g.rng);
  for (const b of vs) g.bullets.push(b);
  g.events.push({ type: 'shoot', weapon: g.weapon });
}

function blobFromPig(g, e) {
  const wv = g.waveData;
  const aimedShot = g.ship.alive && g.rng() < wv.aimed;
  const a = aimedShot ? Math.atan2(g.ship.y - e.y, g.ship.x - e.x) : Math.PI / 2 + (g.rng() - 0.5) * 0.18;
  g.blobs.push(makeBlob(e.x, e.y + 14, a, wv.blobSpeed * (aimedShot ? 1.05 : 1)));
}

function stepEnemies(g, dt) {
  g.wt += dt;
  const aliveReady = g.enemies.filter((e) => e.hp > 0).length || 1;
  // keep the total blob rate steady as the wave thins out a bit
  const rate = g.waveData.blobRate * (1 + 0.8 * (1 - aliveReady / g.waveData.enemies.length));
  for (const e of g.enemies) {
    if (e.hp <= 0) continue;
    const p = enemyPos(e, g.wt);
    e.x = p.x;
    e.y = p.y;
    e.ready = p.ready;
    e.flash = Math.max(0, e.flash - dt);
    if (p.ready && g.blobs.length < MAX_BLOBS && g.rng() < rate * dt) blobFromPig(g, e);
  }
}

function stepBlobs(g, dt) {
  const out = [];
  for (const e of g.blobs) {
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    e.spin += dt * (e.kind === 'big' ? 2 : 4);
    if (e.kind === 'big' && e.y >= e.splitY) {
      g.events.push({ type: 'blobSplit', x: e.x, y: e.y });
      for (const d of [-0.5, 0, 0.5]) out.push(makeBlob(e.x, e.y, Math.PI / 2 + d, 170));
      continue;
    }
    if (e.y > g.H - 8) {
      g.events.push({ type: 'blobSplat', x: e.x, y: g.H - 6, big: e.kind === 'big' });
      continue;
    }
    if (e.x < -30 || e.x > W + 30 || e.y < -40) continue;
    out.push(e);
  }
  g.blobs = out;
}

function stepBullets(g, dt) {
  const live = [];
  for (const b of g.bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.y < -40 || b.x < -20 || b.x > W + 20) continue;
    let used = false;
    for (const e of g.enemies) {
      if (e.hp <= 0 || !circlesHit(b.x, b.y, b.r, e.x, e.y, e.r)) continue;
      if (b.pierce) {
        if (b.hit.has(e.id)) continue;
        b.hit.add(e.id);
        damageEnemy(g, e, b.dmg);
        g.events.push({ type: 'hit', x: b.x, y: b.y, weapon: b.type });
      } else {
        damageEnemy(g, e, b.dmg);
        g.events.push({ type: 'hit', x: b.x, y: b.y, weapon: b.type });
        used = true;
        break;
      }
    }
    if (!used && g.boss && g.phase === 'boss') {
      for (const c of bossCircles(g.boss)) {
        if (!circlesHit(b.x, b.y, b.r, c.x, c.y, c.r)) continue;
        if (b.pierce) {
          if (b.hit.has('boss')) break;
          b.hit.add('boss');
        } else used = true;
        damageBoss(g, b.dmg);
        g.events.push({ type: 'hit', x: b.x, y: b.y, weapon: b.type, boss: true });
        break;
      }
    }
    if (!used) live.push(b);
  }
  g.bullets = live;
}

function stepDrops(g, dt) {
  const s = g.ship;
  const out = [];
  for (const d of g.drops) {
    d.t += dt;
    d.y += d.vy * dt;
    if (s.alive && circlesHit(d.x, d.y, 14, s.x, s.y, 24)) {
      if (d.type === 'gift') {
        g.power = Math.min(MAX_POWER, g.power + 1);
        g.score += 150;
      } else if (d.type === 'bomb') g.bombs = Math.min(9, g.bombs + 1);
      else g.score += DROP_VALUES.sausage;
      g.events.push({ type: 'pickup', kind: d.type, x: d.x, y: d.y });
      continue;
    }
    if (d.y < g.H + 30) out.push(d);
  }
  g.drops = out;
}

function shipCollisions(g) {
  const s = g.ship;
  if (!s.alive || s.inv > 0 || g.god) return;
  let hit = false;
  for (const e of g.blobs) if (circlesHit(e.x, e.y, e.r - 1, s.x, s.y, SHIP_R)) { hit = true; break; }
  if (!hit) for (const e of g.enemies) if (e.hp > 0 && circlesHit(e.x, e.y, e.r - 3, s.x, s.y, SHIP_R)) { hit = true; break; }
  if (!hit && g.boss && g.phase === 'boss') for (const c of bossCircles(g.boss)) if (circlesHit(c.x, c.y, c.r - 6, s.x, s.y, SHIP_R)) { hit = true; break; }
  if (hit) killShip(g);
}

export function step(g, dt) {
  if (g.over) return;
  g.t += dt;
  g.phaseT += dt;
  stepShip(g, dt);
  stepFire(g, dt);

  switch (g.phase) {
    case 'intro':
      if (g.phaseT > 1.8) enter(g, 'wave');
      break;
    case 'wave':
      stepEnemies(g, dt);
      break;
    case 'clear':
      if (g.phaseT > 2.4) {
        g.wave++;
        enter(g, g.wave >= WAVE_COUNT ? 'bossIntro' : 'intro');
      }
      break;
    case 'bossIntro':
    case 'boss': {
      const r = stepBoss(g.boss, dt, { shipX: g.ship.x, shipY: g.ship.y, W, rng: g.rng });
      for (const e of r.blobs) if (g.blobs.length < MAX_BLOBS * 2) g.blobs.push(e);
      for (const ev of r.events) g.events.push(ev);
      if (g.phase === 'bossIntro' && g.phaseT > BOSS_INTRO) enter(g, 'boss');
      break;
    }
    case 'bossDying':
      if (g.phaseT > 2.8) {
        g.over = 'won';
        g.events.push({ type: 'over', result: 'won' });
      }
      break;
  }

  stepBullets(g, dt);
  stepBlobs(g, dt);
  stepDrops(g, dt);
  shipCollisions(g);

  if (g.phase === 'wave' && g.wt > 1 && g.enemies.every((e) => e.hp <= 0)) enter(g, 'clear');
}

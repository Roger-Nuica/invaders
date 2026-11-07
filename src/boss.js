// The giant pig. Three phases (by remaining health), each with its own blob
// patterns. Between two patterns the boss rests, which is when you can hit it
// freely. Blobs are returned by stepBoss; the game owns them afterwards.

import { easeOut } from './math.js';

export const BOSS_HP = 620;
export const BOSS_INTRO = 3.2;
const HALF_PI = Math.PI / 2;

const PATTERNS = {
  1: ['fan', 'sweep', 'fan'],
  2: ['spiral', 'fan', 'spiralBack', 'aimed'],
  3: ['rain', 'splitter', 'spiralFast', 'aimed', 'rain'],
};
const REST = { 1: 1.5, 2: 1.1, 3: 0.75 };
const DURATION = { fan: 1.7, sweep: 2.2, spiral: 2.6, spiralBack: 2.6, spiralFast: 2.4, aimed: 2.4, rain: 3, splitter: 2.4 };

export function createBoss() {
  return {
    x: 180, y: -220, hp: BOSS_HP, maxHp: BOSS_HP, phase: 1, t: 0,
    pat: null, patT: 0, patIdx: 0, rest: 1.2, acc: 0, volley: 0, angle: 0, flash: 0, dead: false,
  };
}

export const phaseOf = (b) => {
  const f = b.hp / b.maxHp;
  return f > 0.66 ? 1 : f > 0.33 ? 2 : 3;
};

/** Hit circles of the boss body, in world coordinates. */
export const bossCircles = (b) => [
  { x: b.x, y: b.y + 25, r: 88 },
  { x: b.x, y: b.y - 62, r: 40 },
];

export const makeBlob = (x, y, angle, speed, kind = 'blob') => ({
  x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
  r: kind === 'big' ? 14 : 7, kind, splitY: 0, spin: 0,
});

/** Advance the boss by dt. ctx = { shipX, shipY, W, rng }. Returns { blobs, events }. */
export function stepBoss(b, dt, ctx) {
  const blobs = [];
  const events = [];
  b.t += dt;
  b.flash = Math.max(0, b.flash - dt);
  const intro = b.t < BOSS_INTRO;
  b.y = intro ? -220 + 360 * easeOut(b.t / BOSS_INTRO) : 140;
  const amp = [0, 30, 45, 55][b.phase];
  b.x = ctx.W / 2 + (intro ? 0 : amp * Math.sin((b.t - BOSS_INTRO) * (0.5 + 0.2 * b.phase)));
  if (intro) return { blobs, events };

  const ph = phaseOf(b);
  if (ph !== b.phase) {
    b.phase = ph;
    b.pat = null;
    b.rest = 1.8;
    b.patIdx = 0;
    events.push({ type: 'bossPhase', phase: ph });
  }

  if (!b.pat) {
    b.rest -= dt;
    if (b.rest <= 0) {
      const list = PATTERNS[b.phase];
      b.pat = list[b.patIdx % list.length];
      b.patIdx++;
      b.patT = 0;
      b.acc = 0;
      b.volley = 0;
      b.angle = ctx.rng() * 6;
    }
    return { blobs, events };
  }

  const ox = b.x;
  const oy = b.y + 78;
  b.patT += dt;
  b.acc += dt;
  const emit = (a, speed, kind) => blobs.push(makeBlob(ox, oy, a, speed, kind));
  const toShip = () => Math.atan2(ctx.shipY - oy, ctx.shipX - ox);
  const every = (step, fn) => {
    while (b.acc >= step) {
      b.acc -= step;
      fn();
    }
  };

  switch (b.pat) {
    case 'fan': {
      // three volleys of seven blobs, each volley offset by half a gap
      while (b.volley < 3 && b.patT >= b.volley * 0.5) {
        for (let i = -3; i <= 3; i++) emit(HALF_PI + i * 0.28 + (b.volley % 2 ? 0.14 : 0), 150);
        b.volley++;
      }
      break;
    }
    case 'sweep':
      every(0.1, () => emit(HALF_PI + 0.8 * Math.sin(b.patT * 3), 165));
      break;
    case 'spiral':
    case 'spiralBack':
    case 'spiralFast': {
      const dir = b.pat === 'spiralBack' ? -1 : 1;
      const step = b.pat === 'spiralFast' ? 0.085 : 0.11;
      every(step, () => {
        b.angle += dir * (b.pat === 'spiralFast' ? 0.62 : 0.5);
        emit(b.angle, 140);
        emit(b.angle + Math.PI, 140);
      });
      break;
    }
    case 'rain':
      every(0.17, () => blobs.push(makeBlob(20 + ctx.rng() * (ctx.W - 40), -10, HALF_PI + (ctx.rng() - 0.5) * 0.2, 165 + ctx.rng() * 40)));
      break;
    case 'splitter':
      while (b.volley < 2 && b.patT >= b.volley * 1.1) {
        const e = makeBlob(ox, oy, toShip(), 105, 'big');
        e.splitY = 240 + ctx.rng() * 90;
        blobs.push(e);
        b.volley++;
      }
      break;
    case 'aimed':
      while (b.volley < 3 && b.patT >= b.volley * 0.8) {
        const a = toShip();
        for (const d of [-0.18, 0, 0.18]) emit(a + d, 235);
        b.volley++;
      }
      break;
  }
  if (b.patT >= DURATION[b.pat]) {
    b.pat = null;
    b.rest = REST[b.phase];
  }
  return { blobs, events };
}

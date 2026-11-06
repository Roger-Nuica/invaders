// The hen waves. Each hen flies in from above to its slot, then follows a
// deterministic path of the wave time `t`, so positions need no per-frame state.

import { clamp, easeOut } from './math.js';

export const WAVE_COUNT = 4;
export const HEN_COLORS = ['red', 'blue', 'green', 'yellow', 'purple'];
export const HEN_R = 16;
const CX = 180;

/**
 * Build wave `i` (0-based). Returns the hens plus how the wave shoots:
 * eggRate = eggs per hen per second, aimed = share of eggs thrown at the ship,
 * eggSpeed = fall speed in px/s.
 */
export function makeWave(i) {
  const enemies = [];
  const add = (e) => enemies.push({ hp: 3, color: 'red', ...e });
  let cfg;
  if (i === 0) {
    cfg = { name: 'Valul 1', eggRate: 0.07, aimed: 0.1, eggSpeed: 125 };
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 6; c++) {
        add({ kind: 'grid', sx: CX + (c - 2.5) * 44, sy: 112 + r * 50, sway: 34, delay: (r * 6 + c) * 0.09, ox: c < 3 ? -140 : 140, color: HEN_COLORS[r], hp: 3 });
      }
    }
  } else if (i === 1) {
    cfg = { name: 'Valul 2', eggRate: 0.085, aimed: 0.2, eggSpeed: 140 };
    for (let layer = 0; layer < 2; layer++) {
      for (let k = -4; k <= 4; k++) {
        add({ kind: 'grid', sx: CX + k * 32, sy: 244 - Math.abs(k) * 26 - layer * 38, sway: 26, delay: (k + 4) * 0.1 + layer * 0.5, ox: k < 0 ? -160 : 160, color: HEN_COLORS[(layer * 2 + 1) % 5], hp: 4 });
      }
    }
  } else if (i === 2) {
    cfg = { name: 'Valul 3', eggRate: 0.095, aimed: 0.25, eggSpeed: 150 };
    const ring = (n, rad, dir, color, hp, delay0) => {
      for (let k = 0; k < n; k++) {
        add({ kind: 'ring', a0: (k / n) * Math.PI * 2, rad, dir, spd: 0.5, cy: 215, delay: delay0 + k * 0.12, ox: Math.cos(k) * 120, color, hp });
      }
    };
    ring(12, 120, 1, 'green', 4, 0);
    ring(7, 66, -1, 'purple', 5, 1.2);
  } else {
    cfg = { name: 'Valul 4', eggRate: 0.11, aimed: 0.3, eggSpeed: 160 };
    for (let k = 0; k < 18; k++) {
      add({ kind: 'snake', k, delay: k * 0.18, ox: k % 2 ? -150 : 150, color: HEN_COLORS[k % 5], hp: 5 });
    }
  }
  enemies.forEach((e, idx) => (e.id = idx + 1));
  return { index: i, ...cfg, enemies };
}

/** Where hen `e` is at wave time `t`. `ready` = it has finished flying in. */
export function enemyPos(e, t) {
  const p = clamp((t - e.delay) / 1.5, 0, 1);
  const off = 1 - easeOut(p);
  let x;
  let y;
  if (e.kind === 'grid') {
    x = e.sx + e.sway * Math.sin(t * 0.9);
    y = e.sy + 6 * Math.sin(t * 1.7 + e.sx * 0.05) + Math.min(t * 1.5, 26);
  } else if (e.kind === 'ring') {
    const a = e.a0 + e.dir * t * e.spd;
    x = CX + e.rad * Math.cos(a);
    y = e.cy + e.rad * 0.78 * Math.sin(a);
  } else {
    const u = t * 0.85 - e.k * 0.35;
    x = CX + 125 * Math.sin(u);
    y = 215 + 85 * Math.sin(2 * u);
  }
  return { x: x + e.ox * off, y: y - 460 * off, ready: p >= 1 };
}

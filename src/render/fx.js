// Visual effects driven by game events: bacon, puffs, sparks, smoke, rings, mud
// splats, floating score text, screen shake and flashes.

import { blit } from './sprites.js';
import { OUTFITS } from './pig.js';

const MAX_PARTICLES = 420;

export function createFx() {
  const parts = [];
  const splats = [];
  const timers = [];
  const fx = {
    shake: 0,
    flash: 0,
    flashColor: '255,255,255',
    parts,
    reset() {
      parts.length = 0;
      splats.length = 0;
      timers.length = 0;
      fx.shake = 0;
      fx.flash = 0;
    },
  };
  const rnd = (a, b) => a + Math.random() * (b - a);

  function add(p) {
    if (parts.length > MAX_PARTICLES) parts.shift();
    parts.push({ rot: 0, vr: 0, g: 0, drag: 0, size: 3, color: '#fff', ...p, age: 0 });
  }
  const sparks = (x, y, n, colors, speed = 220, life = 0.6, size = 3) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283;
      const s = rnd(speed * 0.25, speed);
      add({ type: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(life * 0.5, life), size: rnd(size * 0.6, size), color: colors[(Math.random() * colors.length) | 0], drag: 2.2 });
    }
  };
  const ring = (x, y, r1, color = '255,255,255', life = 0.45, width = 4) => add({ type: 'ring', x, y, r: 4, r1, life, color, size: width });
  const smoke = (x, y, n, big = 1) => {
    for (let i = 0; i < n; i++) add({ type: 'smoke', x: x + rnd(-8, 8), y: y + rnd(-8, 8), vx: rnd(-30, 30), vy: rnd(-50, 10), life: rnd(0.6, 1.2), size: rnd(8, 16) * big, drag: 1.2 });
  };
  // a pig pops: bacon strips, pink puffs and its propeller hat flying off
  const feathers = (x, y, n, tint) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283;
      const bacon = Math.random() < 0.45;
      add({
        type: bacon ? 'bacon' : 'puff', x, y, vx: Math.cos(a) * rnd(50, 190), vy: Math.sin(a) * rnd(50, 190) - 60,
        life: rnd(0.9, 1.5), size: bacon ? rnd(7, 11) : rnd(4, 8), color: tint && Math.random() < 0.3 ? tint : '#ff9dba',
        g: 260, drag: 1.1, rot: Math.random() * 6.283, vr: rnd(-8, 8),
      });
    }
  };
  const OINKS = ['OINK!', 'GROH!', 'GUIȚ!', 'HRU!', 'BUF!'];

  const boom = (x, y, scale = 1) => {
    sparks(x, y, 26 * scale, ['#fff2a8', '#ffb23a', '#ff6a1a', '#ff3b1a'], 300 * scale, 0.8, 4);
    smoke(x, y, 6 * scale, scale);
    ring(x, y, 46 * scale, '255,200,90', 0.5, 5);
    add({ type: 'blast', x, y, life: 0.35, size: 26 * scale });
  };

  fx.handle = (ev, g) => {
    switch (ev.type) {
      case 'pigDie': {
        const c = OUTFITS[ev.color];
        feathers(ev.x, ev.y, 12, c?.mid);
        if (Math.random() < 0.3) add({ type: 'text', x: ev.x, y: ev.y - 26, vx: 0, vy: -34, life: 0.9, size: 13, color: '#ffb0cc', text: OINKS[(Math.random() * OINKS.length) | 0] });
        sparks(ev.x, ev.y, 7, ['#fff', '#ffe08a'], 200, 0.4, 3);
        ring(ev.x, ev.y, 26, '255,255,255', 0.3, 3);
        fx.shake = Math.max(fx.shake, 1.2);
        break;
      }
      case 'score':
        add({ type: 'text', x: ev.x, y: ev.y - 12, vx: 0, vy: -46, life: 0.8, text: `+${ev.v}`, size: 13, color: '#ffe88a' });
        break;
      case 'hit': {
        const col = ev.weapon === 'neutron' ? ['#b6ffc0', '#fff'] : ev.weapon === 'vulcan' ? ['#ffd070', '#fff'] : ['#a8e6ff', '#fff'];
        sparks(ev.x, ev.y, ev.boss ? 3 : 2, col, 120, 0.25, 2.4);
        break;
      }
      case 'blobSplat': {
        splats.push({ x: ev.x, y: g.H - 8, age: 0, life: 3.2, big: ev.big });
        if (splats.length > 14) splats.shift();
        for (let i = 0; i < (ev.big ? 9 : 5); i++) add({ type: 'drop', x: ev.x, y: g.H - 8, vx: rnd(-90, 90), vy: rnd(-170, -60), life: rnd(0.4, 0.8), size: rnd(2, 4), color: ev.big ? (Math.random() < 0.5 ? '#e8281c' : '#ff8a6a') : (Math.random() < 0.5 ? '#7a4a24' : '#b98a5a'), g: 600 });
        break;
      }
      case 'blobSplit':
        ring(ev.x, ev.y, 34, '255,210,80', 0.35, 4);
        sparks(ev.x, ev.y, 12, ['#fff2a8', '#ffc928'], 200, 0.45, 3);
        break;
      case 'shipDie':
        boom(ev.x, ev.y, 1.6);
        fx.shake = 11;
        fx.flash = 0.45;
        fx.flashColor = '255,170,80';
        break;
      case 'bomb':
        add({ type: 'ring', x: ev.x, y: ev.y, r: 8, r1: 520, life: 0.8, color: '255,235,160', size: 14 });
        add({ type: 'ring', x: ev.x, y: ev.y, r: 4, r1: 420, life: 0.65, color: '255,255,255', size: 7 });
        fx.flash = 0.75;
        fx.flashColor = '255,248,220';
        fx.shake = 9;
        break;
      case 'pickup': {
        const col = ev.kind === 'gift' ? '255,220,90' : ev.kind === 'bomb' ? '255,150,60' : '255,200,140';
        ring(ev.x, ev.y, 38, col, 0.4, 4);
        sparks(ev.x, ev.y, 10, ['#ffe88a', '#fff', '#ffb23a'], 190, 0.5, 3);
        add({ type: 'text', x: ev.x, y: ev.y - 14, vx: 0, vy: -52, life: 1.0, size: 14, color: '#fff3b0', text: ev.kind === 'gift' ? 'POWER UP!' : ev.kind === 'bomb' ? '+1 BOMBĂ' : '+250' });
        break;
      }
      case 'bossPhase':
        fx.shake = 12;
        fx.flash = 0.5;
        fx.flashColor = '255,60,40';
        break;
      case 'bossDie': {
        fx.flash = 0;
        for (let i = 0; i < 16; i++) {
          timers.push({
            t: i * 0.16,
            fn: () => {
              boom(ev.x + rnd(-90, 90), ev.y + rnd(-90, 100), rnd(1.2, 2.2));
              feathers(ev.x + rnd(-80, 80), ev.y + rnd(-70, 80), 16, '#e11a14');
              fx.shake = 12;
            },
          });
        }
        timers.push({ t: 2.6, fn: () => { fx.flash = 1; fx.flashColor = '255,255,255'; boom(ev.x, ev.y, 4); } });
        break;
      }
      default:
    }
  };

  fx.update = (dt) => {
    fx.shake = Math.max(0, fx.shake - dt * 22);
    fx.flash = Math.max(0, fx.flash - dt * 1.8);
    for (let i = timers.length - 1; i >= 0; i--) {
      timers[i].t -= dt;
      if (timers[i].t <= 0) timers.splice(i, 1)[0].fn();
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.age += dt;
      if (p.age >= p.life) {
        parts.splice(i, 1);
        continue;
      }
      if (p.type === 'ring') {
        p.r = p.r + (p.r1 - p.r) * Math.min(1, dt * 7);
        continue;
      }
      if (p.drag) {
        const k = Math.exp(-p.drag * dt);
        p.vx *= k;
        p.vy *= k;
      }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
    for (let i = splats.length - 1; i >= 0; i--) {
      splats[i].age += dt;
      if (splats[i].age > splats[i].life) splats.splice(i, 1);
    }
  };

  fx.drawSplats = (ctx, S) => {
    for (const s of splats) {
      ctx.globalAlpha = Math.min(1, (s.life - s.age) / 1.2) * 0.95;
      blit(ctx, s.big ? S.splatRed : S.splat, s.x, s.y, 0, s.big ? 1.6 : 1);
    }
    ctx.globalAlpha = 1;
  };

  fx.draw = (ctx, S) => {
    for (const p of parts) {
      const k = p.age / p.life;
      switch (p.type) {
        case 'spark':
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 1 - k;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 - k * 0.5), 0, 6.283);
          ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
          break;
        case 'smoke':
          ctx.globalAlpha = 0.4 * (1 - k);
          ctx.fillStyle = '#3a3040';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.6 + k), 0, 6.283);
          ctx.fill();
          break;
        case 'bacon':
          ctx.save();
          ctx.globalAlpha = Math.min(1, (1 - k) * 1.6);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = '#c4361e';
          ctx.fillRect(-p.size, -p.size * 0.34, p.size * 2, p.size * 0.68);
          ctx.fillStyle = '#ffd3c0';
          ctx.fillRect(-p.size, -p.size * 0.08, p.size * 2, p.size * 0.18);
          ctx.restore();
          break;
        case 'puff':
          ctx.globalAlpha = Math.min(1, (1 - k) * 1.6);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 - k * 0.4), 0, 6.283);
          ctx.fill();
          break;
        case 'drop':
          ctx.globalAlpha = 1 - k;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, 6.283);
          ctx.fill();
          break;
        case 'ring':
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 1 - k;
          ctx.strokeStyle = `rgb(${p.color})`;
          ctx.lineWidth = p.size * (1 - k * 0.7);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, 6.283);
          ctx.stroke();
          ctx.globalCompositeOperation = 'source-over';
          break;
        case 'blast': {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 1 - k;
          blit(ctx, S.glow, p.x, p.y, 0, (p.size / 30) * (1 + k * 1.2));
          ctx.globalCompositeOperation = 'source-over';
          break;
        }
        case 'text':
          ctx.globalAlpha = Math.min(1, (1 - k) * 2);
          ctx.font = `800 ${p.size}px ui-rounded, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.lineWidth = 3;
          ctx.strokeStyle = 'rgba(30,10,50,.85)';
          ctx.strokeText(p.text, p.x, p.y);
          ctx.fillStyle = p.color;
          ctx.fillText(p.text, p.x, p.y);
          break;
        default:
      }
    }
    ctx.globalAlpha = 1;
  };

  return fx;
}

// Draws one frame: backdrop (screen space), then the world (360 x H units),
// then the HUD. `view` = { cw, ch, dpr, scale, ox, oy } in css px.

import { createSprites, blit, drawPig, PIG_K, BOSS_K } from './sprites.js';
import { createBackground } from './background.js';
import { createFx } from './fx.js';
import { drawPupil, EYES, PROP, PIG_AX, PIG_AY } from './pig.js';
import { clamp } from '../math.js';
import { WEAPONS } from '../weapons.js';


/** The spinning propeller on top of a pig's hat (drawn live; the blades flatten as they turn). */
function propeller(c, x, y, k, sc, chef, phase) {
  const hx = x + (PROP.x - PIG_AX) * k * sc;
  const hy = y + ((chef ? PROP.chefY : PROP.beanieY) - PIG_AY) * k * sc;
  const L = (chef ? 92 : 84) * k * sc;
  const w = 13 * k * sc;
  c.save();
  c.globalAlpha = 0.28;
  c.fillStyle = '#fff';
  c.beginPath();
  c.ellipse(hx, hy, L, w * 0.9, 0, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 1;
  c.fillStyle = '#ffe34a';
  c.strokeStyle = '#a07a0a';
  c.lineWidth = Math.max(0.6, 2 * k);
  const a = Math.abs(Math.cos(phase));
  c.beginPath();
  c.ellipse(hx, hy, Math.max(L * a, w), w, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const bg = createBackground();
  const fx = createFx();
  let S = null;
  let banner = null;

  function ensureSprites(view) {
    const px = view.dpr * view.scale;
    if (!S || Math.abs(S.px - px) / px > 0.08) S = createSprites(px);
    return S;
  }

  /** Feed the frame's game events to the effects and banner. */
  function consume(g) {
    for (const ev of g.events) {
      fx.handle(ev, g);
      if (ev.type === 'banner') banner = { ...ev, t: 0 };
    }
  }

  function drawBanner(c, g, dt) {
    if (!banner) return;
    banner.t += dt;
    const life = banner.boss ? 3 : 1.9;
    if (banner.t > life) {
      banner = null;
      return;
    }
    const k = banner.t / life;
    const pop = banner.t < 0.25 ? 0.6 + 1.6 * banner.t : 1;
    const a = k < 0.15 ? k / 0.15 : k > 0.8 ? (1 - k) / 0.2 : 1;
    c.save();
    c.globalAlpha = a;
    c.translate(g.W / 2, g.H * 0.34);
    c.scale(pop, pop);
    c.textAlign = 'center';
    c.lineJoin = 'round';
    c.font = `900 ${banner.boss ? 44 : 38}px ui-rounded, "Segoe UI", system-ui, sans-serif`;
    c.lineWidth = 9;
    c.strokeStyle = 'rgba(40,10,60,.9)';
    c.strokeText(banner.text, 0, 0);
    const gr = c.createLinearGradient(0, -34, 0, 6);
    if (banner.boss) {
      gr.addColorStop(0, '#fff4a0');
      gr.addColorStop(1, '#ff3b2a');
    } else {
      gr.addColorStop(0, '#ffffff');
      gr.addColorStop(1, '#ffc93a');
    }
    c.fillStyle = gr;
    c.fillText(banner.text, 0, 0);
    if (banner.sub) {
      c.font = '800 16px ui-rounded, system-ui, sans-serif';
      c.lineWidth = 5;
      c.strokeText(banner.sub, 0, 28);
      c.fillStyle = '#fff';
      c.fillText(banner.sub, 0, 28);
    }
    c.restore();
  }

  function drawShip(c, g, S2, t) {
    const s = g.ship;
    if (!s.alive) return;
    const blink = s.inv > 0 && g.phase !== 'intro' ? (Math.floor(t * 14) % 2 ? 0.35 : 0.9) : 1;
    c.globalAlpha = blink;
    // engine flames
    c.globalCompositeOperation = 'lighter';
    for (const dx of [-6, 6]) {
      const fl = 14 + Math.sin(t * 60 + dx) * 4 + 3 * Math.sin(t * 23);
      const gr = c.createLinearGradient(0, s.y + 22, 0, s.y + 22 + fl);
      gr.addColorStop(0, 'rgba(255,255,255,.95)');
      gr.addColorStop(0.35, 'rgba(255,170,60,.85)');
      gr.addColorStop(1, 'rgba(255,60,20,0)');
      c.fillStyle = gr;
      c.beginPath();
      c.moveTo(s.x + dx - 3.4, s.y + 22);
      c.lineTo(s.x + dx + 3.4, s.y + 22);
      c.lineTo(s.x + dx, s.y + 22 + fl);
      c.closePath();
      c.fill();
    }
    c.globalCompositeOperation = 'source-over';
    blit(c, S2.ship, s.x, s.y, 0, 1);
    if (s.inv > 0.01) {
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = Math.min(1, s.inv) * 0.55;
      c.strokeStyle = '#7fe4ff';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(s.x, s.y, 27 + Math.sin(t * 12) * 1.2, 0, 6.283);
      c.stroke();
      c.globalCompositeOperation = 'source-over';
    }
    c.globalAlpha = 1;
  }

  function drawBoss(c, g, S2, t) {
    const b = g.boss;
    if (!b) return;
    if (g.phase === 'bossDying' && Math.floor(t * 20) % 3 === 0) return; // flicker as it dies
    const set = S2.boss[b.phase - 1];
    const shake = b.phase === 3 ? 1.5 : 0;
    const x = b.x + (Math.random() - 0.5) * shake;
    const y = b.y + (Math.random() - 0.5) * shake;
    const flap = Math.sin(t * (4 + b.phase)) * 0.14;
    drawPig(c, set, x, y, flap, 1, (cc) => {
      const lx = clamp((g.ship.x - b.x) / 160, -1, 1);
      const ly = clamp((g.ship.y - b.y) / 400, 0, 1);
      cc.save();
      cc.translate(x - PIG_AX * BOSS_K, y - PIG_AY * BOSS_K);
      cc.scale(BOSS_K, BOSS_K);
      for (const [ex, ey] of EYES) drawPupil(cc, ex, ey, lx, ly);
      cc.restore();
      propeller(cc, x, y, BOSS_K, 1, true, t * 16);
    });
    if (b.flash > 0) {
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.45;
      drawPig(c, set, x, y, flap, 1);
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
    }
  }

  function drawHud(c, g, S2) {
    c.textAlign = 'left';
    c.lineJoin = 'round';
    c.font = '900 22px ui-rounded, "Segoe UI", system-ui, sans-serif';
    c.lineWidth = 5;
    c.strokeStyle = 'rgba(30,8,50,.85)';
    const sc = String(g.score).padStart(6, '0');
    c.strokeText(sc, 12, 30);
    c.fillStyle = '#fff6c8';
    c.fillText(sc, 12, 30);
    // lives and bombs
    for (let i = 0; i < g.lives; i++) blit(c, S2.ship, 22 + i * 24, 50, 0, 0.4);
    for (let i = 0; i < g.bombs; i++) blit(c, S2.bomb, 112 + i * 17, 51, 0, 0.5);
    // boss health
    const b = g.boss;
    if (b && (g.phase === 'boss' || g.phase === 'bossIntro' || g.phase === 'bossDying')) {
      const w = 138;
      const x = 124;
      const y = 17;
      c.fillStyle = 'rgba(20,6,30,.7)';
      c.beginPath();
      c.roundRect(x - 2, y - 2, w + 4, 16, 8);
      c.fill();
      const f = clamp(b.hp / b.maxHp, 0, 1);
      const gr = c.createLinearGradient(0, y, 0, y + 12);
      gr.addColorStop(0, '#ff8a5a');
      gr.addColorStop(1, '#d4140f');
      c.fillStyle = gr;
      c.beginPath();
      c.roundRect(x, y, Math.max(0, w * f), 12, 6);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,.35)';
      c.fillRect(x + 4, y + 2, Math.max(0, w * f - 8), 2);
      for (const m of [0.33, 0.66]) {
        c.fillStyle = 'rgba(255,255,255,.5)';
        c.fillRect(x + w * m - 1, y, 2, 12);
      }
    }
  }

  return {
    fx,
    reset() {
      fx.reset();
      banner = null;
    },
    /** In-game frame. */
    frame(g, view, t, dt) {
      const S2 = ensureSprites(view);
      consume(g);
      fx.update(dt);
      const c = ctx;
      c.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
      const tint = g.boss ? (g.phase === 'boss' ? 0.35 + 0.25 * (g.boss.phase - 1) : 0.2) : 0;
      bg.draw(c, view.cw, view.ch, t, tint);
      const sh = fx.shake;
      c.setTransform(view.dpr * view.scale, 0, 0, view.dpr * view.scale, (view.ox + (Math.random() - 0.5) * sh) * view.dpr, (view.oy + (Math.random() - 0.5) * sh) * view.dpr);

      fx.drawSplats(c, S2);
      drawBoss(c, g, S2, t);
      // pigs
      for (const e of g.enemies) {
        if (e.hp <= 0) continue;
        const set = S2.pig[e.color];
        const flap = Math.sin(t * 9 + e.id * 1.7) * 0.3;
        const bob = Math.sin(t * 3 + e.id) * 1.2;
        const sc = e.flash > 0 ? 1.1 : 1;
        drawPig(c, set, e.x, e.y + bob, flap, sc, (cc) => propeller(cc, e.x, e.y + bob, PIG_K, sc, false, t * 20 + e.id * 1.3));
        if (e.flash > 0) {
          c.globalCompositeOperation = 'lighter';
          c.globalAlpha = 0.5;
          blit(c, set.body, e.x, e.y + bob, 0, 1.1);
          c.globalAlpha = 1;
          c.globalCompositeOperation = 'source-over';
        }
      }
      // pickups
      for (const d of g.drops) {
        const s = S2[d.type];
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = 0.45 + 0.25 * Math.sin(d.t * 8);
        blit(c, S2.glow, d.x, d.y, 0, d.type === 'gift' ? 1.1 : 0.8);
        c.globalAlpha = 1;
        c.globalCompositeOperation = 'source-over';
        blit(c, s, d.x, d.y + Math.sin(d.t * 5) * 1.5, Math.sin(d.t * 3) * 0.3, d.type === 'gift' ? 1 + 0.06 * Math.sin(d.t * 9) : 0.95);
      }
      // blobs
      for (const e of g.blobs) {
        if (e.kind === 'big') {
          const near = clamp((e.y - (e.splitY - 70)) / 70, 0, 1);
          blit(c, S2.blobBig, e.x, e.y, Math.sin(e.spin) * 0.3, 1 + near * 0.12 * Math.sin(g.t * 30));
          if (near > 0) {
            c.globalCompositeOperation = 'lighter';
            c.globalAlpha = near * 0.7;
            blit(c, S2.glow, e.x, e.y, 0, 0.9);
            c.globalAlpha = 1;
            c.globalCompositeOperation = 'source-over';
          }
        } else blit(c, S2.blob, e.x, e.y, Math.sin(e.spin) * 0.35, 1);
      }
      // bullets
      c.globalCompositeOperation = 'lighter';
      for (const b of g.bullets) blit(c, S2[b.type], b.x, b.y, Math.atan2(b.vx, -b.vy), 1);
      c.globalCompositeOperation = 'source-over';

      drawShip(c, g, S2, t);
      fx.draw(c, S2);
      drawHud(c, g, S2);
      drawBanner(c, g, dt);

      if (fx.flash > 0) {
        c.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
        c.fillStyle = `rgba(${fx.flashColor},${Math.min(1, fx.flash)})`;
        c.fillRect(0, 0, view.cw, view.ch);
      }
      g.events.length = 0;
    },
    /** Title-screen scene: the giant pig and the ship. */
    menu(view, t) {
      const S2 = ensureSprites(view);
      const c = ctx;
      c.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
      bg.draw(c, view.cw, view.ch, t, 0.1);
      c.setTransform(view.dpr * view.scale, 0, 0, view.dpr * view.scale, view.ox * view.dpr, view.oy * view.dpr);
      const H = view.H;
      void H;
      drawPig(c, S2.boss[0], 180 + Math.sin(t) * 14, H * 0.42 + Math.sin(t * 1.7) * 6, Math.sin(t * 5) * 0.16, 0.78, (cc) => {
        cc.save();
        cc.translate(180 + Math.sin(t) * 14 - PIG_AX * BOSS_K * 0.78, H * 0.42 + Math.sin(t * 1.7) * 6 - PIG_AY * BOSS_K * 0.78);
        cc.scale(BOSS_K * 0.78, BOSS_K * 0.78);
        for (const [ex, ey] of EYES) drawPupil(cc, ex, ey, Math.sin(t * 0.9), 0.5);
        cc.restore();
        propeller(cc, 180 + Math.sin(t) * 14, H * 0.42 + Math.sin(t * 1.7) * 6, BOSS_K, 0.78, true, t * 16);
      });
    },
    weaponColor: (w) => WEAPONS[w].color,
  };
}

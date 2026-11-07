// Pre-rendered sprites. Everything is drawn once onto small offscreen canvases
// at the current pixel density (`px` = device pixels per world unit), then just
// blitted every frame, which keeps the game smooth on phones.

import { drawPigBody, drawPigWing, PIG_W, PIG_H, PIG_AX, PIG_AY, WING_PIVOT, OUTFITS } from './pig.js';

export const PIG_K = 0.105; // world units per design unit, ordinary pigs
export const BOSS_K = 0.46; // the giant pig
export const WING_SCALE = 0.7; // ordinary pigs have shorter wings so they fit in formation

/** Bake a sprite: `w` x `h` world units, anchor (ax, ay) in world units. */
function bake(px, w, h, ax, ay, draw) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w * px));
  c.height = Math.max(1, Math.ceil(h * px));
  const ctx = c.getContext('2d');
  ctx.scale(c.width / w, c.height / h);
  draw(ctx);
  return { c, w, h, ax, ay };
}

/** Draw a baked sprite with its anchor at (x, y). */
export function blit(ctx, s, x, y, rot = 0, sc = 1) {
  if (rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.drawImage(s.c, -s.ax * sc, -s.ay * sc, s.w * sc, s.h * sc);
    ctx.restore();
  } else ctx.drawImage(s.c, x - s.ax * sc, y - s.ay * sc, s.w * sc, s.h * sc);
}

function pigSet(px, k, outfit, look, wingScale) {
  const body = bake(px, PIG_W * k, PIG_H * k, PIG_AX * k, PIG_AY * k, (ctx) => {
    ctx.scale(k, k);
    drawPigBody(ctx, outfit, look);
  });
  const ox = -5;
  const oy = 215;
  const wing = bake(px, 235 * k * wingScale, 200 * k * wingScale, (WING_PIVOT.x - ox) * k * wingScale, (WING_PIVOT.y - oy) * k * wingScale, (ctx) => {
    ctx.scale(k * wingScale, k * wingScale);
    ctx.translate(WING_PIVOT.x - ox, WING_PIVOT.y - oy);
    drawPigWing(ctx, outfit);
  });
  return { body, wing, k, wingScale, pivotDx: (WING_PIVOT.x - PIG_AX) * k, pivotDy: (WING_PIVOT.y - PIG_AY) * k };
}

/** Draw one pig set (wings behind, body in front). */
export function drawPig(ctx, set, x, y, flap, sc = 1, extra) {
  const { body, wing, pivotDx, pivotDy } = set;
  for (const s of [1, -1]) {
    ctx.save();
    ctx.translate(x + s * pivotDx * sc, y + pivotDy * sc);
    ctx.scale(s * sc, sc);
    ctx.rotate(flap);
    ctx.drawImage(wing.c, -wing.ax, -wing.ay, wing.w, wing.h);
    ctx.restore();
  }
  blit(ctx, body, x, y, 0, sc);
  if (extra) extra(ctx);
}

function drawShip(ctx) {
  // wings
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.scale(s, 1);
    let g = ctx.createLinearGradient(6, 0, 28, 24);
    g.addColorStop(0, '#6f86c8');
    g.addColorStop(1, '#2b3a82');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#162052';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(5, -8);
    ctx.lineTo(27, 14);
    ctx.lineTo(29, 25);
    ctx.lineTo(12, 20);
    ctx.lineTo(5, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // orange wing-tip
    ctx.fillStyle = '#ff7a1a';
    ctx.beginPath();
    ctx.moveTo(22, 9);
    ctx.lineTo(27, 14);
    ctx.lineTo(29, 25);
    ctx.lineTo(23, 23);
    ctx.closePath();
    ctx.fill();
    // little side cannon
    g = ctx.createLinearGradient(14, 0, 18, 0);
    g.addColorStop(0, '#d9e4ff');
    g.addColorStop(1, '#6a7bb5');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(14, -4, 4.5, 18, 2);
    ctx.fill();
    ctx.restore();
  }
  // engine nozzles
  ctx.fillStyle = '#39406a';
  for (const dx of [-6, 6]) {
    ctx.beginPath();
    ctx.roundRect(dx - 3, 15, 6, 9, 2);
    ctx.fill();
  }
  // fuselage
  const g = ctx.createLinearGradient(-10, 0, 10, 0);
  g.addColorStop(0, '#8793b8');
  g.addColorStop(0.35, '#f3f6ff');
  g.addColorStop(0.7, '#c4cce6');
  g.addColorStop(1, '#6d79a2');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#2a3566';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -31);
  ctx.bezierCurveTo(5, -22, 10, -6, 10, 10);
  ctx.lineTo(8, 21);
  ctx.lineTo(-8, 21);
  ctx.lineTo(-10, 10);
  ctx.bezierCurveTo(-10, -6, -5, -22, 0, -31);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // red stripe
  ctx.fillStyle = '#e8402a';
  ctx.beginPath();
  ctx.moveTo(-7, 6);
  ctx.lineTo(7, 6);
  ctx.lineTo(7.8, 12);
  ctx.lineTo(-7.8, 12);
  ctx.closePath();
  ctx.fill();
  // cockpit
  const cg = ctx.createLinearGradient(-4, -16, 4, 2);
  cg.addColorStop(0, '#d9fbff');
  cg.addColorStop(0.5, '#38b6ff');
  cg.addColorStop(1, '#0b3c9c');
  ctx.fillStyle = cg;
  ctx.strokeStyle = '#173070';
  ctx.beginPath();
  ctx.ellipse(0, -8, 4.6, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  ctx.beginPath();
  ctx.ellipse(-1.6, -11, 1.4, 3.6, 0.15, 0, Math.PI * 2);
  ctx.fill();
}

function glowOrb(ctx, r, rgb) {
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, `rgba(${rgb},0.95)`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
}

export function createSprites(px) {
  const S = { px, pig: {}, boss: [] };

  for (const name of Object.keys(OUTFITS)) S.pig[name] = pigSet(px, PIG_K, name, {}, WING_SCALE);
  // boss: three brow intensities (calm -> furious); the pupils are drawn live
  for (const anger of [0.8, 1.4, 2]) S.boss.push(pigSet(px, BOSS_K, 'red', { anger, pupils: false, chef: true }, 1));

  S.ship = bake(px, 64, 64, 32, 33, (ctx) => {
    ctx.translate(32, 33);
    drawShip(ctx);
  });

  // projectiles, drawn pointing up
  S.ion = bake(px, 30, 44, 15, 26, (ctx) => {
    ctx.translate(15, 22);
    ctx.save();
    ctx.scale(0.5, 1);
    glowOrb(ctx, 20, '70,200,255');
    ctx.restore();
    glowOrb(ctx, 9, '120,220,255');
  });
  S.neutron = bake(px, 34, 80, 17, 48, (ctx) => {
    ctx.translate(17, 40);
    ctx.save();
    ctx.scale(0.55, 1);
    glowOrb(ctx, 36, '90,255,120');
    ctx.restore();
    const g = ctx.createLinearGradient(0, -30, 0, 30);
    g.addColorStop(0, 'rgba(255,255,255,0.1)');
    g.addColorStop(0.35, '#eaffee');
    g.addColorStop(1, 'rgba(90,255,120,0.2)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(-4.5, -30, 9, 60, 4.5);
    ctx.fill();
  });
  S.vulcan = bake(px, 16, 44, 8, 22, (ctx) => {
    ctx.translate(8, 22);
    ctx.save();
    ctx.scale(0.45, 1);
    glowOrb(ctx, 16, '255,170,40');
    ctx.restore();
    const g = ctx.createLinearGradient(0, -16, 0, 16);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, 'rgba(255,170,40,0.1)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(-2, -16, 4, 32, 2);
    ctx.fill();
  });

  // mud balls the pigs throw
  S.blob = bake(px, 20, 22, 10, 11, (ctx) => {
    ctx.translate(10, 11);
    const g = ctx.createRadialGradient(-3, -4, 1, 0, 0, 10);
    g.addColorStop(0, '#b98a5a');
    g.addColorStop(0.55, '#7a4a24');
    g.addColorStop(1, '#3f2210');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#2a1408';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i <= 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const r = (i % 2 ? 8.6 : 7.4) + (i === 3 ? 1.6 : 0);
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * 1.08);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,230,190,.55)';
    ctx.beginPath();
    ctx.ellipse(-3, -4, 2.6, 1.8, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3f2210';
    ctx.beginPath();
    ctx.arc(7, -8, 1.8, 0, Math.PI * 2);
    ctx.arc(-8, 7, 1.5, 0, Math.PI * 2);
    ctx.fill();
  });
  // the big one: a rotten tomato that bursts into three
  S.blobBig = bake(px, 44, 46, 22, 24, (ctx) => {
    ctx.translate(22, 25);
    const g = ctx.createRadialGradient(-6, -7, 2, 0, 0, 22);
    g.addColorStop(0, '#ff9a8a');
    g.addColorStop(0.5, '#e8281c');
    g.addColorStop(1, '#8f0c12');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#5a0710';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, 19, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2f9e3c';
    ctx.strokeStyle = '#17591f';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 5.5, -14 + Math.sin(a) * 2.8, 7, 2.6, a, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.strokeStyle = '#17591f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(1, -21);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.beginPath();
    ctx.ellipse(-8, -6, 4, 6, 0.5, 0, Math.PI * 2);
    ctx.fill();
    // a grumpy little face, because everything here is funny
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-6, 2, 3.8, 0, Math.PI * 2);
    ctx.arc(6, 2, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#220';
    ctx.beginPath();
    ctx.arc(-5.5, 3, 1.8, 0, Math.PI * 2);
    ctx.arc(6.5, 3, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#220';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-10, -2);
    ctx.lineTo(-3, 0);
    ctx.moveTo(10, -2);
    ctx.lineTo(3, 0);
    ctx.stroke();
  });
  const splat = (px2, c1, c2) => bake(px2, 44, 18, 22, 9, (ctx) => {
    ctx.translate(22, 9);
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.ellipse(0, 1, 20, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(-12, 3, 7, 4, 0.2, 0, Math.PI * 2);
    ctx.ellipse(13, 2, 6, 3.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c2;
    ctx.beginPath();
    ctx.ellipse(-2, -1, 8, 3.6, 0, 0, Math.PI * 2);
    ctx.ellipse(9, 0, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  S.splat = splat(px, 'rgba(96,58,28,.95)', 'rgba(150,100,56,.9)');
  S.splatRed = splat(px, 'rgba(200,24,24,.95)', 'rgba(255,110,90,.9)');

  // pickups
  S.sausage = bake(px, 34, 30, 17, 15, (ctx) => {
    ctx.translate(17, 15);
    ctx.rotate(-0.35);
    ctx.strokeStyle = '#5a1f0e';
    ctx.lineWidth = 1.4;
    for (const [dx, dy] of [[0, 8], [0, -1], [0, -10]]) {
      const g = ctx.createLinearGradient(0, dy - 5, 0, dy + 5);
      g.addColorStop(0, '#f08a5a');
      g.addColorStop(0.5, '#c8431c');
      g.addColorStop(1, '#7c220d');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(-14 + dx, dy - 5.2, 28, 10.4, 5.2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.4)';
      ctx.beginPath();
      ctx.ellipse(-4 + dx, dy - 2.4, 7, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // the twisted ends of the links
    ctx.strokeStyle = '#a8431c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(14, 3.2);
    ctx.lineTo(17, 1);
    ctx.moveTo(-14, -5.8);
    ctx.lineTo(-17, -7);
    ctx.stroke();
  });
  S.gift = bake(px, 34, 34, 17, 17, (ctx) => {
    ctx.translate(17, 17);
    const g = ctx.createLinearGradient(-11, -11, 11, 11);
    g.addColorStop(0, '#ff6a5a');
    g.addColorStop(1, '#b3122a');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#6a0818';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(-11, -9, 22, 20, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffd24a';
    ctx.fillRect(-2.5, -9, 5, 20);
    ctx.fillRect(-11, -0.5, 22, 5);
    ctx.fillStyle = '#ffe98a';
    ctx.beginPath();
    ctx.ellipse(-5, -11, 5.4, 3.4, -0.5, 0, Math.PI * 2);
    ctx.ellipse(5, -11, 5.4, 3.4, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#ffd24a';
    ctx.beginPath();
    ctx.arc(0, -10.5, 2.4, 0, Math.PI * 2);
    ctx.fill();
  });
  S.bomb = bake(px, 32, 32, 16, 16, (ctx) => {
    ctx.translate(16, 17);
    const g = ctx.createRadialGradient(-4, -4, 1, 0, 0, 12);
    g.addColorStop(0, '#6d7390');
    g.addColorStop(1, '#10121f');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffcb3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 11, -0.5, 0.9);
    ctx.stroke();
    ctx.strokeStyle = '#c9a063';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(5, -9);
    ctx.quadraticCurveTo(10, -14, 13, -11);
    ctx.stroke();
    ctx.fillStyle = '#ff9a1a';
    ctx.beginPath();
    ctx.arc(13, -11.5, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffee88';
    ctx.beginPath();
    ctx.arc(13, -11.5, 1.2, 0, Math.PI * 2);
    ctx.fill();
  });
  S.glow = bake(px, 60, 60, 30, 30, (ctx) => {
    ctx.translate(30, 30);
    glowOrb(ctx, 30, '255,255,255');
  });
  return S;
}

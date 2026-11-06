// Deep-space backdrop: a baked nebula, three parallax star layers and a slowly
// drifting ringed planet. Drawn in screen space so it fills any phone shape.

import { mulberry32 } from '../math.js';

export function createBackground() {
  const rng = mulberry32(77);
  const stars = [];
  for (let i = 0; i < 150; i++) {
    const layer = i % 3;
    stars.push({ x: rng(), y: rng(), layer, tw: rng() * 6.28, hue: rng() });
  }
  let nebula = null;
  let nw = 0;
  let nh = 0;

  function bakeNebula(w, h) {
    nw = w;
    nh = h;
    nebula = document.createElement('canvas');
    nebula.width = Math.ceil(w / 2);
    nebula.height = Math.ceil(h / 2);
    const c = nebula.getContext('2d');
    const g = c.createLinearGradient(0, 0, 0, nebula.height);
    g.addColorStop(0, '#04061a');
    g.addColorStop(0.55, '#150a38');
    g.addColorStop(1, '#2a0f45');
    c.fillStyle = g;
    c.fillRect(0, 0, nebula.width, nebula.height);
    const r = mulberry32(5);
    const blobs = [
      ['120,60,255', 0.22], ['255,70,160', 0.16], ['40,170,255', 0.18], ['255,150,60', 0.1], ['150,60,255', 0.2],
    ];
    for (let i = 0; i < 9; i++) {
      const [rgb, a] = blobs[i % blobs.length];
      const x = r() * nebula.width;
      const y = r() * nebula.height;
      const rad = (0.25 + r() * 0.35) * Math.max(nebula.width, nebula.height);
      const rg = c.createRadialGradient(x, y, 0, x, y, rad);
      rg.addColorStop(0, `rgba(${rgb},${a})`);
      rg.addColorStop(1, `rgba(${rgb},0)`);
      c.fillStyle = rg;
      c.fillRect(0, 0, nebula.width, nebula.height);
    }
  }

  return {
    /** Draw across the whole canvas (css px w x h). `t` seconds, `tint` 0..1 turns the sky red (boss). */
    draw(ctx, w, h, t, tint = 0) {
      if (!nebula || nw !== w || nh !== h) bakeNebula(w, h);
      ctx.drawImage(nebula, 0, 0, w, h);

      // distant planet with a ring
      const py = ((t * 3) % (h + 260)) - 130;
      const px = w * 0.8;
      ctx.save();
      ctx.globalAlpha = 0.9;
      const pg = ctx.createRadialGradient(px - 14, py - 14, 4, px, py, 46);
      pg.addColorStop(0, '#ffb870');
      pg.addColorStop(0.6, '#b8456c');
      pg.addColorStop(1, '#3a1450');
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(px, py, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,210,150,.55)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(px, py, 70, 14, -0.4, 0.1, Math.PI * 2 - 0.1);
      ctx.stroke();
      ctx.restore();

      for (const s of stars) {
        const speed = [14, 34, 70][s.layer];
        const y = (((s.y * h + t * speed) % h) + h) % h;
        const x = s.x * w;
        const tw = 0.65 + 0.35 * Math.sin(t * 2 + s.tw);
        const size = [1, 1.4, 2][s.layer];
        ctx.globalAlpha = tw * [0.55, 0.8, 1][s.layer];
        ctx.fillStyle = s.hue < 0.15 ? '#ffd8a8' : s.hue < 0.3 ? '#a8d0ff' : '#ffffff';
        ctx.fillRect(x, y, size, size * (s.layer === 2 ? 1.8 : 1));
      }
      ctx.globalAlpha = 1;
      if (tint > 0) {
        ctx.fillStyle = `rgba(120,10,20,${0.28 * tint})`;
        ctx.fillRect(0, 0, w, h);
      }
    },
  };
}

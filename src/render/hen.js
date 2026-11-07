// The hen, drawn from code. Design space is 560x480 (like the reference art:
// a white hen with a knitted red poncho, angry brows, an orange beak with the
// mouth open, a red comb, four long feathers per wing and fat orange feet).
// Anchor of the hen (its "centre" in the game) is design point (280, 250).

export const HEN_W = 560;
export const HEN_H = 504;
export const HEN_AX = 280;
export const HEN_AY = 250;
/** Where the wing joins the body (left wing; the right one is mirrored). */
export const WING_PIVOT = { x: 212, y: 218 };

export const SWEATERS = {
  red: { hi: '#ff4a2e', mid: '#e11a14', lo: '#98080c', rope: '#e8481e', rope2: '#ffa070' },
  blue: { hi: '#58a8ff', mid: '#2468e8', lo: '#102f95', rope: '#2f84ff', rope2: '#a8d4ff' },
  green: { hi: '#5be874', mid: '#23b447', lo: '#0c6a26', rope: '#35cf58', rope2: '#b4ffc0' },
  yellow: { hi: '#ffe566', mid: '#ffc01f', lo: '#c07c04', rope: '#ffb81c', rope2: '#fff0a0' },
  purple: { hi: '#c88aff', mid: '#9444f0', lo: '#52179c', rope: '#a85cff', rope2: '#e2c4ff' },
};

function feetPath(ctx, cx, cy, flip) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(flip, 1);
  const g = ctx.createLinearGradient(0, -20, 0, 40);
  g.addColorStop(0, '#ffb23a');
  g.addColorStop(1, '#e8750c');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#b8560a';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  // ankle
  ctx.beginPath();
  ctx.roundRect(-14, -34, 28, 40, 10);
  ctx.fill();
  // three fat toes
  for (const [dx, dy, rot, len] of [[-24, 22, 0.55, 36], [0, 28, 0, 40], [24, 22, -0.55, 36]]) {
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.roundRect(-13, -14, 26, len, 13);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function ropePath(ctx, path, width, c) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = c.lo;
  ctx.lineWidth = width + 3;
  ctx.stroke(path);
  ctx.strokeStyle = c.rope;
  ctx.lineWidth = width;
  ctx.stroke(path);
  // twisted look: short light dashes slanted across the rope
  ctx.strokeStyle = c.rope2;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = width * 0.34;
  ctx.setLineDash([width * 0.5, width * 0.55]);
  ctx.stroke(path);
  ctx.restore();
}

/** One pupil (+ glint) of the eye centred at design x `ex`. */
export function drawPupil(ctx, ex, lookX, lookY) {
  ctx.fillStyle = '#16121c';
  ctx.beginPath();
  ctx.arc(ex + lookX * 6, 90 + lookY * 5, 6.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(ex + lookX * 6 - 2, 87 + lookY * 5, 2, 0, Math.PI * 2);
  ctx.fill();
}

export const EYES_X = [262, 306];

/** Body, head, poncho, feet. No wings (those are animated separately). */
export function drawHenBody(ctx, sweater, look = {}) {
  const c = SWEATERS[sweater] ?? SWEATERS.red;
  const { lookX = 0, lookY = 0, anger = 1, pupils = true } = look;

  // feet
  feetPath(ctx, 205, 438, 1);
  feetPath(ctx, 355, 438, -1);

  // fat white belly peeking under the poncho
  let g = ctx.createRadialGradient(262, 340, 20, 280, 350, 150);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.7, '#f1eef8');
  g.addColorStop(1, '#cfc8e6');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(280, 350, 128, 98, 0, 0, Math.PI * 2);
  ctx.fill();
  // belly button shadow, like the reference
  ctx.fillStyle = 'rgba(160,150,190,.35)';
  ctx.beginPath();
  ctx.ellipse(282, 416, 9, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // neck
  g = ctx.createLinearGradient(230, 130, 330, 200);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#dcd6ee');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(280, 165, 50, 38, 0, 0, Math.PI * 2);
  ctx.fill();

  // poncho (knitted bell)
  const poncho = new Path2D();
  poncho.moveTo(246, 172);
  poncho.bezierCurveTo(212, 184, 172, 252, 150, 322);
  poncho.bezierCurveTo(176, 358, 230, 362, 282, 362);
  poncho.bezierCurveTo(334, 362, 388, 358, 414, 322);
  poncho.bezierCurveTo(392, 252, 350, 184, 314, 172);
  poncho.quadraticCurveTo(280, 186, 246, 172);
  poncho.closePath();
  g = ctx.createLinearGradient(150, 0, 414, 0);
  g.addColorStop(0, c.lo);
  g.addColorStop(0.18, c.mid);
  g.addColorStop(0.42, c.hi);
  g.addColorStop(0.7, c.mid);
  g.addColorStop(1, c.lo);
  ctx.fillStyle = g;
  ctx.fill(poncho);
  ctx.save();
  ctx.clip(poncho);
  // soft shading toward the hem and neck
  g = ctx.createLinearGradient(0, 170, 0, 365);
  g.addColorStop(0, 'rgba(0,0,0,.25)');
  g.addColorStop(0.3, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,.22)');
  ctx.fillStyle = g;
  ctx.fillRect(140, 165, 290, 205);
  // knit: crossing diagonal stitches
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = 'rgba(0,0,0,.2)';
  ctx.beginPath();
  for (let i = -300; i < 320; i += 9) {
    ctx.moveTo(150 + i, 160);
    ctx.lineTo(150 + i + 210, 370);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.17)';
  ctx.beginPath();
  for (let i = -100; i < 520; i += 9) {
    ctx.moveTo(150 + i, 160);
    ctx.lineTo(150 + i - 210, 370);
  }
  ctx.stroke();
  ctx.restore();

  // zipper
  ctx.strokeStyle = c.lo;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(280, 184);
  ctx.lineTo(280, 358);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.28)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.stroke();
  ctx.setLineDash([]);

  // hem rope + collar rope
  const hem = new Path2D();
  hem.moveTo(150, 326);
  hem.bezierCurveTo(178, 366, 232, 368, 282, 368);
  hem.bezierCurveTo(332, 368, 386, 366, 414, 326);
  ropePath(ctx, hem, 17, c);
  const collar = new Path2D();
  collar.moveTo(240, 178);
  collar.quadraticCurveTo(280, 198, 320, 178);
  ropePath(ctx, collar, 14, c);

  // head
  g = ctx.createRadialGradient(268, 82, 10, 284, 100, 66);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.75, '#f6f3fb');
  g.addColorStop(1, '#cdc6e4');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(284, 102, 58, 54, 0, 0, Math.PI * 2);
  ctx.fill();

  // comb
  g = ctx.createLinearGradient(0, 10, 0, 70);
  g.addColorStop(0, '#ff7a3a');
  g.addColorStop(1, '#d4140f');
  ctx.fillStyle = g;
  for (const [x, y, rx, ry, rot] of [[262, 58, 13, 20, -0.35], [284, 40, 16, 28, 0.05], [304, 56, 12, 20, 0.4]]) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    ctx.fill();
  }

  // eyes (they follow the player a little)
  for (const ex of [262, 306]) {
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'rgba(80,70,110,.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(ex, 88, 15, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (pupils) drawPupil(ctx, ex, lookX, lookY);
  }
  // angry brows: heavy black strokes slanting down toward the beak
  ctx.strokeStyle = '#1a1520';
  ctx.lineCap = 'round';
  ctx.lineWidth = 11;
  const tilt = 14 * anger;
  ctx.beginPath();
  ctx.moveTo(238, 66 - tilt * 0.2);
  ctx.lineTo(282, 74 + tilt * 0.5);
  ctx.moveTo(330, 66 - tilt * 0.2);
  ctx.lineTo(286, 74 + tilt * 0.5);
  ctx.stroke();

  // beak: upper dome, open mouth, tongue, lower beak
  g = ctx.createLinearGradient(0, 96, 0, 160);
  g.addColorStop(0, '#ffc23a');
  g.addColorStop(1, '#f08a14');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#c2650a';
  ctx.lineWidth = 3;
  ctx.beginPath(); // lower beak
  ctx.moveTo(240, 122);
  ctx.quadraticCurveTo(286, 168, 332, 122);
  ctx.quadraticCurveTo(286, 134, 240, 122);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#b30f1a'; // mouth
  ctx.beginPath();
  ctx.ellipse(286, 123, 38, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff6f84'; // tongue
  ctx.beginPath();
  ctx.ellipse(286, 132, 20, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = g; // upper beak
  ctx.beginPath();
  ctx.moveTo(236, 118);
  ctx.bezierCurveTo(244, 84, 328, 84, 336, 118);
  ctx.quadraticCurveTo(286, 112, 236, 118);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.45)';
  ctx.beginPath();
  ctx.ellipse(270, 98, 14, 5, -0.25, 0, Math.PI * 2);
  ctx.fill();

  // wattle
  g = ctx.createLinearGradient(0, 140, 0, 188);
  g.addColorStop(0, '#ff3a22');
  g.addColorStop(1, '#bd0c10');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(290, 160, 10, 22, 0.05, 0, Math.PI * 2);
  ctx.fill();
}

/** One (left) wing: four long feathers fanned out from the pivot, drawn at the pivot origin. */
export function drawHenWing(ctx) {
  const feathers = [
    { ang: 0.42, len: 196, w: 42 },
    { ang: 0.12, len: 204, w: 42 },
    { ang: -0.2, len: 188, w: 40 },
    { ang: -0.52, len: 162, w: 38 },
  ];
  // the wing points left (angle PI) and sweeps; feathers fan around that
  for (const f of feathers.slice().reverse()) {
    ctx.save();
    ctx.rotate(Math.PI + f.ang);
    const L = f.len;
    const w = f.w;
    const g = ctx.createLinearGradient(0, -w / 2, 0, w / 2);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.6, '#efecf8');
    g.addColorStop(1, '#c5bde0');
    ctx.fillStyle = g;
    ctx.strokeStyle = 'rgba(140,128,185,.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -w * 0.3);
    ctx.bezierCurveTo(L * 0.3, -w * 0.62, L * 0.8, -w * 0.58, L, -w * 0.05);
    ctx.bezierCurveTo(L * 0.82, w * 0.55, L * 0.3, w * 0.62, 0, w * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

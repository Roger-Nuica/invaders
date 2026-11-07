// The flying pig, drawn from code. Design space is 560x504. A round pink pig
// with a huge snout, floppy ears, a goofy grin with a buck tooth, a scarf, a
// curly tail, bat wings and a propeller beanie (the propeller is spun live by
// the renderer). The boss swaps the beanie for a chef's hat and adds a mustache.
// Anchor of the pig (its "centre" in the game) is design point (280, 250).

export const PIG_W = 560;
export const PIG_H = 504;
export const PIG_AX = 280;
export const PIG_AY = 250;
/** Where the (left) wing joins the body; the right wing is mirrored. */
export const WING_PIVOT = { x: 200, y: 322 };
/** Eye centres, for the pupils that follow the player. */
export const EYES = [[238, 178], [322, 178]];
/** Propeller hub position (design space) for the beanie and the chef hat. */
export const PROP = { x: 280, beanieY: 52, chefY: 12 };

export const OUTFITS = {
  red: { hi: '#ff6a52', mid: '#e8281c', lo: '#9c0f12' },
  blue: { hi: '#6cb4ff', mid: '#2468e8', lo: '#112f95' },
  green: { hi: '#6cee82', mid: '#23b447', lo: '#0c6a26' },
  yellow: { hi: '#ffec74', mid: '#ffbf1f', lo: '#c07c04' },
  purple: { hi: '#d49aff', mid: '#9444f0', lo: '#52179c' },
};

const PINK = { hi: '#ffd0dc', mid: '#ff9dba', lo: '#ee6a94', dark: '#b8325f' };

function hoof(ctx, cx, cy) {
  const g = ctx.createLinearGradient(0, cy - 16, 0, cy + 24);
  g.addColorStop(0, '#7a4a3a');
  g.addColorStop(1, '#3c1f1a');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#2a1410';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(cx - 26, cy - 14, 52, 36, [12, 12, 18, 18]);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath(); // the split in the trotter
  ctx.moveTo(cx, cy + 2);
  ctx.lineTo(cx, cy + 22);
  ctx.stroke();
}

function pupil(ctx, x, y, lookX, lookY) {
  ctx.fillStyle = '#1c1020';
  ctx.beginPath();
  ctx.arc(x + lookX * 9, y + 2 + lookY * 8, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x + lookX * 9 - 4, y - 3 + lookY * 8, 4.2, 0, Math.PI * 2);
  ctx.fill();
}

/** One pupil + glint at design position (ex, ey); look in -1..1. */
export function drawPupil(ctx, ex, ey, lookX, lookY) {
  pupil(ctx, ex, ey, lookX, lookY);
}

/** Pig body, head, scarf, hat. No wings (animated separately), no propeller blades (live). */
export function drawPigBody(ctx, outfit, look = {}) {
  const c = OUTFITS[outfit] ?? OUTFITS.red;
  const { lookX = 0, lookY = 0.3, anger = 0.5, pupils = true, chef = false } = look;
  let g;

  // curly tail (behind everything)
  ctx.strokeStyle = PINK.lo;
  ctx.lineWidth = 13;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(378, 360);
  ctx.bezierCurveTo(430, 356, 452, 312, 424, 296);
  ctx.bezierCurveTo(402, 284, 390, 314, 412, 320);
  ctx.stroke();

  hoof(ctx, 218, 452);
  hoof(ctx, 342, 452);

  // round belly
  g = ctx.createRadialGradient(252, 330, 20, 280, 360, 140);
  g.addColorStop(0, PINK.hi);
  g.addColorStop(0.55, PINK.mid);
  g.addColorStop(1, PINK.lo);
  ctx.fillStyle = g;
  ctx.strokeStyle = PINK.dark;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(280, 356, 116, 102, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,236,242,.55)';
  ctx.beginPath();
  ctx.ellipse(280, 384, 70, 54, 0, 0, Math.PI * 2);
  ctx.fill();
  // belly button
  ctx.strokeStyle = 'rgba(184,50,95,.55)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(280, 388, 7, 0, Math.PI * 2);
  ctx.stroke();

  // floppy ears (behind the head)
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(280 + s * 82, 122);
    ctx.rotate(s * 0.62);
    g = ctx.createLinearGradient(0, -50, 0, 36);
    g.addColorStop(0, PINK.mid);
    g.addColorStop(1, PINK.lo);
    ctx.fillStyle = g;
    ctx.strokeStyle = PINK.dark;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-38, 34);
    ctx.quadraticCurveTo(-30, -58, 6, -52);
    ctx.quadraticCurveTo(50, -40, 40, 34);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff7fa6';
    ctx.beginPath();
    ctx.moveTo(-20, 26);
    ctx.quadraticCurveTo(-14, -30, 6, -30);
    ctx.quadraticCurveTo(28, -22, 24, 26);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // scarf: a striped band round the neck, with a knot and flowing tails
  const scarf = new Path2D();
  scarf.ellipse(280, 272, 88, 26, 0, 0, Math.PI * 2);
  g = ctx.createLinearGradient(0, 246, 0, 298);
  g.addColorStop(0, c.hi);
  g.addColorStop(1, c.lo);
  ctx.fillStyle = g;
  ctx.fill(scarf);
  ctx.save();
  ctx.clip(scarf);
  ctx.strokeStyle = 'rgba(255,255,255,.45)';
  ctx.lineWidth = 9;
  ctx.beginPath();
  for (let x = 170; x < 400; x += 26) {
    ctx.moveTo(x, 240);
    ctx.lineTo(x - 14, 304);
  }
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = c.lo;
  ctx.lineWidth = 3;
  ctx.stroke(scarf);
  for (const [dx, dy, rot] of [[0, 0, 0.5], [26, 14, 0.15]]) {
    ctx.save();
    ctx.translate(338 + dx, 288 + dy);
    ctx.rotate(rot);
    g = ctx.createLinearGradient(0, 0, 90, 0);
    g.addColorStop(0, c.mid);
    g.addColorStop(1, c.lo);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.quadraticCurveTo(45, -22, 92, 0);
    ctx.lineTo(80, 10);
    ctx.lineTo(90, 22);
    ctx.quadraticCurveTo(45, 8, 0, 14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = c.lo;
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = c.mid;
  ctx.strokeStyle = c.lo;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(338, 290, 19, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // head
  g = ctx.createRadialGradient(250, 150, 14, 280, 190, 120);
  g.addColorStop(0, PINK.hi);
  g.addColorStop(0.6, PINK.mid);
  g.addColorStop(1, PINK.lo);
  ctx.fillStyle = g;
  ctx.strokeStyle = PINK.dark;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(280, 190, 108, 90, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // blushing cheeks
  ctx.fillStyle = 'rgba(255,70,120,.38)';
  for (const x of [196, 364]) {
    ctx.beginPath();
    ctx.ellipse(x, 226, 24, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // eyes
  for (const [ex, ey] of [[238, 178], [322, 178]]) {
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#7a2a48';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(ex, ey, 29, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (pupils) pupil(ctx, ex, ey, lookX, lookY);
  }
  // brows: more anger = steeper
  ctx.strokeStyle = '#4a1a2c';
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  const t = 14 * anger;
  ctx.beginPath();
  ctx.moveTo(204, 132 - t * 0.1);
  ctx.lineTo(262, 138 + t * 0.9);
  ctx.moveTo(356, 132 - t * 0.1);
  ctx.lineTo(298, 138 + t * 0.9);
  ctx.stroke();

  // the big snout
  g = ctx.createLinearGradient(0, 196, 0, 262);
  g.addColorStop(0, '#ffd9e4');
  g.addColorStop(1, '#ff8fb2');
  ctx.fillStyle = g;
  ctx.strokeStyle = PINK.dark;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(280, 232, 60, 43, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#8f2347';
  for (const x of [260, 300]) {
    ctx.beginPath();
    ctx.ellipse(x, 232, 9.5, 15, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.beginPath();
  ctx.ellipse(262, 212, 18, 6, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // goofy open grin, tongue and one buck tooth
  ctx.fillStyle = '#7a1c3c';
  ctx.strokeStyle = '#4a1a2c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(220, 270);
  ctx.quadraticCurveTo(280, 332, 340, 270);
  ctx.quadraticCurveTo(280, 286, 220, 270);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ff6f94';
  ctx.beginPath();
  ctx.ellipse(296, 296, 20, 10, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#8a6a74';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(262, 277, 17, 19, [0, 0, 5, 5]);
  ctx.fill();
  ctx.stroke();

  if (chef) {
    // handlebar mustache over the grin
    ctx.strokeStyle = '#3a2418';
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.moveTo(280, 268);
    ctx.bezierCurveTo(250, 258, 216, 270, 208, 252);
    ctx.bezierCurveTo(204, 240, 220, 236, 224, 246);
    ctx.moveTo(280, 268);
    ctx.bezierCurveTo(310, 258, 344, 270, 352, 252);
    ctx.bezierCurveTo(356, 240, 340, 236, 336, 246);
    ctx.stroke();
    // chef's hat
    g = ctx.createLinearGradient(0, 20, 0, 118);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#d6d9ea');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#a8abc4';
    ctx.lineWidth = 4;
    for (const [x, y, r] of [[226, 78, 38], [334, 78, 38], [280, 56, 46]]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.roundRect(218, 90, 124, 40, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e83a2e';
    ctx.fillRect(220, 112, 120, 10);
  } else {
    // propeller beanie
    const dome = new Path2D();
    dome.moveTo(208, 116);
    dome.bezierCurveTo(206, 36, 354, 36, 352, 116);
    dome.closePath();
    g = ctx.createRadialGradient(256, 70, 8, 280, 90, 90);
    g.addColorStop(0, c.hi);
    g.addColorStop(0.6, c.mid);
    g.addColorStop(1, c.lo);
    ctx.fillStyle = g;
    ctx.fill(dome);
    ctx.save();
    ctx.clip(dome);
    ctx.strokeStyle = 'rgba(255,255,255,.4)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    for (const dx of [-44, 0, 44]) {
      ctx.moveTo(280, 40);
      ctx.quadraticCurveTo(280 + dx * 1.7, 80, 280 + dx * 1.3, 120);
    }
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = c.lo;
    ctx.lineWidth = 4;
    ctx.stroke(dome);
    ctx.fillStyle = c.lo;
    ctx.beginPath();
    ctx.roundRect(200, 108, 160, 18, 9);
    ctx.fill();
    ctx.fillStyle = '#ffe34a';
    ctx.strokeStyle = '#a07a0a';
    ctx.lineWidth = 3;
    ctx.fillRect(275, 44, 10, 14);
    ctx.beginPath();
    ctx.arc(280, 44, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

/** One (left) bat wing, drawn at the pivot origin, pointing left and up. */
export function drawPigWing(ctx, outfit = 'red') {
  const c = OUTFITS[outfit] ?? OUTFITS.red;
  const tips = [[-196, -96], [-172, -2], [-124, 54], [-60, 74]];
  const g = ctx.createLinearGradient(-190, -90, 0, 70);
  g.addColorStop(0, c.hi);
  g.addColorStop(0.55, c.mid);
  g.addColorStop(1, c.lo);
  ctx.fillStyle = g;
  ctx.strokeStyle = c.lo;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.quadraticCurveTo(-96, -76, tips[0][0], tips[0][1]);
  ctx.quadraticCurveTo(-164, -46, tips[1][0], tips[1][1]);
  ctx.quadraticCurveTo(-130, 14, tips[2][0], tips[2][1]);
  ctx.quadraticCurveTo(-78, 42, tips[3][0], tips[3][1]);
  ctx.quadraticCurveTo(-30, 40, 0, 26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // bones
  ctx.strokeStyle = c.lo;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const [x, y] of tips) {
    ctx.moveTo(0, 0);
    ctx.lineTo(x * 0.97, y * 0.97);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
  // little claw at the wing tip
  ctx.fillStyle = '#fff3d0';
  ctx.beginPath();
  ctx.arc(tips[0][0], tips[0][1], 7, 0, Math.PI * 2);
  ctx.fill();
}

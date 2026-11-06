// Touch/mouse: drag anywhere and the ship follows the finger, shown a little
// above it so the finger never hides the ship. Keyboard (desktop testing):
// arrows/WASD move, 1/2/3 pick a weapon, Q cycles, B or space = bomb, P = pause.

export const FINGER_OFFSET = 70;

export function createInput(canvas, { getView, onMove, onWeapon, onBomb, onPause }) {
  let pointerId = null;
  const keys = new Set();
  const state = { dragging: false, keyboard: false, kx: 180, ky: 520 };

  const toWorld = (e) => {
    const v = getView();
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left - v.ox) / v.scale, y: (e.clientY - r.top - v.oy) / v.scale };
  };

  canvas.addEventListener('pointerdown', (e) => {
    if (pointerId !== null) return;
    pointerId = e.pointerId;
    canvas.setPointerCapture?.(e.pointerId);
    state.dragging = true;
    const p = toWorld(e);
    onMove(p.x, p.y - FINGER_OFFSET);
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pointerId) return;
    const p = toWorld(e);
    onMove(p.x, p.y - FINGER_OFFSET);
    e.preventDefault();
  });
  const up = (e) => {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    state.dragging = false;
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'd', 'w', 's'].includes(k)) {
      keys.add(k);
      state.keyboard = true;
      e.preventDefault();
    } else if (k === '1') onWeapon('ion');
    else if (k === '2') onWeapon('neutron');
    else if (k === '3') onWeapon('vulcan');
    else if (k === 'q' || k === 'tab') {
      onWeapon();
      e.preventDefault();
    } else if (k === 'b' || k === ' ') {
      onBomb();
      e.preventDefault();
    } else if (k === 'p' || k === 'escape') onPause();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => keys.clear());

  /** Call once per frame with the ship's current position to apply keyboard movement. */
  state.update = (dt, shipX, shipY) => {
    if (!keys.size) return;
    if (!state.kx || state.dragging) {
      state.kx = shipX;
      state.ky = shipY;
    }
    const sp = 330 * dt;
    if (keys.has('arrowleft') || keys.has('a')) state.kx -= sp;
    if (keys.has('arrowright') || keys.has('d')) state.kx += sp;
    if (keys.has('arrowup') || keys.has('w')) state.ky -= sp;
    if (keys.has('arrowdown') || keys.has('s')) state.ky += sp;
    onMove(state.kx, state.ky);
  };
  return state;
}

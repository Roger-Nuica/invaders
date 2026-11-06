// Wires everything together: canvas sizing, the fixed-step game loop, input,
// audio, menus and the in-game buttons.
// Debug URL params: ?boss  ?wave=N  ?god  ?seed=N  ?autostart

import { createGame, step, setTarget, switchWeapon, useBomb } from './game.js';
import { createRenderer } from './render/renderer.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { WEAPONS, MAX_POWER } from './weapons.js';
import { clamp } from './math.js';

const params = new URLSearchParams(location.search);
const $ = (id) => document.getElementById(id);
const canvas = $('cv');
const renderer = createRenderer(canvas);
const audio = createAudio();
const DT = 1 / 60;
const W = 360;

let ui = 'menu'; // menu | playing | paused | over
let g = null;
let view = { cw: 360, ch: 640, dpr: 1, scale: 1, ox: 0, oy: 0, H: 640 };
let best = 0;
try {
  best = +localStorage.getItem('cc-best') || 0;
} catch { /* storage unavailable */ }

function resize() {
  const cw = window.innerWidth;
  const ch = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(cw * dpr);
  canvas.height = Math.round(ch * dpr);
  const H = clamp((W * ch) / cw, 560, 780);
  const scale = Math.min(cw / W, ch / H);
  view = { cw, ch, dpr, scale, ox: (cw - W * scale) / 2, oy: (ch - H * scale) / 2, H };
  if (g) {
    g.H = H;
    setTarget(g, g.target.x, g.target.y);
    g.ship.y = Math.min(g.ship.y, H - 28);
  }
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 120));
resize();

const input = createInput(canvas, {
  getView: () => view,
  onMove: (x, y) => {
    if (g && ui === 'playing') {
      setTarget(g, x, y);
      $('hint').classList.remove('show');
    }
  },
  onWeapon: (w) => ui === 'playing' && g && (switchWeapon(g, w), updateButtons(true)),
  onBomb: () => ui === 'playing' && g && useBomb(g),
  onPause: () => (ui === 'playing' ? pause() : ui === 'paused' && resume()),
});

function show(id, on) {
  $(id).classList.toggle('hidden', !on);
}

function setUi(next) {
  ui = next;
  document.body.classList.toggle('playing', next === 'playing');
  show('menu', next === 'menu');
  show('pauseScr', next === 'paused');
  show('endScr', next === 'over');
  audio.music(next === 'playing' ? (g?.boss ? 'boss' : 'wave') : next === 'paused' ? 'off' : 'off');
}

function start() {
  audio.unlock();
  g = createGame({
    seed: params.has('seed') ? +params.get('seed') : (Math.random() * 1e9) | 0,
    H: view.H,
    god: params.has('god'),
    start: params.has('boss') ? 'boss' : 'wave',
    wave: params.has('wave') ? clamp(+params.get('wave') - 1, 0, 3) : 0,
  });
  renderer.reset();
  $('hint').classList.add('show');
  updateButtons(true);
  setUi('playing');
}
function pause() {
  if (ui !== 'playing') return;
  setUi('paused');
}
function resume() {
  if (ui !== 'paused') return;
  setUi('playing');
  last = performance.now();
}
function toMenu() {
  g = null;
  renderer.reset();
  setUi('menu');
  refreshBest();
}

function refreshBest() {
  $('bestMenu').textContent = best ? `Cel mai bun scor: ${best}` : '';
}
refreshBest();

// buttons: pointerdown so they react instantly and work while another finger drags
const press = (id, fn) => $(id).addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); audio.unlock(); fn(); });
press('btnStart', start);
press('btnAgain', start);
press('btnResume', resume);
press('btnQuit', toMenu);
press('btnMenu2', toMenu);
press('btnPause', pause);
press('btnWeapon', () => ui === 'playing' && g && (switchWeapon(g), updateButtons(true)));
press('btnBomb', () => ui === 'playing' && g && useBomb(g));
press('btnMute', () => {
  $('btnMute').textContent = audio.toggleMute() ? '🔇' : '🔊';
});
$('btnMute').textContent = audio.muted ? '🔇' : '🔊';
document.addEventListener('visibilitychange', () => document.hidden && pause());
window.addEventListener('blur', pause);

const ICONS = { ion: '✦', neutron: '⚡', vulcan: '✸' };
const pips = $('wPips');
for (let i = 0; i < MAX_POWER; i++) pips.appendChild(document.createElement('i'));
let shown = { w: '', p: -1, b: -1 };
function updateButtons(force) {
  if (!g) return;
  if (force || shown.w !== g.weapon) {
    const w = WEAPONS[g.weapon];
    $('wName').textContent = w.name.toUpperCase();
    $('wIcon').textContent = ICONS[g.weapon];
    $('btnWeapon').style.setProperty('--wc', w.color);
  }
  if (force || shown.p !== g.power) [...pips.children].forEach((el, i) => el.classList.toggle('on', i < g.power));
  if (force || shown.b !== g.bombs) {
    $('bombCount').textContent = `×${g.bombs}`;
    $('btnBomb').classList.toggle('empty', g.bombs <= 0);
  }
  shown = { w: g.weapon, p: g.power, b: g.bombs };
}

function finish(result) {
  if (g.score > best) {
    best = g.score;
    try {
      localStorage.setItem('cc-best', String(best));
    } catch { /* ignore */ }
  }
  $('endTitle').textContent = result === 'won' ? 'Victorie!' : 'Game over';
  $('endSub').textContent = result === 'won' ? 'Găina Uriașă a fost învinsă. Galaxia e salvată!' : 'Găinile au câștigat... de data asta.';
  $('endScore').textContent = `Scor: ${g.score}`;
  $('endBest').textContent = `Cel mai bun: ${best}`;
  setTimeout(() => ui === 'playing' && setUi('over'), result === 'won' ? 1200 : 600);
}

// ---- loop ----
let last = performance.now();
let acc = 0;
let clock = 0;
let musicMode = '';

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  clock += dt;
  if (ui === 'playing' && g) {
    acc += dt;
    while (acc >= DT) {
      input.update(DT, g.ship.x, g.ship.y);
      step(g, DT);
      acc -= DT;
    }
    for (const ev of g.events) {
      audio.play(ev);
      if (ev.type === 'over') finish(ev.result);
    }
    const mm = g.boss && g.phase !== 'bossDying' ? 'boss' : g.over ? 'off' : 'wave';
    if (mm !== musicMode) audio.music((musicMode = mm));
    updateButtons(false);
    renderer.frame(g, view, clock, dt);
  } else if (ui === 'over' && g) {
    renderer.frame(g, view, clock, dt);
  } else if (ui === 'paused' && g) {
    renderer.frame(g, view, clock, 0);
  } else {
    renderer.menu(view, clock);
  }
}
requestAnimationFrame(frame);

if (params.has('autostart')) start();

// service worker: lets the game run offline once loaded
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !params.has('nosw')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// handy for tests / debugging
window.__game = { get g() { return g; }, get ui() { return ui; } };

// All sound is synthesised with WebAudio (no files to download): weapon pews,
// pig squawks, blob splats, explosions, jingles and a small looping backing track.

export function createAudio() {
  let ac = null;
  let master = null;
  let muted = false;
  try {
    muted = localStorage.getItem('cc-muted') === '1';
  } catch { /* storage unavailable */ }
  let musicMode = 'off';
  let step = 0;
  let nextTime = 0;
  let timer = null;
  let vulcanTick = 0;
  const last = {};

  function ensure() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ac = new AC();
      master = ac.createGain();
      master.gain.value = muted ? 0 : 0.8;
      master.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
    return true;
  }

  function tone({ f0, f1 = f0, dur = 0.1, type = 'sine', vol = 0.1, delay = 0, to }) {
    if (!ac) return;
    const t = ac.currentTime + delay;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(to ?? master);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  let noiseBuf = null;
  function noise({ dur = 0.2, vol = 0.2, f0 = 2000, f1 = 300, delay = 0, type = 'lowpass' }) {
    if (!ac) return;
    if (!noiseBuf) {
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = ac.currentTime + delay;
    const s = ac.createBufferSource();
    s.buffer = noiseBuf;
    s.loop = true;
    const f = ac.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(master);
    s.start(t);
    s.stop(t + dur + 0.03);
  }

  const throttle = (key, gap) => {
    if (!ac) return false;
    const n = ac.currentTime;
    if (last[key] && n - last[key] < gap) return false;
    last[key] = n;
    return true;
  };

  const sfx = {
    shoot(weapon) {
      if (weapon === 'ion') tone({ f0: 1100, f1: 380, dur: 0.09, type: 'triangle', vol: 0.05 });
      else if (weapon === 'neutron') tone({ f0: 520, f1: 190, dur: 0.14, type: 'sawtooth', vol: 0.035 });
      else if (++vulcanTick % 3 === 0) tone({ f0: 1500, f1: 800, dur: 0.04, type: 'square', vol: 0.025 });
    },
    hit() {
      if (throttle('hit', 0.04)) noise({ dur: 0.03, vol: 0.05, f0: 5000, f1: 2000, type: 'highpass' });
    },
    pigDie() {
      if (!throttle('pig', 0.03)) return;
      // a nasal "oink": two quick buzzy notes, then a snort
      const base = 190 + Math.random() * 90;
      tone({ f0: base * 1.5, f1: base * 0.9, dur: 0.1, type: 'sawtooth', vol: 0.06 });
      tone({ f0: base * 1.2, f1: base * 0.7, dur: 0.14, type: 'square', vol: 0.045, delay: 0.09 });
      noise({ dur: 0.1, vol: 0.06, f0: 2600, f1: 500, delay: 0.16, type: 'bandpass' });
    },
    blobSplat() {
      if (throttle('splat', 0.05)) noise({ dur: 0.14, vol: 0.12, f0: 900, f1: 160 });
    },
    blobSplit() {
      tone({ f0: 300, f1: 700, dur: 0.12, type: 'triangle', vol: 0.06 });
    },
    shipDie() {
      noise({ dur: 0.9, vol: 0.4, f0: 3500, f1: 80 });
      tone({ f0: 240, f1: 40, dur: 0.7, type: 'sawtooth', vol: 0.12 });
    },
    bomb() {
      noise({ dur: 1.1, vol: 0.45, f0: 5000, f1: 60 });
      tone({ f0: 90, f1: 30, dur: 0.9, type: 'sine', vol: 0.3 });
    },
    pickup(ev) {
      const base = ev.kind === 'gift' ? 660 : 520;
      [1, 1.25, 1.5, 2].forEach((m, i) => tone({ f0: base * m, dur: 0.12, type: 'triangle', vol: 0.08, delay: i * 0.06 }));
    },
    weapon() {
      tone({ f0: 500, f1: 900, dur: 0.08, type: 'square', vol: 0.05 });
    },
    bossWarn() {
      for (let i = 0; i < 4; i++) {
        tone({ f0: 420, f1: 760, dur: 0.38, type: 'sawtooth', vol: 0.07, delay: i * 0.45 });
        tone({ f0: 760, f1: 420, dur: 0.07, type: 'sawtooth', vol: 0.0001, delay: i * 0.45 + 0.38 });
      }
    },
    bossPhase() {
      noise({ dur: 0.5, vol: 0.3, f0: 2500, f1: 100 });
      tone({ f0: 200, f1: 70, dur: 0.5, type: 'sawtooth', vol: 0.12 });
    },
    bossDie() {
      for (let i = 0; i < 9; i++) noise({ dur: 0.5, vol: 0.3, f0: 3500, f1: 90, delay: i * 0.27 });
      tone({ f0: 120, f1: 25, dur: 2.6, type: 'sawtooth', vol: 0.15 });
    },
    over(ev) {
      const notes = ev.result === 'won' ? [523, 659, 784, 1047, 784, 1047] : [392, 349, 311, 262];
      notes.forEach((f, i) => tone({ f0: f, dur: 0.22, type: ev.result === 'won' ? 'triangle' : 'sawtooth', vol: 0.1, delay: i * 0.17 }));
    },
  };

  // backing track: bass + arpblobio, calmer for waves, tenser for the boss
  const SCALE = [0, 3, 7, 10, 12, 10, 7, 3];
  const BASS = [0, 0, -2, -2, -4, -4, -2, -2];
  function schedule() {
    if (!ac || musicMode === 'off') return;
    const bpm = musicMode === 'boss' ? 156 : 124;
    const dur = 60 / bpm / 2;
    while (nextTime < ac.currentTime + 0.25) {
      const i = step % 16;
      const root = musicMode === 'boss' ? 41 : 48;
      const note = (n) => 440 * 2 ** ((root + n - 69) / 12);
      const bar = Math.floor(step / 8) % 8;
      if (i % 2 === 0) {
        const f = note(BASS[bar]);
        const t0 = nextTime - ac.currentTime;
        tone({ f0: f, dur: dur * 1.6, type: 'triangle', vol: 0.08, delay: Math.max(0, t0) });
      }
      const f = note(SCALE[(i + bar) % 8] + 12);
      tone({ f0: f, dur: dur * 0.9, type: musicMode === 'boss' ? 'square' : 'triangle', vol: musicMode === 'boss' ? 0.018 : 0.025, delay: Math.max(0, nextTime - ac.currentTime) });
      nextTime += dur;
      step++;
    }
  }

  return {
    unlock: ensure,
    play(ev) {
      if (!ac || muted) return;
      sfx[ev.type]?.(ev.type === 'shoot' ? ev.weapon : ev);
    },
    shoot(weapon) {
      if (ac && !muted) sfx.shoot(weapon);
    },
    music(mode) {
      musicMode = mode;
      if (!ac) return;
      if (mode === 'off') {
        clearInterval(timer);
        timer = null;
        return;
      }
      if (!timer) {
        nextTime = ac.currentTime + 0.05;
        timer = setInterval(schedule, 60);
      }
    },
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      try {
        localStorage.setItem('cc-muted', muted ? '1' : '0');
      } catch { /* ignore */ }
      if (master) master.gain.value = muted ? 0 : 0.8;
      return muted;
    },
  };
}

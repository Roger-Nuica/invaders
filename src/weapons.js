// The three weapons. `power` (1..MAX_POWER) is the shared upgrade level the
// player raises by catching gifts dropped by the hens.
//  - Ion:     a fan of glowing bolts; more power = a wider fan.
//  - Neutron: thick plasma bolts that pierce through whole rows of hens.
//  - Vulcan:  a very fast, narrow stream of tracer rounds.

export const MAX_POWER = 6;
export const WEAPON_ORDER = ['ion', 'neutron', 'vulcan'];

export const WEAPONS = {
  ion: { name: 'Ion', color: '#5fd4ff' },
  neutron: { name: 'Neutron', color: '#7dff8a' },
  vulcan: { name: 'Vulcan', color: '#ffb23a' },
};

/** Seconds between two volleys. */
export function cooldownOf(weapon) {
  return weapon === 'neutron' ? 0.17 : weapon === 'vulcan' ? 0.06 : 0.26;
}

export function nextWeapon(weapon) {
  return WEAPON_ORDER[(WEAPON_ORDER.indexOf(weapon) + 1) % WEAPON_ORDER.length];
}

const bullet = (type, x, y, angle, speed, dmg, r, len, pierce) => ({
  type,
  x,
  y,
  vx: Math.sin(angle) * speed,
  vy: -Math.cos(angle) * speed,
  dmg,
  r,
  len,
  pierce,
  hit: pierce ? new Set() : null,
});

/** The bullets one volley creates, fired from the ship nose at (x, y). */
export function fire(weapon, power, x, y, rng) {
  const p = Math.max(1, Math.min(MAX_POWER, power));
  const out = [];
  if (weapon === 'ion') {
    const n = p;
    const spread = 0.07 * (n - 1);
    for (let i = 0; i < n; i++) {
      const a = n === 1 ? 0 : -spread + (2 * spread * i) / (n - 1);
      out.push(bullet('ion', x + Math.sin(a) * 6, y, a, 560, 1.1, 6, 12, false));
    }
  } else if (weapon === 'neutron') {
    const offsets = p >= 5 ? [-12, 0, 12] : p >= 3 ? [-7, 7] : [0];
    for (const dx of offsets) out.push(bullet('neutron', x + dx, y, 0, 700, 1.25 + 0.1 * (p - 1), 7, 34, true));
  } else {
    const offsets = p >= 5 ? [-9, 0, 9] : p >= 3 ? [-7, 7] : [0];
    for (const dx of offsets) {
      const a = (rng() - 0.5) * (0.06 + 0.01 * p);
      out.push(bullet('vulcan', x + dx, y, a, 760, 0.38 + 0.03 * p, 3.5, 16, false));
    }
  }
  return out;
}

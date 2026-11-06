import test from 'node:test';
import assert from 'node:assert/strict';
import { fire, cooldownOf, nextWeapon, MAX_POWER } from '../src/weapons.js';
import { mulberry32 } from '../src/math.js';

const rng = mulberry32(3);

test('ion fires one bolt per power level, fanned out symmetrically', () => {
  for (let p = 1; p <= MAX_POWER; p++) {
    const b = fire('ion', p, 100, 500, rng);
    assert.equal(b.length, p);
    const sumVx = b.reduce((s, q) => s + q.vx, 0);
    assert.ok(Math.abs(sumVx) < 1e-6);
    assert.ok(b.every((q) => q.vy < 0));
  }
});

test('neutron bolts pierce and widen to three columns at power 5', () => {
  assert.equal(fire('neutron', 1, 0, 0, rng).length, 1);
  assert.equal(fire('neutron', 3, 0, 0, rng).length, 2);
  const b = fire('neutron', 5, 0, 0, rng);
  assert.equal(b.length, 3);
  assert.ok(b.every((q) => q.pierce && q.hit instanceof Set));
});

test('vulcan is the fastest-firing weapon and ion the slowest', () => {
  assert.ok(cooldownOf('vulcan') < cooldownOf('neutron'));
  assert.ok(cooldownOf('neutron') < cooldownOf('ion'));
});

test('power is clamped and weapons cycle ion -> neutron -> vulcan -> ion', () => {
  assert.equal(fire('ion', 99, 0, 0, rng).length, MAX_POWER);
  assert.equal(fire('ion', -4, 0, 0, rng).length, 1);
  assert.equal(nextWeapon('ion'), 'neutron');
  assert.equal(nextWeapon('neutron'), 'vulcan');
  assert.equal(nextWeapon('vulcan'), 'ion');
});

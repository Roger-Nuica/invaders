// What a dead hen may leave behind.
//  gift      -> +1 weapon power (the thing you want)
//  drumstick -> bonus points
//  bomb      -> +1 bomb
// A "pity" counter guarantees a gift every so often so upgrades never dry up.

import { MAX_POWER } from './weapons.js';

export const PITY = 12;
export const DROP_VALUES = { drumstick: 250 };

/** Returns 'gift' | 'bomb' | 'drumstick' | null. `sinceGift` = kills since the last gift. */
export function rollDrop(rng, sinceGift, power) {
  if (power < MAX_POWER && sinceGift >= PITY) return 'gift';
  const r = rng();
  if (r < 0.06 && power < MAX_POWER) return 'gift';
  if (r < 0.075) return 'bomb';
  if (r < 0.3) return 'drumstick';
  return null;
}

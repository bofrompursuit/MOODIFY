function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Deterministic pseudo-random float in [0, 1), seeded by a string. Used to
 *  give each tile a stable "random" rotation/offset that doesn't jitter on
 *  re-render, but still looks scattered across tiles. */
export function seededRandom(seed: string): number {
  return (hashString(seed) % 10000) / 10000;
}

/** Deterministic pick from a fixed list of options, seeded by a string. */
export function seededPick<T>(seed: string, options: readonly T[]): T {
  return options[hashString(seed) % options.length];
}

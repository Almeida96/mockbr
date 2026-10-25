export function seededRandom(seed) {
  if (typeof seed !== 'string' && !(typeof seed === 'number' && Number.isSafeInteger(seed))) {
    throw new TypeError('Seed must be a string or a safe integer.');
  }
  const text = String(seed);
  if (!text.length || text.length > 128) throw new RangeError('Seed must contain 1 to 128 characters.');
  let state = 2166136261;
  for (const byte of new TextEncoder().encode(text)) state = Math.imul(state ^ byte, 16777619) >>> 0;
  return max => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return Math.floor(((value ^ value >>> 14) >>> 0) / 4294967296 * max);
  };
}

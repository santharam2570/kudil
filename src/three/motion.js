export const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

/** smooth 1D value noise in [-1, 1] */
export function noise(t, seed = 0) {
  const i = Math.floor(t)
  const f = t - i
  const u = f * f * (3 - 2 * f)
  return (hash(i + seed * 57.31) * (1 - u) + hash(i + 1 + seed * 57.31) * u) * 2 - 1
}

export const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x))

/** rise in over `a` seconds, hold, fall out over `b` seconds before `len` */
export const envelope = (u, len, a = 0.4, b = 0.4) => smooth(u / a) * (1 - smooth((u - (len - b)) / b))

/** which segment of a repeating routine we are in */
export function routine(t, segs) {
  const cycle = segs.reduce((s, [, d]) => s + d, 0)
  const u = ((t % cycle) + cycle) % cycle
  let acc = 0
  for (const [name, d] of segs) {
    if (u < acc + d) return { name, u: u - acc, len: d, k: (u - acc) / d }
    acc += d
  }
  return { name: segs[0][0], u: 0, len: segs[0][1], k: 0 }
}

/** the ammi kal stroke, shared by the grinding amma and the rolling stone */
export const GRIND_ROUTINE = [['grind', 10], ['sprinkle', 2.2], ['wipe', 2], ['smile', 2.4]]
export function grindStroke(t) {
  const r = routine(t, GRIND_ROUTINE)
  const p = Math.sin(t * 2.9 + noise(t * 0.3, 2) * 1.4)
  return { active: r.name === 'grind', p, r }
}

import { noise, smooth, envelope, routine, grindStroke } from './motion'

const set3 = (a, x, y, z) => {
  a[0] = x
  a[1] = y
  a[2] = z
}

/* -------- shared building blocks -------- */
function stand(t, P, c, amount = 1) {
  const s = c.seed
  const w = noise(t * 0.22, s) * amount
  P.hipsPos[0] = w * 0.02
  P.hips[2] = w * 0.03
  P.spine[2] = -w * 0.035
  P.lTh[2] = P.rTh[2] = -w * 0.022
  P.lKn[0] = 0.02 + Math.max(0, -w) * 0.2
  P.rKn[0] = 0.02 + Math.max(0, w) * 0.2
  P.lTh[0] = -Math.max(0, -w) * 0.09
  P.rTh[0] = -Math.max(0, w) * 0.09
  P.head[0] = noise(t * 0.28, s + 5) * 0.06
  P.head[1] = noise(t * 0.33, s + 3) * 0.16
  P.head[2] = noise(t * 0.2, s + 6) * 0.05
  P.spine[0] = noise(t * 0.18, s + 8) * 0.025
  set3(P.lHand.pos, 0.25 + noise(t * 0.3, s + 11) * 0.012, c.sy - 0.56, 0.05 + noise(t * 0.25, s + 12) * 0.025)
  set3(P.rHand.pos, -0.25 + noise(t * 0.31, s + 13) * 0.012, c.sy - 0.56, 0.05 + noise(t * 0.27, s + 14) * 0.025)
}

function sit(t, P, c) {
  const s = c.seed
  set3(P.lTh, -1.4, 0, 0.72)
  set3(P.rTh, -1.52, 0, -0.72)
  set3(P.lKn, 2.95, 0, -0.98)
  set3(P.rKn, 2.95, 0, 0.98)
  P.hips[0] = 0.05
  P.spine[0] = 0.1 + noise(t * 0.2, s + 8) * 0.03
  P.spine[2] = noise(t * 0.17, s + 9) * 0.03
  P.head[0] = noise(t * 0.28, s + 5) * 0.06
  P.head[1] = noise(t * 0.33, s + 3) * 0.15
  P.head[2] = noise(t * 0.2, s + 6) * 0.05
  set3(P.lHand.pos, 0.27, c.hipY + 0.05, 0.27)
  set3(P.rHand.pos, -0.27, c.hipY + 0.05, 0.27)
  P.lHand.pole = [1, 0.4, -0.3]
  P.rHand.pole = [-1, 0.4, -0.3]
  P.lHand.curl = P.rHand.curl = 0.45
}

const glance = (t, c, every = 0.18, thr = 0.45) => (noise(t * every, c.seed + 20) > thr ? 0.9 : 0.05)
const chatter = (t, c, amt = 1) => (noise(t * 0.9, c.seed + 30) > -0.2 ? amt : 0)

/* -------- behaviours -------- */
export const BEHAVIORS = {
  idle(t, P, c) {
    if (c.sitting) sit(t, P, c)
    else stand(t, P, c)
    P.look = 0.4 + 0.5 * Math.max(0, noise(t * 0.15, c.seed + 40))
    P.smile = 0.4
  },

  /* biryani master stirring the big handi */
  chef(t, P, c) {
    stand(t, P, c, 0.6)
    const pot = c.params.pot
    const r = routine(t, [['stir', 11], ['wipe', 3.2], ['greet', 4.2], ['stir', 2]])
    const a = t * 1.9 + noise(t * 0.25, c.seed) * 1.8
    const rest = [pot[0], pot[1] + 0.3, pot[2] - 0.12]
    P.aim = [pot[0], pot[1] - 0.15, pot[2]]
    P.rHand.curl = 0.85
    P.rHand.pole = [-1, -0.3, -0.7]
    P.rHand.stiff = 140
    if (r.name === 'stir') {
      set3(P.rHand.pos, pot[0] + Math.cos(a) * 0.09, pot[1] + 0.3 + Math.sin(a * 2) * 0.015, pot[2] - 0.1 + Math.sin(a) * 0.09)
      P.aim = [pot[0] + Math.cos(a) * 0.2, pot[1] - 0.12, pot[2] + Math.sin(a) * 0.2]
      P.spine[0] = 0.24 + Math.sin(a) * 0.025
      P.spine[1] = -0.12 + Math.sin(a) * 0.07
      P.hips[1] = Math.sin(a) * 0.025
      P.head[0] = 0.32
      P.head[1] += -0.2
      P.look = glance(t, c)
      P.talk = c.speaking ? chatter(t, c, 0.8) : 0
      P.smile = 0.35
      set3(P.lHand.pos, 0.26, c.sy - 0.52, 0.12)
    } else if (r.name === 'wipe') {
      const e = envelope(r.u, r.len, 0.5, 0.6)
      set3(P.rHand.pos, ...rest)
      set3(P.lHand.pos, 0.04 + Math.sin(r.u * 7) * 0.045 * e, c.sy + (0.28 * e - 0.52 * (1 - e)), 0.17 * e + 0.08 * (1 - e))
      P.lHand.pole = [1, 0, -0.3]
      P.lHand.curl = 0.5
      P.spine[0] = 0.06
      P.head[0] = -0.12 * e
      P.lid = 0.45 * e
      P.brow = 0.6 * e
      P.smile = 0.1
    } else {
      const e = envelope(r.u, r.len, 0.6, 0.6)
      set3(P.rHand.pos, ...rest)
      P.spine[0] = -0.03
      P.look = 1
      P.smile = 1
      P.brow = 0.4
      P.head[0] += Math.max(0, Math.sin(r.u * 5)) * 0.12 * (r.u < 1.6 ? 1 : 0)
      set3(P.lHand.pos, 0.3 * e + 0.26 * (1 - e), c.sy - 0.22 * e - 0.52 * (1 - e), 0.3 * e + 0.12 * (1 - e))
      P.lHand.pole = [1, -0.6, -0.4]
      P.lHand.curl = 0.1
      P.lWr[1] = 1.2 * e
      P.talk = c.speaking ? 1 : 0.4 * e
    }
  },

  /* welcoming with folded hands */
  welcome(t, P, c) {
    stand(t, P, c)
    const segs = c.params.male ? [['namaste', 5], ['clasp', 7]] : [['namaste', 5], ['clasp', 5], ['pallu', 1.8], ['clasp', 2.2]]
    const r = routine(t, segs)
    P.look = 0.9
    P.smile = 0.85
    P.lHand.pole = [1, -0.2, -0.7]
    P.rHand.pole = [-1, -0.2, -0.7]
    if (r.name === 'namaste') {
      const e = envelope(r.u, r.len, 0.7, 0.7)
      const lerp = (a, b) => a * (1 - e) + b * e
      set3(P.lHand.pos, lerp(0.05, 0.028), lerp(c.sy - 0.48, c.sy - 0.2), lerp(0.18, 0.2))
      set3(P.rHand.pos, lerp(-0.05, -0.028), lerp(c.sy - 0.48, c.sy - 0.2), lerp(0.18, 0.2))
      P.lHand.pole = [1, -0.7, -0.3]
      P.rHand.pole = [-1, -0.7, -0.3]
      P.lHand.curl = P.rHand.curl = 0.04
      const bow = smooth((r.u - 0.8) / 0.5) * (1 - smooth((r.u - 1.9) / 0.6))
      P.spine[0] += bow * 0.28
      P.head[0] += bow * 0.22
      P.lid = bow * 0.35
      P.talk = c.speaking && r.u > 0.7 && r.u < 2 ? 1 : 0
    } else if (r.name === 'pallu') {
      const e = envelope(r.u, r.len, 0.5, 0.5)
      set3(P.rHand.pos, -0.25 * (1 - e) + 0.12 * e, (c.sy - 0.5) * (1 - e) + (c.sy + 0.02) * e, 0.06 * (1 - e) + 0.13 * e)
      P.rHand.pole = [-1, -0.6, -0.2]
      P.rHand.curl = 0.6
      P.head[1] = 0.3 * e
      P.head[0] = 0.2 * e
      P.look = 0.2
    } else {
      set3(P.lHand.pos, 0.03, c.sy - 0.5, 0.16)
      set3(P.rHand.pos, -0.03, c.sy - 0.5, 0.16)
      P.lHand.curl = P.rHand.curl = 0.6
      P.head[2] += noise(t * 0.4, c.seed + 2) * 0.08
    }
  },

  /* amma grinding masala on the ammi kal */
  grind(t, P, c) {
    stand(t, P, c, 0.3)
    const { p, r } = grindStroke(t)
    const roller = c.params.roller
    const amp = c.params.amp || 0.1
    const onRoller = (side, phase) => [side * 0.13, roller[1] + 0.02, roller[2] + phase * amp]
    P.lHand.pole = [1, 0, -1]
    P.rHand.pole = [-1, 0, -1]
    P.lHand.curl = P.rHand.curl = 0.65
    P.lHand.stiff = P.rHand.stiff = 170
    P.smile = 0.4
    if (r.name === 'grind') {
      set3(P.lHand.pos, ...onRoller(1, p))
      set3(P.rHand.pos, ...onRoller(-1, p))
      P.hips[0] = 0.12 + p * 0.04
      P.spine[0] = 0.32 + p * 0.13
      P.head[0] = 0.12 - p * 0.05
      P.look = glance(t, c, 0.2, 0.55)
      P.talk = c.speaking ? chatter(t, c, 0.7) : 0
    } else if (r.name === 'sprinkle') {
      set3(P.lHand.pos, ...onRoller(1, 0))
      set3(P.rHand.pos, -0.42, roller[1] + 0.06 + Math.abs(Math.sin(r.u * 6)) * 0.08, roller[2] - 0.12)
      P.rHand.curl = 0.3
      P.rWr[0] = Math.sin(r.u * 12) * 0.35
      P.hips[0] = 0.1
      P.spine[0] = 0.25
      P.spine[1] = -0.22
      P.head[1] = -0.4
      P.head[0] = 0.25
    } else if (r.name === 'wipe') {
      const e = envelope(r.u, r.len, 0.5, 0.5)
      set3(P.lHand.pos, ...onRoller(1, 0))
      set3(P.rHand.pos, -0.02 + Math.sin(r.u * 6) * 0.04 * e, c.sy + 0.28 * e - 0.4 * (1 - e), 0.16 * e + 0.3 * (1 - e))
      P.rHand.pole = [-1, 0, -0.3]
      P.rHand.curl = 0.4
      P.spine[0] = 0.1
      P.lid = 0.4 * e
      P.brow = 0.6 * e
    } else {
      set3(P.lHand.pos, ...onRoller(1, 0))
      set3(P.rHand.pos, ...onRoller(-1, 0))
      P.hips[0] = 0.08
      P.spine[0] = 0.18
      P.look = 1
      P.smile = 1
      P.talk = c.speaking ? 1 : 0.3
    }
  },

  /* server at the counter presenting the selected dish */
  present(t, P, c) {
    stand(t, P, c, 0.6)
    const { dish, counter } = c.params
    const r = routine(t, [['present', 4.2], ['lean', 3], ['explain', 4], ['present', 2]])
    P.smile = 0.75
    if (r.name === 'present') {
      set3(P.lHand.pos, 0.3, c.sy - 0.3, 0.4)
      P.lHand.pole = [1, -1, -0.2]
      P.lHand.curl = 0.08
      P.lWr[1] = 1.4
      set3(P.rHand.pos, counter[0] - 0.18, counter[1] + 0.04, counter[2])
      P.rHand.pole = [-1, 0.3, -0.6]
      P.rHand.curl = 0.3
      const atDish = r.u % 2.8 < 1.3
      P.look = atDish ? 0 : 1
      if (atDish) {
        P.head[1] = Math.atan2(dish[0], dish[2]) * 0.8
        P.head[0] = 0.35
      }
      P.talk = c.speaking ? chatter(t, c, 1) : 0.3
    } else if (r.name === 'lean') {
      set3(P.lHand.pos, counter[0] + 0.18, counter[1] + 0.04, counter[2])
      set3(P.rHand.pos, counter[0] - 0.18, counter[1] + 0.04, counter[2])
      P.lHand.pole = [1, 0.3, -0.6]
      P.rHand.pole = [-1, 0.3, -0.6]
      P.lHand.curl = P.rHand.curl = 0.3
      P.spine[0] = 0.18
      P.look = 1
      P.smile = 0.95
      P.head[0] += Math.max(0, Math.sin(r.u * 4.5)) * 0.1 * (r.u < 1.4 ? 1 : 0)
      P.talk = c.speaking ? chatter(t, c, 0.6) : 0
    } else {
      const n1 = noise(t * 1.3, c.seed + 50)
      const n2 = noise(t * 1.1, c.seed + 60)
      set3(P.lHand.pos, 0.2 + n1 * 0.06, c.sy - 0.34 + n2 * 0.08, 0.3 + n1 * 0.05)
      set3(P.rHand.pos, -0.2 + n2 * 0.06, c.sy - 0.34 + n1 * 0.08, 0.3 + n2 * 0.05)
      P.lHand.pole = [1, -0.8, -0.3]
      P.rHand.pole = [-1, -0.8, -0.3]
      P.lHand.curl = 0.15 + Math.max(0, n1) * 0.3
      P.rHand.curl = 0.15 + Math.max(0, n2) * 0.3
      P.lWr[1] = 0.9
      P.rWr[1] = -0.9
      P.look = 1
      P.brow = Math.max(0, n1) * 0.6
      P.head[2] += n2 * 0.08
      P.talk = c.speaking ? 1 : 0.6
    }
  },

  /* eating biryani from the banana leaf, Tamil style */
  eat(t, P, c) {
    sit(t, P, c)
    const leaf = c.params.leaf
    const nb = c.params.neighbor || 1
    const r = routine(t, [['mix', 2.4 + (c.seed % 3) * 0.3], ['lift', 0.9], ['chew', 1.9], ['chat', 2.6]])
    P.rHand.pole = [-1, 0.3, -0.3]
    P.rHand.stiff = 110
    P.smile = 0.5
    if (r.name === 'mix') {
      set3(P.rHand.pos, leaf[0] - 0.03 + Math.cos(t * 5) * 0.04, leaf[1] + 0.05, leaf[2] - 0.02 + Math.sin(t * 5) * 0.03)
      P.rHand.curl = 0.55
      P.spine[0] = 0.42
      P.head[0] = 0.4
      P.look = 0
    } else if (r.name === 'lift') {
      set3(P.rHand.pos, -0.015, c.sy + 0.2, 0.2)
      P.rHand.pole = [-1, -0.5, -0.2]
      P.rHand.curl = 0.8
      P.spine[0] = 0.2
      P.head[0] = 0.12
    } else if (r.name === 'chew') {
      set3(P.rHand.pos, leaf[0] - 0.06, leaf[1] + 0.08, leaf[2] - 0.08)
      P.rHand.curl = 0.6
      P.chew = 1
      P.spine[0] = 0.15
      P.look = 0.6
      P.smile = 0.7
    } else {
      P.head[1] = nb * 0.6
      P.neck[1] = nb * 0.3
      P.smile = 0.85
      P.talk = (c.seed % 2 ? r.u < 1.3 : r.u >= 1.3) ? 0.9 : 0
      set3(P.lHand.pos, 0.24, c.sy - 0.22, 0.3)
      P.lHand.curl = 0.2
      P.lWr[1] = 1
      if (c.speaking) {
        P.look = 1
        P.head[1] = 0
        P.neck[1] = 0
        P.talk = 1
      }
      set3(P.rHand.pos, leaf[0] - 0.06, leaf[1] + 0.08, leaf[2] - 0.08)
    }
  },

  /* the kid: eats, laughs, waves at you */
  kid(t, P, c) {
    sit(t, P, c)
    const leaf = c.params.leaf
    const r = routine(t, [['mix', 1.6], ['lift', 0.7], ['chew', 1.2], ['laugh', 1.8], ['wave', 2.8]])
    P.rHand.pole = [-1, 0.3, -0.3]
    P.smile = 0.8
    if (r.name === 'mix') {
      set3(P.rHand.pos, leaf[0] + Math.cos(t * 7) * 0.04, leaf[1] + 0.05, leaf[2] + Math.sin(t * 7) * 0.03)
      P.rHand.curl = 0.55
      P.spine[0] = 0.4
      P.head[0] = 0.35
    } else if (r.name === 'lift') {
      set3(P.rHand.pos, -0.015, c.sy + 0.2, 0.2)
      P.rHand.curl = 0.8
      P.spine[0] = 0.15
    } else if (r.name === 'chew') {
      P.chew = 1
      P.look = 1
      set3(P.rHand.pos, leaf[0] - 0.05, leaf[1] + 0.08, leaf[2] - 0.06)
    } else if (r.name === 'laugh') {
      P.spine[0] = -0.12 + Math.sin(t * 16) * 0.035
      P.head[0] = -0.25
      P.smile = 1
      P.talk = 0.9
      P.lid = 0.5
      set3(P.lHand.pos, 0.06, c.sy - 0.32, 0.2)
      P.lHand.curl = 0.5
    } else {
      set3(P.rHand.pos, -0.3, c.sy + 0.3, 0.14)
      P.rHand.pole = [-1, -1, 0]
      P.rHand.curl = 0.02
      P.rWr[2] = Math.sin(t * 9) * 0.5
      P.look = 1
      P.smile = 1
      P.brow = 0.6
      P.talk = c.speaking ? 1 : 0
    }
  },

  /* paati serving from the handi */
  serve(t, P, c) {
    stand(t, P, c, 0.5)
    const pot = c.params.pot
    const r = routine(t, [['scoop', 4], ['look', 3.2], ['scoop', 2.8]])
    P.rHand.curl = 0.85
    P.rHand.pole = [-1, -0.3, -0.7]
    if (r.name === 'scoop') {
      const k = Math.sin(r.u * 1.6)
      set3(P.rHand.pos, pot[0] + k * 0.06, pot[1] + 0.3 + Math.max(0, k) * 0.08, pot[2] - 0.12)
      P.aim = [pot[0] + k * 0.15, pot[1] - 0.12 + Math.max(0, k) * 0.12, pot[2] + 0.05]
      P.spine[0] = 0.3
      P.head[0] = 0.35
      set3(P.lHand.pos, 0.2, c.sy - 0.45, 0.2)
      P.lHand.curl = 0.5
    } else {
      set3(P.rHand.pos, pot[0], pot[1] + 0.3, pot[2] - 0.12)
      P.aim = [pot[0], pot[1] - 0.15, pot[2]]
      P.spine[0] = 0.05
      P.look = 1
      P.smile = 1
      P.talk = envelope(r.u, r.len, 0.5, 1) * chatter(t, c, 0.8)
      set3(P.lHand.pos, 0.28, c.sy - 0.28, 0.25)
      P.lHand.pole = [1, -0.6, -0.4]
      P.lHand.curl = 0.1
      P.lWr[1] = 1.2
    }
  },

  /* walking with a handi on the head */
  walkCarry(t, P, c) {
    const ph = t * (c.params.rate || 3.4)
    const sn = Math.sin(ph)
    const cs = Math.cos(ph)
    P.lTh[0] = -0.42 * sn
    P.rTh[0] = 0.42 * sn
    P.lKn[0] = 0.08 + Math.max(0, cs) * 0.85
    P.rKn[0] = 0.08 + Math.max(0, -cs) * 0.85
    P.lAn[0] = 0.42 * sn * 0.5 - Math.max(0, cs) * 0.3
    P.rAn[0] = -0.42 * sn * 0.5 - Math.max(0, -cs) * 0.3
    P.hipsPos[1] = -0.03 + 0.022 * Math.cos(2 * ph)
    P.hips[1] = 0.1 * sn
    P.hips[2] = 0.03 * cs
    P.spine[1] = -0.14 * sn
    P.spine[0] = 0.03
    P.head[1] = 0.1 * sn + noise(t * 0.4, c.seed) * 0.15
    set3(P.rHand.pos, -0.25, c.sy - 0.54, 0.05 + 0.17 * sn)
    P.rHand.pole = [-1, 0, -1]
    P.rHand.stiff = 220
    P.rHand.curl = 0.45
    set3(P.lHand.pos, 0.13, c.sy + 0.52, 0.02)
    P.lHand.pole = [1, -0.1, 0.2]
    P.lHand.curl = 0.55
    P.lHand.stiff = 150
    P.look = glance(t, c, 0.2, 0.3) * 0.7
    P.smile = 0.6
    P.talk = c.speaking ? chatter(t, c, 1) : 0
  },

  /* reaction when tapped */
  wave(t, P, c) {
    if (c.sitting) sit(t, P, c)
    else stand(t, P, c, 0.4)
    set3(P.rHand.pos, -0.32, c.sy + 0.3, 0.12)
    P.rHand.pole = [-1, -1, 0]
    P.rHand.curl = 0.02
    P.rHand.stiff = 130
    P.rWr[2] = Math.sin(t * 9) * 0.45
    P.look = 1
    P.smile = 1
    P.brow = 0.6
    P.talk = 0.5
  },
}

import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { checkTexture } from './textures'
import { sceneStore } from '../store'
import { BEHAVIORS } from './behaviors'
import { hash, noise } from './motion'

export const SKIN = {
  dark: '#5a321a',
  brown: '#7b4724',
  wheat: '#965c34',
  light: '#a96f45',
}

/* ---------------- shared geometry ---------------- */
const lathe = (pts, seg = 20) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg)
let GEO
function geo() {
  if (GEO) return GEO
  GEO = {
    sphere: new THREE.SphereGeometry(1, 24, 18),
    sphereLow: new THREE.SphereGeometry(1, 12, 10),
    upperArm: lathe([[0.001, 0.02], [0.05, 0.01], [0.056, -0.04], [0.052, -0.14], [0.044, -0.25], [0.04, -0.29], [0.001, -0.3]]),
    forearm: lathe([[0.001, 0.01], [0.042, 0], [0.046, -0.06], [0.039, -0.17], [0.029, -0.27], [0.027, -0.29], [0.001, -0.3]]),
    thigh: lathe([[0.001, 0.02], [0.088, 0], [0.09, -0.08], [0.074, -0.28], [0.056, -0.42], [0.001, -0.44]]),
    shin: lathe([[0.001, 0.02], [0.055, 0], [0.058, -0.1], [0.046, -0.24], [0.032, -0.4], [0.03, -0.43], [0.001, -0.44]]),
    finger: new THREE.CapsuleGeometry(0.0085, 0.022, 3, 8),
    fingerTip: new THREE.CapsuleGeometry(0.0078, 0.016, 3, 8),
    neck: lathe([[0.055, -0.03], [0.05, 0.04], [0.052, 0.1]], 16),
    lidCap: new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    hairCap: new THREE.SphereGeometry(1, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.56),
    lip: new THREE.TorusGeometry(1, 0.22, 6, 18, Math.PI),
    circle: new THREE.CircleGeometry(1, 20),
    chappal: new THREE.CylinderGeometry(1, 1, 1, 20),
  }
  return GEO
}

function torsoGeo(female, belly) {
  const b = belly * 0.05
  const pts = female
    ? [[0.001, -0.06], [0.17, -0.05], [0.175, 0.02], [0.15, 0.14], [0.142, 0.22], [0.165, 0.33], [0.18, 0.41], [0.175, 0.48], [0.13, 0.56], [0.06, 0.6], [0.001, 0.61]]
    : [[0.001, -0.06], [0.165, -0.05], [0.168, 0.02], [0.158 + b, 0.13], [0.162 + b, 0.22], [0.182, 0.34], [0.198, 0.44], [0.19, 0.51], [0.14, 0.57], [0.065, 0.61], [0.001, 0.62]]
  const g = lathe(pts, 28)
  g.scale(1, 1, 0.68)
  return g
}

function skirtGeo(length, flare) {
  return lathe([[0.17, 0.02], [0.178, -0.08], [0.2, -length * 0.4], [flare, -length]], 28)
}

/* ---------------- ribbon (saree pallu, towel) ---------------- */
function ribbonGeo(points, width) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)))
  const n = 40
  const pos = []
  const idx = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const p = curve.getPointAt(t)
    const tan = curve.getTangentAt(t)
    const radial = new THREE.Vector3(p.x, 0, p.z / 0.68).normalize()
    const side = new THREE.Vector3().crossVectors(tan, radial)
    if (side.lengthSq() < 1e-4) side.crossVectors(tan, new THREE.Vector3(0, 1, 0))
    if (side.lengthSq() < 1e-4) side.set(1, 0, 0)
    side.normalize().multiplyScalar(width / 2)
    pos.push(p.x - side.x, p.y - side.y, p.z - side.z, p.x + side.x, p.y + side.y, p.z + side.z)
    if (i < n) {
      const a = i * 2
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  const nrm = g.attributes.normal
  for (let i = 0; i < nrm.count; i++) {
    if (Math.hypot(nrm.getX(i), nrm.getY(i), nrm.getZ(i)) < 1e-4 || Number.isNaN(nrm.getX(i))) nrm.setXYZ(i, 0, 0, 1)
  }
  return g
}

/* ---------------- springs ---------------- */

const FK = ['hips', 'spine', 'chest', 'neck', 'head', 'lTh', 'lKn', 'lAn', 'rTh', 'rKn', 'rAn', 'lWr', 'rWr']
const STIFF = { hips: 40, spine: 50, chest: 60, neck: 55, head: 70, lTh: 400, lKn: 400, lAn: 400, rTh: 400, rKn: 400, rAn: 400, lWr: 120, rWr: 120 }

function makePose() {
  const p = { hipsPos: [0, 0, 0], look: 0, smile: 0.25, talk: 0, lid: 0, brow: 0, chew: 0 }
  FK.forEach((k) => (p[k] = [0, 0, 0]))
  p.lHand = { pos: [0.27, 0.9, 0.04], pole: [1, -0.2, -1], curl: 0.35, stiff: 90 }
  p.rHand = { pos: [-0.27, 0.9, 0.04], pole: [-1, -0.2, -1], curl: 0.35, stiff: 90 }
  return p
}
function resetPose(p, sy) {
  p.hipsPos[0] = p.hipsPos[1] = p.hipsPos[2] = 0
  p.look = 0
  p.smile = 0.25
  p.talk = 0
  p.lid = 0
  p.brow = 0
  p.chew = 0
  p.aim = null
  FK.forEach((k) => (p[k][0] = p[k][1] = p[k][2] = 0))
  p.lHand.pos = [0.27, sy - 0.55, 0.04]
  p.rHand.pos = [-0.27, sy - 0.55, 0.04]
  p.lHand.pole = [1, -0.2, -1]
  p.rHand.pole = [-1, -0.2, -1]
  p.lHand.curl = p.rHand.curl = 0.35
  p.lHand.stiff = p.rHand.stiff = 90
}

const L1 = 0.29
const L2 = 0.29
const _v = {
  S: new THREE.Vector3(), T: new THREE.Vector3(), P: new THREE.Vector3(), d: new THREE.Vector3(),
  E: new THREE.Vector3(), u: new THREE.Vector3(), f: new THREE.Vector3(), w: new THREE.Vector3(),
  X: new THREE.Vector3(), Y: new THREE.Vector3(), m: new THREE.Matrix4(), q: new THREE.Quaternion(),
  inv: new THREE.Matrix4(), cam: new THREE.Vector3(), tmp: new THREE.Vector3(),
}

/** two-bone IK. shoulder: Object3D whose parent is the chest. target/pole in root space. */
function solveArm(root, shoulder, elbow, target, pole) {
  const { S, T, P, d, E, u, f, w, X, Y, m, inv } = _v
  const chest = shoulder.parent
  inv.copy(chest.matrixWorld).invert()
  T.set(...target).applyMatrix4(root.matrixWorld).applyMatrix4(inv)
  // pole as a direction: transform two points
  P.set(...pole).add(_v.tmp.set(...target)).applyMatrix4(root.matrixWorld).applyMatrix4(inv).sub(T)
  S.copy(shoulder.position)
  d.subVectors(T, S)
  let dist = d.length()
  dist = Math.min(Math.max(dist, 0.08), L1 + L2 - 0.001)
  d.normalize()
  const cosA = (L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist)
  const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA))
  P.addScaledVector(d, -P.dot(d))
  if (P.lengthSq() < 1e-6) P.set(0, 0, -1).addScaledVector(d, -d.z)
  P.normalize()
  E.copy(S).addScaledVector(d, L1 * cosA).addScaledVector(P, L1 * sinA)
  u.subVectors(E, S).normalize()
  T.copy(S).addScaledVector(d, dist)
  f.subVectors(T, E).normalize()
  w.copy(f).addScaledVector(u, -f.dot(u))
  if (w.lengthSq() < 1e-6) w.copy(P).multiplyScalar(-1)
  w.normalize()
  Y.copy(u).multiplyScalar(-1)
  X.crossVectors(Y, w)
  m.makeBasis(X, Y, w)
  shoulder.quaternion.setFromRotationMatrix(m)
  elbow.rotation.set(-Math.acos(Math.min(1, Math.max(-1, u.dot(f)))), 0, 0)
}

/* ---------------- Hand ---------------- */
const FINGER_Z = [0.026, 0.009, -0.008, -0.024]
const FINGER_LEN = [1, 1.08, 1.02, 0.85]
function Hand({ side, m, curlRef, children }) {
  const g = geo()
  const base = useRef([])
  const tip = useRef([])
  const thumb = useRef()
  useFrame(() => {
    const c = curlRef.current
    for (let i = 0; i < 4; i++) {
      const b = base.current[i]
      const tp = tip.current[i]
      if (!b || !tp) continue
      const k = c * (1 + i * 0.08)
      b.rotation.z = -side * k * 1.1
      tp.rotation.z = -side * k * 1.3
    }
    if (thumb.current) thumb.current.rotation.z = -side * (0.15 + c * 0.6)
  })
  return (
    <group>
      <mesh geometry={g.sphere} material={m.skin} position={[0, -0.045, 0]} scale={[0.02, 0.05, 0.042]} />
      {FINGER_Z.map((z, i) => (
        <group key={i} position={[0, -0.085, z]} ref={(el) => (base.current[i] = el)}>
          <mesh geometry={g.finger} material={m.skin} position-y={-0.019 * FINGER_LEN[i]} scale={[1, FINGER_LEN[i], 1]} />
          <group position-y={-0.04 * FINGER_LEN[i]} ref={(el) => (tip.current[i] = el)}>
            <mesh geometry={g.fingerTip} material={m.skin} position-y={-0.014} />
          </group>
        </group>
      ))}
      <group ref={thumb} position={[-side * 0.008, -0.03, 0.036]} rotation-x={-0.7}>
        <mesh geometry={g.finger} material={m.skin} position-y={-0.02} />
        <mesh geometry={g.fingerTip} material={m.skin} position-y={-0.045} />
      </group>
      {children}
    </group>
  )
}

/* ---------------- Person ---------------- */
export function Person({
  skin = SKIN.brown,
  outfit = 'veshti', // veshti | lungi | saree | shorts
  top = '#ffffff',
  shirt = 'shirt', // shirt | banian | blouse | none
  bottom = '#f6f1e3',
  border = '#d4a017',
  check = null,
  female = false,
  mustache = !female,
  towel = false,
  belly = 0,
  sitting = false,
  folded = false, // lungi folded up to the knee
  hair = '#0c0705',
  elder = false,
  kid = false,
  scale = 1,
  pottu = true,
  behavior = 'idle',
  params = {},
  talkStation = -1,
  rightHand,
  leftHand,
  headItem,
  seed = 1,
  ...props
}) {
  const g = geo()
  const clock = useThree((st) => st.clock)
  const r = useRef({})
  const reg = (k) => (el) => (r.current[k] = el)
  const curlL = useRef(0.35)
  const curlR = useRef(0.35)
  const state = useRef(null)

  const m = useMemo(() => {
    const lungiTex = check ? checkTexture(check, bottom) : null
    const cloth = (c, extra = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.85, side: THREE.DoubleSide, sheen: 0.6, sheenRoughness: 0.7, sheenColor: new THREE.Color(c).lerp(new THREE.Color('#ffffff'), 0.4), ...extra })
    return {
      skin: new THREE.MeshPhysicalMaterial({ color: skin, roughness: 0.5, sheen: 0.4, sheenColor: '#ff9b7a', sheenRoughness: 0.5, emissive: skin, emissiveIntensity: 0.06 }),
      lips: new THREE.MeshStandardMaterial({ color: new THREE.Color(skin).lerp(new THREE.Color('#5a1010'), 0.45), roughness: 0.4 }),
      mouth: new THREE.MeshBasicMaterial({ color: '#2a0806' }),
      hair: new THREE.MeshPhysicalMaterial({ color: hair, roughness: 0.45, sheen: 0.8, sheenColor: '#3a2a20', clearcoat: 0.2 }),
      top: cloth(top),
      bottom: lungiTex ? cloth('#ffffff', { map: lungiTex }) : cloth(bottom),
      border: new THREE.MeshStandardMaterial({ color: border, metalness: 0.55, roughness: 0.35 }),
      gold: new THREE.MeshStandardMaterial({ color: '#e2a83a', metalness: 0.95, roughness: 0.22 }),
      silver: new THREE.MeshStandardMaterial({ color: '#d8d8d8', metalness: 0.95, roughness: 0.25 }),
      eyeWhite: new THREE.MeshStandardMaterial({ color: '#f4efe6', roughness: 0.15 }),
      iris: new THREE.MeshStandardMaterial({ color: '#2a1408', roughness: 0.2 }),
      pupil: new THREE.MeshBasicMaterial({ color: '#000000' }),
      glint: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
      red: new THREE.MeshStandardMaterial({ color: '#c4161c', roughness: 0.4 }),
      sandal: new THREE.MeshStandardMaterial({ color: '#f1b54a' }),
      towel: cloth('#efe6cf'),
      towelStripe: cloth('#b3261e'),
      jasmine: new THREE.MeshStandardMaterial({ color: '#fffdf4', emissive: '#fff6d8', emissiveIntensity: 0.3 }),
      chappal: new THREE.MeshStandardMaterial({ color: '#3b2314', roughness: 0.8 }),
      shadow: new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.35, depthWrite: false }),
    }
  }, [skin, top, bottom, border, check, hair])

  const torso = useMemo(() => torsoGeo(female, belly), [female, belly])
  const skirtLen = folded ? 0.5 : outfit === 'shorts' ? 0.32 : 0.86
  const skirt = useMemo(() => skirtGeo(skirtLen, folded ? 0.21 : outfit === 'shorts' ? 0.19 : female ? 0.27 : 0.25), [skirtLen, folded, outfit, female])
  // pallu is split at the chest pivot (spine y 0.3) so the shoulder half follows the chest when she leans
  const pallu = useMemo(
    () =>
      female
        ? {
            waist: ribbonGeo([[-0.15, 0.02, 0.1], [-0.05, 0.2, 0.135], [0.03, 0.32, 0.135]], 0.17),
            chest: ribbonGeo([[-0.005, -0.03, 0.137], [0.08, 0.1, 0.125], [0.16, 0.25, 0.05], [0.17, 0.28, -0.03], [0.16, 0.15, -0.12], [0.15, -0.2, -0.135], [0.14, -0.6, -0.13]], 0.17),
            waistBorder: ribbonGeo([[-0.155, 0.03, 0.105], [-0.06, 0.21, 0.14], [0.025, 0.325, 0.14]], 0.035),
            chestBorder: ribbonGeo([[-0.01, -0.025, 0.142], [0.07, 0.11, 0.13], [0.15, 0.26, 0.055], [0.165, 0.29, -0.03]], 0.035),
          }
        : null,
    [female],
  )

  const hipY = sitting ? 0.2 : 0.93
  const sy = hipY + 0.53
  const rootScale = scale * (kid ? 0.7 : 0.94)
  const pos = props.position || [0, 0, 0]
  const rotY = props['rotation-y'] || 0
  // world-ish params (pots, leaves, counters) given in the parent's frame -> this person's frame
  const local = useMemo(() => {
    const out = {}
    const c = Math.cos(-rotY)
    const sn = Math.sin(-rotY)
    for (const [k, v] of Object.entries(params)) {
      if (Array.isArray(v) && v.length === 3) {
        const x = v[0] - pos[0]
        const z = v[2] - pos[2]
        out[k] = [(x * c + z * sn) / rootScale, (v[1] - pos[1]) / rootScale, (-x * sn + z * c) / rootScale]
      } else out[k] = v
    }
    return out
  }, [params, pos[0], pos[1], pos[2], rotY, rootScale])
  const talkOn = [].concat(talkStation)

  useFrame((s, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30)
    const R = r.current
    if (!R.root) return
    const t = s.clock.elapsedTime + seed * 7.3
    if (!state.current) {
      state.current = { pose: makePose(), x: {}, v: {}, hand: { l: null, r: null, lv: [0, 0, 0], rv: [0, 0, 0] }, blinkAt: t + 1 + hash(seed) * 3, override: 0, first: true }
    }
    const st = state.current
    const P = st.pose
    resetPose(P, sy)
    const ctx = { sy, hipY, sitting, params: local, seed, speaking: talkOn.includes(sceneStore.get().station), elder, kid }
    const beh = st.override > s.clock.elapsedTime ? BEHAVIORS.wave : BEHAVIORS[behavior] || BEHAVIORS.idle
    beh(t, P, ctx)
    if (elder) P.spine[0] += 0.12
    R.root.userData.aim = P.aim

    // look at the viewer
    if (P.look > 0) {
      R.root.updateWorldMatrix(true, false)
      _v.cam.copy(s.camera.position)
      R.root.worldToLocal(_v.cam)
      const dx = _v.cam.x
      const dz = _v.cam.z
      const dy = _v.cam.y - (sy + 0.3)
      let yaw = Math.atan2(dx, dz)
      const pitch = -Math.atan2(dy, Math.hypot(dx, dz))
      const wgt = P.look * (Math.abs(yaw) > 1.6 ? 0 : 1)
      yaw = THREE.MathUtils.clamp(yaw, -1.1, 1.1)
      P.neck[1] += yaw * 0.4 * wgt
      P.head[1] += yaw * 0.5 * wgt
      P.neck[0] += THREE.MathUtils.clamp(pitch, -0.5, 0.5) * 0.4 * wgt
      P.head[0] += THREE.MathUtils.clamp(pitch, -0.5, 0.5) * 0.5 * wgt
    }

    // springs on FK joints
    const ratio = 0.82
    FK.forEach((k) => {
      if (!st.x[k] || st.first) {
        st.x[k] = [...P[k]]
        st.v[k] = [0, 0, 0]
      }
      const K = STIFF[k]
      const C = 2 * Math.sqrt(K) * ratio
      for (let i = 0; i < 3; i++) {
        st.v[k][i] += (K * (P[k][i] - st.x[k][i]) - C * st.v[k][i]) * dt
        st.x[k][i] += st.v[k][i] * dt
      }
      const obj = R[k]
      if (obj) obj.rotation.set(st.x[k][0], st.x[k][1], st.x[k][2])
    })
    R.hips.position.set(P.hipsPos[0], hipY + P.hipsPos[1], P.hipsPos[2])
    R.chest.scale.setScalar(1 + Math.sin(t * 1.7) * 0.012)

    // hands: spring the targets, then IK
    ;[['l', P.lHand, R.lSh, R.lEl, curlL], ['r', P.rHand, R.rSh, R.rEl, curlR]].forEach(([side, H, sh, el, curl]) => {
      let x = st.hand[side]
      const v = st.hand[side + 'v']
      if (!x || st.first) x = st.hand[side] = [...H.pos]
      const K = H.stiff
      const C = 2 * Math.sqrt(K) * 0.8
      for (let i = 0; i < 3; i++) {
        v[i] += (K * (H.pos[i] - x[i]) - C * v[i]) * dt
        x[i] += v[i] * dt
      }
      curl.current += (H.curl - curl.current) * Math.min(1, dt * 10)
      R.root.updateMatrixWorld(true)
      solveArm(R.root, sh, el, x, H.pole)
    })

    // face: blink, eyes, mouth
    if (t > st.blinkAt) st.blinkAt = t + 2 + hash(t) * 4
    const bl = st.blinkAt - t < 0.14 ? 1 : 0
    const lid = Math.max(bl, P.lid)
    const lidRot = THREE.MathUtils.lerp(-0.62 + P.brow * -0.15, 1.45, lid)
    R.lidL.rotation.x = R.lidR.rotation.x = lidRot
    R.head.updateWorldMatrix(true, false)
    _v.cam.copy(s.camera.position)
    R.head.worldToLocal(_v.cam)
    const eyeW = Math.min(1, P.look + 0.25)
    const ey = THREE.MathUtils.clamp(Math.atan2(_v.cam.x, _v.cam.z), -0.5, 0.5) * eyeW + noise(t * 0.7, seed + 4) * 0.08
    const ep = THREE.MathUtils.clamp(-Math.atan2(_v.cam.y - 0.13, Math.hypot(_v.cam.x, _v.cam.z)), -0.35, 0.35) * eyeW
    R.eyeL.rotation.set(ep, ey, 0)
    R.eyeR.rotation.set(ep, ey, 0)
    const talk = P.talk
    const open = Math.max(0, talk * (0.35 + 0.65 * Math.abs(noise(t * 11, seed + 9))), P.chew * Math.max(0, Math.sin(t * 8)) * 0.5)
    R.mouth.scale.set(0.017 + P.smile * 0.004, 0.0015 + open * 0.011, 0.006)
    R.lowerLip.position.y = 0.043 - open * 0.01
    R.smile.scale.set(0.017 + P.smile * 0.005, 0.004 + P.smile * 0.009, 0.012)
    R.browL.position.y = R.browR.position.y = 0.168 + P.brow * 0.008
    st.first = false
  })

  const legMat = sitting ? (outfit === 'shorts' ? m.skin : m.bottom) : m.skin
  const thighMat = sitting || outfit === 'shorts' ? m.bottom : m.skin
  const sleeves = shirt === 'shirt' || shirt === 'blouse'

  const leg = (side) => {
    const k = side > 0 ? 'l' : 'r'
    return (
      <group key={k} ref={reg(k + 'Th')} position={[side * 0.09, -0.02, 0]}>
        <mesh geometry={g.thigh} material={thighMat} />
        <group ref={reg(k + 'Kn')} position-y={-0.43}>
          <mesh geometry={g.sphereLow} material={thighMat === m.skin ? m.skin : legMat} scale={0.056} />
          <mesh geometry={g.shin} material={legMat} />
          <group ref={reg(k + 'An')} position-y={-0.43}>
            <mesh geometry={g.sphere} material={m.skin} position={[0, -0.025, 0.045]} scale={[0.042, 0.032, 0.105]} />
            {female && <mesh geometry={g.sphereLow} material={m.silver} position-y={0.01} scale={[0.04, 0.008, 0.04]} />}
            {!sitting && <mesh geometry={g.chappal} material={m.chappal} position={[0, -0.05, 0.05]} scale={[0.05, 0.014, 0.125]} />}
          </group>
        </group>
      </group>
    )
  }

  const arm = (side) => {
    const k = side > 0 ? 'l' : 'r'
    return (
      <group key={k} ref={reg(k + 'Sh')} position={[side * 0.215, 0.23, 0]}>
        <mesh geometry={g.sphere} material={sleeves ? m.top : m.skin} scale={[0.062, 0.06, 0.06]} />
        <mesh geometry={g.upperArm} material={m.skin} />
        {sleeves && (
          <mesh material={m.top} position-y={female ? -0.05 : -0.08}>
            <cylinderGeometry args={[0.064, 0.061, female ? 0.12 : 0.18, 16, 1, true]} />
          </mesh>
        )}
        <group ref={reg(k + 'El')} position-y={-L1}>
          <mesh geometry={g.sphereLow} material={m.skin} scale={0.043} />
          <mesh geometry={g.forearm} material={m.skin} />
          {female &&
            [0, 1, 2].map((i) => (
              <mesh key={i} position-y={-0.235 - i * 0.012} rotation-x={Math.PI / 2} material={i === 1 ? m.red : m.gold}>
                <torusGeometry args={[0.033, 0.005, 6, 18]} />
              </mesh>
            ))}
          <group ref={reg(k + 'Wr')} position-y={-L2}>
            <Hand side={side} m={m} curlRef={side > 0 ? curlL : curlR}>
              {side > 0 ? leftHand : rightHand}
            </Hand>
          </group>
        </group>
      </group>
    )
  }

  return (
    <group
      ref={reg('root')}
      scale={rootScale}
      userData={{ personRoot: true }}
      onClick={(e) => {
        e.stopPropagation()
        if (state.current) state.current.override = clock.elapsedTime + 2.8
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => (document.body.style.cursor = '')}
      {...props}
    >
      <mesh rotation-x={-Math.PI / 2} position-y={0.01} material={m.shadow} geometry={g.circle} scale={sitting ? 0.55 : 0.38} />

      <group ref={reg('hips')} position-y={hipY}>
        {/* skirt: veshti / lungi / saree */}
        {!sitting && (
          <group>
            <mesh geometry={skirt} material={m.bottom} />
            {(outfit === 'veshti' || outfit === 'saree') && (
              <mesh position-y={-skirtLen + 0.03}>
                <cylinderGeometry args={[female ? 0.268 : 0.248, female ? 0.272 : 0.252, 0.06, 28, 1, true]} />
                <primitive object={m.border} attach="material" />
              </mesh>
            )}
            {outfit === 'saree' &&
              [-2, -1, 0, 1, 2].map((i) => (
                <mesh key={i} position={[i * 0.035 - 0.03, -0.45, 0.2 + Math.abs(i) * -0.006]} rotation={[0.08, 0, 0]} material={m.bottom}>
                  <boxGeometry args={[0.03, 0.82, 0.02]} />
                </mesh>
              ))}
            {outfit === 'veshti' && (
              <mesh position={[0.06, -0.42, 0.185]} rotation-x={0.07} material={m.bottom}>
                <boxGeometry args={[0.06, 0.8, 0.02]} />
              </mesh>
            )}
            {outfit === 'lungi' && (
              <mesh position-y={-0.01} rotation-x={Math.PI / 2} material={m.bottom}>
                <torusGeometry args={[0.172, 0.022, 8, 28]} />
              </mesh>
            )}
          </group>
        )}
        {sitting && (outfit === 'veshti' || outfit === 'saree') && (
          <mesh geometry={g.sphere} material={m.bottom} position={[0, 0.0, 0.12]} scale={[0.34, 0.1, 0.3]} />
        )}

        {leg(1)}
        {leg(-1)}

        {/* upper body */}
        <group ref={reg('spine')}>
          <mesh geometry={torso} material={female ? m.top : shirt === 'none' ? m.skin : m.top} />
          {female && (
            <>
              <mesh material={m.skin} position-y={0.06} scale={[1, 1, 0.68]}>
                <cylinderGeometry args={[0.15, 0.172, 0.12, 24, 1, true]} />
              </mesh>
              <mesh material={m.bottom} position-y={-0.01} scale={[1, 1, 0.7]}>
                <cylinderGeometry args={[0.172, 0.178, 0.08, 24]} />
              </mesh>
              <mesh geometry={pallu.waist} material={m.bottom} />
              <mesh geometry={pallu.waistBorder} material={m.border} />
            </>
          )}
          {shirt === 'banian' && (
            <>
              <mesh geometry={g.sphere} material={m.skin} position={[0, 0.53, 0.085]} rotation-x={-0.3} scale={[0.07, 0.05, 0.02]} />
              <mesh geometry={g.sphere} material={m.skin} position={[0.14, 0.5, 0]} scale={[0.05, 0.08, 0.1]} />
              <mesh geometry={g.sphere} material={m.skin} position={[-0.14, 0.5, 0]} scale={[0.05, 0.08, 0.1]} />
            </>
          )}
          {shirt === 'shirt' && (
            <>
              <mesh position={[0, 0.585, 0.01]} rotation-x={Math.PI / 2 - 0.15} material={m.top}>
                <torusGeometry args={[0.068, 0.016, 8, 24]} />
              </mesh>
              {[0.48, 0.38, 0.28, 0.18].map((y) => (
                <mesh key={y} geometry={g.sphereLow} material={m.eyeWhite} position={[0, y, 0.133 - (0.48 - y) * 0.02]} scale={0.007} />
              ))}
            </>
          )}
          {belly > 0 && <mesh geometry={g.sphere} material={m.top} position={[0, 0.18, 0.05]} scale={[0.15, 0.15, 0.1 + belly * 0.05]} />}
          {towel && (
            <group position={[0.11, 0.56, 0]}>
              <mesh position={[0.02, -0.17, 0.115]} rotation-x={0.1} material={m.towel}><boxGeometry args={[0.1, 0.36, 0.012]} /></mesh>
              <mesh position={[0.02, -0.34, 0.132]} rotation-x={0.1} material={m.towelStripe}><boxGeometry args={[0.102, 0.025, 0.014]} /></mesh>
              <mesh position={[0.02, 0.02, 0]} scale={[1, 0.5, 1.15]} material={m.towel}><cylinderGeometry args={[0.1, 0.1, 0.1, 16, 1, true, -Math.PI / 2, Math.PI]} /></mesh>
              <mesh position={[0.02, -0.2, -0.115]} rotation-x={-0.1} material={m.towel}><boxGeometry args={[0.1, 0.42, 0.012]} /></mesh>
            </group>
          )}

          <group ref={reg('chest')} position-y={0.3}>
            {arm(1)}
            {arm(-1)}
            {female && (
              <>
                <mesh geometry={pallu.chest} material={m.bottom} />
                <mesh geometry={pallu.chestBorder} material={m.border} />
              </>
            )}
            <group ref={reg('neck')} position-y={0.3}>
              <mesh geometry={g.neck} material={m.skin} />
              {female && (
                <mesh position={[0, 0.0, 0.02]} rotation-x={Math.PI / 2 - 0.35} material={m.gold}>
                  <torusGeometry args={[0.068, 0.006, 6, 24]} />
                </mesh>
              )}
              <group ref={reg('head')} position-y={0.08}>
                <Head m={m} g={g} reg={reg} female={female} mustache={mustache} pottu={pottu} kid={kid} />
                {headItem}
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}

function Head({ m, g, reg, female, mustache, pottu, kid }) {
  return (
    <group scale={kid ? 1.12 : 1}>
      {/* skull + jaw */}
      <mesh geometry={g.sphere} material={m.skin} position={[0, 0.125, 0]} scale={[0.104, 0.128, 0.117]} />
      <mesh geometry={g.sphere} material={m.skin} position={[0, 0.07, 0.03]} scale={[0.082, 0.07, 0.09]} />
      <mesh geometry={g.sphere} material={m.skin} position={[0, 0.035, 0.065]} scale={[0.036, 0.03, 0.04]} />
      {/* ears */}
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={g.sphereLow} material={m.skin} position={[s * 0.102, 0.115, -0.005]} rotation-y={s * 0.3} scale={[0.012, 0.03, 0.02]} />
      ))}
      {female &&
        [-1, 1].map((s) => (
          <group key={'e' + s} position={[s * 0.106, 0.075, 0.0]}>
            <mesh geometry={g.sphereLow} material={m.gold} scale={0.01} />
            <mesh material={m.gold} position-y={-0.02}>
              <coneGeometry args={[0.014, 0.022, 10]} />
            </mesh>
          </group>
        ))}
      {/* hair */}
      <mesh geometry={g.hairCap} material={m.hair} position={[0, 0.13, -0.008]} rotation-x={-0.42} scale={[0.11, 0.138, 0.126]} />
      <mesh geometry={g.sphere} material={m.hair} position={[0, 0.115, -0.03]} scale={[0.106, 0.12, 0.1]} />
      {!female &&
        [-1, 1].map((s) => (
          <mesh key={'sb' + s} geometry={g.sphereLow} material={m.hair} position={[s * 0.098, 0.13, 0.03]} scale={[0.012, 0.035, 0.025]} />
        ))}
      {female && (
        <group position={[0, 0.09, -0.11]}>
          <mesh geometry={g.sphere} material={m.hair} scale={0.055} />
          {Array.from({ length: 7 }).map((_, i) => (
            <mesh key={i} geometry={g.sphereLow} material={m.hair} position={[0, -0.05 - i * 0.055, -0.018 - i * 0.004]} scale={0.032 - i * 0.002} />
          ))}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = -Math.PI * 0.95 + (i / 11) * Math.PI * 0.9
            return <mesh key={'j' + i} geometry={g.sphereLow} material={m.jasmine} position={[Math.cos(a) * 0.06, 0.015 + Math.sin(a) * 0.025, -0.028]} scale={0.013} />
          })}
          {Array.from({ length: 9 }).map((_, i) => (
            <mesh key={'js' + i} geometry={g.sphereLow} material={m.jasmine} position={[0.034, -0.05 - i * 0.045, -0.03]} scale={0.012} />
          ))}
        </group>
      )}
      {/* eyes */}
      {[-1, 1].map((s) => (
        <group key={'eye' + s} position={[s * 0.037, 0.132, 0.094]}>
          <group ref={reg(s > 0 ? 'eyeL' : 'eyeR')}>
            <mesh geometry={g.sphere} material={m.eyeWhite} scale={0.0165} />
            <mesh geometry={g.circle} material={m.iris} position-z={0.0163} scale={0.0085} />
            <mesh geometry={g.circle} material={m.pupil} position-z={0.0165} scale={0.0042} />
          </group>
          <mesh geometry={g.circle} material={m.glint} position={[0.003, 0.004, 0.0172]} scale={0.0018} />
          <group ref={reg(s > 0 ? 'lidL' : 'lidR')}>
            <mesh geometry={g.lidCap} material={m.skin} scale={0.0178} />
          </group>
          <mesh geometry={g.sphereLow} material={m.skin} position={[0, -0.014, 0.006]} scale={[0.018, 0.006, 0.013]} />
        </group>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={'br' + s} ref={reg(s > 0 ? 'browL' : 'browR')} geometry={g.sphereLow} material={m.hair} position={[s * 0.039, 0.168, 0.106]} rotation-z={s * -0.12} scale={[0.024, 0.0055, 0.008]} />
      ))}
      {/* nose */}
      <mesh geometry={g.sphere} material={m.skin} position={[0, 0.11, 0.112]} rotation-x={-0.25} scale={[0.013, 0.034, 0.016]} />
      <mesh geometry={g.sphere} material={m.skin} position={[0, 0.083, 0.124]} scale={[0.017, 0.014, 0.015]} />
      {[-1, 1].map((s) => (
        <mesh key={'n' + s} geometry={g.sphereLow} material={m.skin} position={[s * 0.014, 0.08, 0.114]} scale={[0.011, 0.01, 0.011]} />
      ))}
      {/* mouth */}
      <mesh ref={reg('mouth')} geometry={g.sphereLow} material={m.mouth} position={[0, 0.052, 0.1]} scale={[0.017, 0.002, 0.006]} />
      <mesh ref={reg('smile')} geometry={g.lip} material={m.lips} position={[0, 0.058, 0.104]} rotation-z={Math.PI} scale={[0.018, 0.006, 0.012]} />
      <mesh ref={reg('lowerLip')} geometry={g.sphereLow} material={m.lips} position={[0, 0.043, 0.101]} scale={[0.014, 0.0055, 0.008]} />
      {mustache && !kid &&
        [-1, 1].map((s) => (
          <mesh key={'m' + s} geometry={g.sphere} material={m.hair} position={[s * 0.016, 0.066, 0.112]} rotation={[0, s * 0.35, s * -0.32]} scale={[0.022, 0.0075, 0.01]} />
        ))}
      {pottu && (
        <>
          {!female && <mesh geometry={g.circle} material={m.sandal} position={[0, 0.19, 0.111]} rotation-x={-0.35} scale={[0.008, 0.014, 1]} />}
          <mesh geometry={g.circle} material={m.red} position={[0, female ? 0.18 : 0.172, 0.114]} rotation-x={-0.32} scale={female ? 0.008 : 0.0055} />
        </>
      )}
    </group>
  )
}

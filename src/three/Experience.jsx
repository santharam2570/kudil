import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, Stars, Environment, Lightformer } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { Person, SKIN } from './Person'
import {
  Hut, Handi, Stove, Steam, Ammi, Spices, Vilakku, BananaLeaf, CoconutTree, BananaPlant,
  Kolam, SerialLights, Sack, Banner, Mat, HangingBulb, BiryaniTop, Thoranam,
} from './Props'
import { Dish } from './Dishes'
import { groundTexture } from './textures'
import { sceneStore, useScene } from '../store'
import { MENU, formatINR } from '../data/menu'

/* world positions of each scroll section */
const P = {
  hut: [0, 0, 0],
  masala: [16, 0, -3],
  counter: [32, 0, -3],
  family: [46, 0, -3],
  catering: [60, 0, -4],
}

// subject = what we look at, offset = camera relative to look target, shift = sideways framing on desktop
const STATIONS = [
  { subject: [0, 1.9, 0], offset: [1.2, 0.9, 8.6], shift: [-2.6, 0, 0], mobile: { k: 1.95, y: -1.5, x: -0.6 } },
  { subject: [16, 1.2, -3], offset: [-0.8, 0.9, 5.2], shift: [-1.9, 0, 0] },
  { subject: [0.1, 1.25, 0.1], offset: [2.6, 1.3, 4.6], shift: [-1.5, 0, 0] },
  { subject: [32, 1.3, -2.6], offset: [0, 0.9, 5.4], shift: [1.75, 0, 0] },
  { subject: [46.2, 0.75, -2.8], offset: [0.3, 1.6, 5.2], shift: [-1.9, 0, 0] },
  { subject: [60, 1.3, -4], offset: [0, 2.2, 9.5], shift: [-3.2, 0, 0] },
  { subject: [0, 0.4, 0], offset: [0, 1.9, 14.5], shift: [0, 0, 0] },
]

const smooth = (x) => x * x * (3 - 2 * x)

function readStationProgress() {
  const els = document.querySelectorAll('[data-station]')
  if (!els.length) return 0
  const vh = window.innerHeight
  const s = window.scrollY
  const ranges = []
  els.forEach((el) => {
    const r = el.getBoundingClientRect()
    const top = r.top + s
    let a = top - vh * 0.3
    let b = top + r.height - vh * 0.7
    if (b < a) a = b = (a + b) / 2
    ranges.push([a, b])
  })
  if (s <= ranges[0][1]) return 0
  for (let i = 0; i < ranges.length; i++) {
    const [a, b] = ranges[i]
    if (s >= a && s <= b) return i
    const next = ranges[i + 1]
    if (next && s > b && s < next[0]) return i + smooth((s - b) / (next[0] - b))
  }
  return ranges.length - 1
}

function CameraRig() {
  const { camera, size, pointer } = useThree()
  const pos = useRef(new THREE.Vector3(8, 6, 20))
  const look = useRef(new THREE.Vector3(0, 2, 0))
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), t: new THREE.Vector3(), p2: new THREE.Vector3(), t2: new THREE.Vector3() }), [])

  const frame = (st, mobile, outP, outT) => {
    const m = { k: 1.55, y: -0.55, x: 0, ...st.mobile }
    const shift = mobile ? [m.x, m.y, 0] : st.shift
    outT.set(st.subject[0] + shift[0], st.subject[1] + shift[1], st.subject[2] + shift[2])
    const k = mobile ? m.k : 1
    outP.set(outT.x + st.offset[0] * k, outT.y + st.offset[1] * k, outT.z + st.offset[2] * k)
  }

  const debugCam = useMemo(() => new URLSearchParams(location.search).get('cam')?.split(',').map(Number), [])

  useFrame((_, dt) => {
    if (debugCam) {
      camera.position.set(debugCam[0], debugCam[1], debugCam[2])
      camera.lookAt(debugCam[3], debugCam[4], debugCam[5])
      return
    }
    const mobile = size.width / size.height < 0.85
    const f = readStationProgress()
    const i = Math.floor(f)
    const j = Math.min(STATIONS.length - 1, i + 1)
    const frac = f - i
    frame(STATIONS[i], mobile, tmp.p, tmp.t)
    frame(STATIONS[j], mobile, tmp.p2, tmp.t2)
    tmp.p.lerp(tmp.p2, frac)
    tmp.t.lerp(tmp.t2, frac)
    const dist = Math.abs(STATIONS[j].subject[0] - STATIONS[i].subject[0])
    tmp.p.y += Math.sin(frac * Math.PI) * Math.min(4, dist * 0.12)
    tmp.p.x += pointer.x * 0.35
    tmp.p.y += pointer.y * 0.2
    const k = 1 - Math.exp(-dt * 3.2)
    pos.current.lerp(tmp.p, k)
    look.current.lerp(tmp.t, k)
    camera.position.copy(pos.current)
    camera.lookAt(look.current)
    sceneStore.set({ station: Math.round(f), mobile })
  })
  return null
}

function Bubble({ station, position, children }) {
  const active = useScene((s) => s.station === station)
  return (
    <Html position={position} center distanceFactor={4} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
      <div className={`bubble ${active ? 'show' : ''}`}>{children}</div>
    </Html>
  )
}

function Sky() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: { top: { value: new THREE.Color('#0d0618') }, mid: { value: new THREE.Color('#3a1030') }, bottom: { value: new THREE.Color('#ff7a2a') } },
        vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader:
          'uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.12 ? mix(mid, top, smoothstep(0.12, 0.6, h)) : mix(bottom, mid, smoothstep(-0.02, 0.12, h)); gl_FragColor = vec4(c,1.0); }',
      }),
    [],
  )
  return (
    <mesh material={mat} position={[30, 0, 0]}>
      <sphereGeometry args={[180, 32, 16]} />
    </mesh>
  )
}

function Ground() {
  const tex = groundTexture()
  return (
    <mesh rotation-x={-Math.PI / 2} position={[30, 0, 0]} receiveShadow>
      <planeGeometry args={[340, 340]} />
      <meshStandardMaterial map={tex} roughness={1} />
    </mesh>
  )
}

function Ladle() {
  const ref = useRef()
  const tgt = useMemo(() => new THREE.Vector3(), [])
  useFrame(() => {
    const g = ref.current
    if (!g) return
    let root = g.parent
    while (root && !root.userData.personRoot) root = root.parent
    const aim = root?.userData.aim
    if (!aim) return
    tgt.set(aim[0], aim[1], aim[2])
    root.localToWorld(tgt)
    g.lookAt(tgt)
  })
  return (
    <group ref={ref} position-y={-0.05}>
      <mesh position-z={0.22} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.012, 0.012, 0.6, 8]} />
        <meshStandardMaterial color="#c9ccd0" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position-z={0.54} rotation-x={-Math.PI / 2}>
        <sphereGeometry args={[0.065, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#c9ccd0" metalness={0.9} roughness={0.25} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

/* ---------- station 0 + 2 : the Kudil hut ---------- */
function HutStation() {
  return (
    <group position={P.hut}>
      <Hut />
      {/* biryani master stirring the big handi */}
      <group position={[0.55, 0, -0.35]} rotation-y={-0.45}>
        <Person skin={SKIN.brown} top="#f7f3ea" shirt="banian" bottom="#f6f1e3" border="#d4a017" towel belly={0.7} behavior="chef" params={{ pot: [-0.22, 1.0, 0.62] }} talkStation={[0, 2]} seed={2} rightHand={<Ladle />} />
        <group position={[-0.22, 0, 0.62]}>
          <Stove />
          <Handi position-y={0.35} scale={0.72} variant={2} />
          <Steam position-y={1.05} count={18} height={1.8} spread={0.3} size={0.7} opacity={0.4} />
        </group>
      </group>
      <Bubble station={0} position={[0.4, 2.15, -0.2]}>வாங்க! சூடா பிரியாணி ரெடி!</Bubble>
      <Bubble station={2} position={[0.4, 2.15, -0.2]}>தம் போட்டாச்சு… கொஞ்சம் பொறுங்க!</Bubble>

      {/* sealed dum handi with coals */}
      <group position={[-1.25, 0, -0.55]}>
        <Stove fireScale={0.7} light={false} />
        <Handi position-y={0.35} scale={0.66} sealed />
        <Steam position-y={0.95} count={10} height={1.2} spread={0.4} size={0.4} opacity={0.25} />
      </group>

      {/* welcoming amma */}
      <Person position={[-2.75, 0, 2.35]} rotation-y={0.35} female outfit="saree" shirt="blouse" skin={SKIN.wheat} top="#8b1a0f" bottom="#c2185b" border="#f4b63f" behavior="welcome" talkStation={0} seed={5} />
      <Bubble station={0} position={[-2.75, 2.05, 2.35]}>வணக்கம்!</Bubble>

      <Sack position={[1.55, 0, -1.05]} rotation-y={-0.4} />
      <Sack position={[1.05, 0, -1.25]} rotation-y={0.3} label="பாசுமதி" />
      <Kolam position={[0, 0.015, 3.4]} size={2.8} />
      <Vilakku position={[1.6, 0, 1.9]} scale={0.9} />

      <SerialLights from={[-2, 2.85, 1.5]} to={[-6.4, 4.2, -2.6]} count={26} />
      <SerialLights from={[2, 2.85, 1.5]} to={[6.6, 4.8, -2.2]} count={26} />
      <CoconutTree position={[-6.6, 0, -2.8]} height={6.5} lean={0.2} />
      <CoconutTree position={[6.8, 0, -2.4]} height={7.2} lean={-0.25} rotation-y={Math.PI} />
      <CoconutTree position={[-9, 0, 1]} height={5.8} lean={0.35} />
      <BananaPlant position={[3.6, 0, 1.6]} />
      <BananaPlant position={[-4.2, 0, -0.6]} height={2.5} />
    </group>
  )
}

/* ---------- station 1 : masala ---------- */
function MasalaStation() {
  const powders = [['#c62828', 0], ['#f9a825', 1], ['#6d4c2f', 2], ['#2e7d32', 3]]
  return (
    <group position={P.masala}>
      <Person female outfit="saree" shirt="blouse" skin={SKIN.brown} top="#2e7d32" bottom="#f9a825" border="#b71c1c" behavior="grind" params={{ roller: [0, 0.95, 0.57], amp: 0.1 }} talkStation={1} seed={3} />
      <Ammi position={[0, 0, 0.55]} seed={3} />
      <Spices position={[0, 0.5, 0]} radius={1.7} height={1.8} />
      <Bubble station={1} position={[0, 2.05, -0.1]}>அம்மியில அரைச்சா தான் மணம்!</Bubble>
      <group position={[-1.35, 0, 0.55]}>
        <mesh position-y={0.25}>
          <cylinderGeometry args={[0.45, 0.4, 0.5, 24]} />
          <meshStandardMaterial color="#7a4a26" roughness={0.9} />
        </mesh>
        {powders.map(([c, i]) => (
          <group key={i} position={[Math.cos(i * 1.57) * 0.22, 0.5, Math.sin(i * 1.57) * 0.22]}>
            <mesh position-y={0.04}>
              <cylinderGeometry args={[0.13, 0.1, 0.08, 20]} />
              <meshStandardMaterial color="#d9dde2" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position-y={0.08} scale={[1, 0.5, 1]}>
              <sphereGeometry args={[0.11, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color={c} roughness={1} />
            </mesh>
          </group>
        ))}
      </group>
      <Vilakku position={[1.35, 0, 0.5]} />
      <Sack position={[-1.4, 0, -0.9]} />
      <Sack position={[-0.8, 0, -1.25]} label="மிளகாய்" />
      <Banner position={[0, 0, -2.2]} ta="மசாலா ரகசியம்" en="Hand-ground · Never packeted" width={3.6} />
      <BananaPlant position={[2.4, 0, -1.4]} />
      <BananaPlant position={[-2.6, 0, -1.6]} height={2.6} />
      <HangingBulb position={[0.3, 0, 0.4]} y={2.9} />
    </group>
  )
}

/* ---------- station 3 : the counter / catalog ---------- */
function Platter() {
  const selected = useScene((s) => s.selected)
  const item = MENU.find((m) => m.id === selected) || MENU[0]
  const spin = useRef()
  const pop = useRef()
  const born = useRef(0)
  const last = useRef(null)
  useFrame(({ clock }, dt) => {
    if (last.current !== selected) {
      last.current = selected
      born.current = clock.elapsedTime
    }
    spin.current.rotation.y += dt * 0.5
    const k = Math.min(1, (clock.elapsedTime - born.current) * 2.2)
    const s = 1 + Math.sin(k * Math.PI) * 0.18
    pop.current.scale.setScalar(Math.max(0.001, smooth(k)) * s)
    pop.current.position.y = (1 - smooth(k)) * 0.6
  })
  return (
    <group position={[0, 0.97, 0.75]}>
      <mesh>
        <cylinderGeometry args={[0.72, 0.75, 0.05, 48]} />
        <meshStandardMaterial color="#d6a33a" metalness={0.9} roughness={0.25} />
      </mesh>
      <group ref={spin} position-y={0.03}>
        <group ref={pop}>
          <group scale={0.8}>
            <Dish key={item.id} visual={item.visual} variant={item.variant} />
          </group>
        </group>
      </group>
    </group>
  )
}

function CounterBubble() {
  const selected = useScene((s) => s.selected)
  const item = MENU.find((m) => m.id === selected) || MENU[0]
  return (
    <Bubble station={3} position={[-0.7, 2.15, -0.05]}>
      <b>{item.ta}</b>
      <span>இது நம்ம ஸ்பெஷல் · {formatINR(item.price)}</span>
    </Bubble>
  )
}

function CounterStation() {
  return (
    <group position={P.counter}>
      <Person position={[-0.7, 0, -0.05]} rotation-y={0.2} skin={SKIN.dark} top="#c62828" shirt="shirt" bottom="#1f3a8a" check="#f4b63f" outfit="lungi" behavior="present" params={{ dish: [0, 1.1, 0.75], counter: [-0.68, 0.97, 0.36] }} talkStation={3} seed={4} />
      <CounterBubble />
      <group position={[0, 0, 0.75]}>
        <mesh position-y={0.475}>
          <boxGeometry args={[2.6, 0.95, 0.9]} />
          <meshStandardMaterial color="#8a3d10" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.7, 0.455]}>
          <planeGeometry args={[2.6, 0.18]} />
          <meshStandardMaterial color="#f4b63f" emissive="#f4b63f" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0, 0.3, 0.455]}>
          <planeGeometry args={[2.6, 0.08]} />
          <meshStandardMaterial color="#b3200f" />
        </mesh>
      </group>
      <Platter />
      <group position={[1.6, 0, -0.6]}>
        <Stove fireScale={0.6} light={false} />
        <Handi position-y={0.35} scale={0.6} variant={1} meat="mutton" />
        <Steam position-y={0.9} count={10} height={1.3} spread={0.25} size={0.5} opacity={0.3} />
      </group>
      <Banner position={[0, 0, -1.7]} ta="இன்றைய ஸ்பெஷல்" en="Today at Kudil" width={3.4} y={2.7} />
      <HangingBulb position={[0, 0, 0.6]} y={2.7} />
      <BananaPlant position={[-2.3, 0, -1]} />
      <CoconutTree position={[3.2, 0, -2.4]} height={6} lean={-0.2} />
    </group>
  )
}

/* ---------- station 4 : family eating on banana leaf ---------- */
function LeafMeal({ meat = 'chicken', ...props }) {
  return (
    <group {...props}>
      <BananaLeaf size={0.75} />
      <group position={[-0.03, -0.27, -0.06]} scale={0.38}>
        <BiryaniTop meat={meat} grains={140} />
      </group>
      <mesh position={[0.22, 0.03, -0.06]}>
        <cylinderGeometry args={[0.06, 0.05, 0.06, 14]} />
        <meshStandardMaterial color="#f3efe4" />
      </mesh>
    </group>
  )
}

function FamilyStation() {
  return (
    <group position={P.family}>
      <Mat w={3.6} d={1.9} position-y={0.012} />
      <Person position={[-1.05, 0, -0.25]} sitting skin={SKIN.brown} top="#1565c0" shirt="shirt" bottom="#f6f1e3" behavior="eat" params={{ leaf: [-1.02, 0.06, 0.1], neighbor: 1 }} talkStation={4} seed={6} />
      <LeafMeal position={[-1.05, 0.02, 0.24]} meat="mutton" />
      <Person position={[0, 0, -0.25]} sitting female outfit="saree" shirt="blouse" skin={SKIN.wheat} top="#6a1b9a" bottom="#ad1457" border="#f4b63f" behavior="eat" params={{ leaf: [0.03, 0.06, 0.1], neighbor: -1 }} seed={7} />
      <LeafMeal position={[0, 0.02, 0.24]} />
      <Person position={[0.95, 0, -0.25]} sitting kid outfit="shorts" shirt="shirt" skin={SKIN.light} top="#f9a825" bottom="#2e7d32" behavior="kid" params={{ leaf: [0.97, 0.06, 0.02] }} talkStation={4} seed={8} />
      <LeafMeal position={[0.95, 0.02, 0.12]} scale={0.85} />
      <Bubble station={4} position={[0.95, 1.25, -0.25]}>இன்னும் ஒரு பீஸ்!</Bubble>
      <Bubble station={4} position={[-1.05, 1.5, -0.25]}>சூப்பர் டேஸ்ட்!</Bubble>
      {/* paati serving from the handi */}
      <Person position={[2.05, 0, -0.4]} rotation-y={-0.6} female elder outfit="saree" shirt="blouse" hair="#b9b3aa" skin={SKIN.dark} top="#f3efe4" bottom="#f6f1e3" border="#2e7d32" behavior="serve" params={{ pot: [1.7, 0.86, 0.05] }} seed={9} rightHand={<Ladle />} />
      <group position={[1.7, 0, 0.05]}>
        <mesh position-y={0.2}>
          <cylinderGeometry args={[0.3, 0.34, 0.4, 20]} />
          <meshStandardMaterial color="#6b4226" roughness={0.9} />
        </mesh>
        <Handi position-y={0.4} scale={0.5} variant={1} />
      </group>
      <HangingBulb position={[0, 0, 0]} y={2.8} />
      <Banner position={[0, 0, -2.1]} ta="எல்லோரும் சேர்ந்து" en="Good Food Brings People Together" width={3.8} />
      <BananaPlant position={[-2.6, 0, -1.2]} />
      <BananaPlant position={[2.9, 0, -1.6]} height={2.5} />
      <SerialLights from={[-1.9, 2.75, -2.1]} to={[1.9, 2.75, -2.1]} sag={0.3} count={24} />
    </group>
  )
}

/* ---------- station 5 : wedding catering ---------- */
function Walker({ rx, rz, speed, offset, children }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    const a = clock.elapsedTime * speed + offset
    ref.current.position.set(Math.cos(a) * rx, 0, Math.sin(a) * rz + 1.4)
    ref.current.rotation.y = Math.atan2(-Math.sin(a) * rx, Math.cos(a) * rz)
  })
  return <group ref={ref}>{children}</group>
}

function CateringStation() {
  const carriedPot = <Handi scale={0.28} position-y={0.27} sealed coals={false} />
  return (
    <group position={P.catering}>
      <Banner position={[0, 0, -2.6]} ta="கல்யாண பிரியாணி" en="Weddings · Functions · Mini Hall Catering" width={4.6} height={1.1} y={3} />
      <Thoranam from={[-2.3, 2.42, -2.55]} to={[2.3, 2.42, -2.55]} sag={0.15} count={26} />
      <BananaPlant position={[-2.75, 0, -2.4]} height={2.8} />
      <BananaPlant position={[2.75, 0, -2.4]} height={2.8} />
      <SerialLights from={[-2.4, 3.6, -2.55]} to={[2.4, 3.6, -2.55]} sag={0.25} count={30} />
      {[-2.2, 0, 2.2].map((x, i) => (
        <group key={x} position={[x, 0, -0.9]}>
          <Stove fireScale={0.8} light={i === 1} />
          <Handi position-y={0.35} scale={0.8} sealed />
          <Steam position-y={1.05} count={10} height={1.4} spread={0.45} size={0.5} opacity={0.25} />
        </group>
      ))}
      <Walker rx={3.4} rz={1.1} speed={0.35} offset={0}>
        <Person skin={SKIN.dark} top="#f7f3ea" shirt="banian" bottom="#1f3a8a" check="#e9e4d6" outfit="lungi" folded towel behavior="walkCarry" params={{ rate: 3.4 }} talkStation={5} seed={10} headItem={carriedPot} />
      </Walker>
      <Walker rx={3.4} rz={1.1} speed={0.35} offset={Math.PI}>
        <Person skin={SKIN.brown} top="#ffffff" shirt="banian" bottom="#e9e4d6" check="#2e7d32" outfit="lungi" folded behavior="walkCarry" params={{ rate: 3.4 }} seed={11} headItem={carriedPot} />
      </Walker>
      <Bubble station={5} position={[0, 2.3, 1.4]}>கல்யாண பிரியாணி வருது… வழி விடுங்க!</Bubble>
      <Person position={[-4.6, 0, 0.6]} rotation-y={0.5} female outfit="saree" shirt="blouse" skin={SKIN.wheat} top="#b71c1c" bottom="#f4b63f" border="#b71c1c" behavior="welcome" seed={12} />
      <Person position={[4.6, 0, 0.6]} rotation-y={-0.5} skin={SKIN.brown} top="#fffaf0" shirt="shirt" bottom="#f6f1e3" behavior="welcome" params={{ male: true }} seed={13} />
      <CoconutTree position={[-6.5, 0, -2]} height={6.8} lean={0.25} />
      <CoconutTree position={[6.8, 0, -1.8]} height={6.2} lean={-0.3} rotation-y={Math.PI} />
      <Kolam position={[0, 0.015, 2.9]} size={2.2} />
    </group>
  )
}

/* ---------- connecting village ---------- */
function Village() {
  const trees = useMemo(() => {
    const out = []
    for (let x = -14; x <= 76; x += 4.5) {
      out.push({ p: [x + Math.sin(x) * 1.5, 0, -11 - Math.cos(x * 1.7) * 2.5], h: 6 + ((x * 7) % 3), l: 0.15 + ((x * 13) % 5) * 0.06, r: x })
    }
    ;[8, 24, 39, 53].forEach((x, i) => out.push({ p: [x, 0, -3.5 - i * 0.3], h: 7, l: i % 2 ? 0.3 : -0.3, r: x }))
    return out
  }, [])
  return (
    <group>
      {trees.map((t, i) => (
        <CoconutTree key={i} position={t.p} height={t.h} lean={t.l} rotation-y={t.r} />
      ))}
      {[8, 24, 39, 53].map((x, i) => (
        <BananaPlant key={x} position={[x + 1.6, 0, -2.2]} height={2 + (i % 2) * 0.5} />
      ))}
      <SerialLights from={[3, 4.4, -2.4]} to={[13.5, 4.6, -6]} sag={0.9} count={34} />
      <SerialLights from={[18.5, 4.4, -6]} to={[29, 4.6, -5]} sag={0.9} count={34} />
      <SerialLights from={[35, 4.4, -5]} to={[43.5, 4.6, -6]} sag={0.9} count={30} />
      <SerialLights from={[48.5, 4.4, -6]} to={[57, 4.6, -6.6]} sag={0.9} count={30} />
    </group>
  )
}

function Lights() {
  return (
    <>
      <hemisphereLight args={['#ffcf9a', '#2a140a', 0.75]} />
      <directionalLight position={[12, 9, 14]} intensity={1.6} color="#ffb57a" />
      <directionalLight position={[-14, 18, -6]} intensity={0.6} color="#9fb5ff" />
      <pointLight position={[0, 2.4, 2.2]} intensity={10} distance={9} color="#ffc27a" decay={1.6} />
      <pointLight position={[60, 3, 1]} intensity={14} distance={12} color="#ffb060" decay={1.5} />
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={2.4} color="#ffb070" position={[0, 4, 6]} scale={[12, 4, 1]} />
        <Lightformer intensity={1.2} color="#ff5a1a" position={[-6, 2, -4]} scale={[6, 3, 1]} />
        <Lightformer intensity={0.8} color="#8fa8ff" position={[6, 6, -4]} scale={[6, 3, 1]} />
      </Environment>
    </>
  )
}

export default function Experience() {
  return (
    <Canvas
      className="webgl"
      dpr={[1, 1.75]}
      camera={{ fov: 42, near: 0.1, far: 400, position: [8, 6, 20] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#120610']} />
      <fog attach="fog" args={['#2a0f14', 22, 95]} />
      <Suspense fallback={null}>
        <Sky />
        <Stars radius={120} depth={30} count={1800} factor={4} fade speed={0.6} />
        <Lights />
        <Ground />
        <HutStation />
        <MasalaStation />
        <CounterStation />
        <FamilyStation />
        <CateringStation />
        <Village />
        <CameraRig />
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.85} luminanceSmoothing={0.2} />
          <Vignette offset={0.25} darkness={0.65} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}

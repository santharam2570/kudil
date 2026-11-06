import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { steamTexture, kolamTexture, sackTexture, bannerTexture, matTexture } from './textures'
import { grindStroke } from './motion'

const rand = (a, b) => a + Math.random() * (b - a)
const seeded = (seed) => () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}

/* ---------------- Kudil hut ---------------- */
export function Hut(props) {
  const logo = useLoader(THREE.TextureLoader, '/kudil-logo.jpg')
  const signTex = useMemo(() => {
    const t = logo.clone()
    t.colorSpace = THREE.SRGBColorSpace
    t.repeat.set(807 / 1024, 160 / 723)
    t.offset.set(98 / 1024, 1 - 613 / 723)
    t.needsUpdate = true
    return t
  }, [logo])

  const roofGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(3.4, 2.5, 48, 10, true)
    const p = g.attributes.position
    const r = seeded(7)
    for (let i = 0; i < p.count; i++) {
      p.setX(i, p.getX(i) * (1 + (r() - 0.5) * 0.08))
      p.setZ(i, p.getZ(i) * (1 + (r() - 0.5) * 0.08))
      p.setY(i, p.getY(i) + (r() - 0.5) * 0.06)
    }
    g.computeVertexNormals()
    return g
  }, [])

  const fringe = useRef()
  const FR = 260
  useLayoutEffect(() => {
    const d = new THREE.Object3D()
    const r = seeded(3)
    const c = new THREE.Color()
    const palette = ['#e2561a', '#f07a24', '#c8400f', '#f59a3a', '#d9661c']
    for (let i = 0; i < FR; i++) {
      const a = (i / FR) * Math.PI * 2 + r() * 0.02
      const rad = 3.25 + r() * 0.25
      const len = 0.35 + r() * 0.55
      d.position.set(Math.cos(a) * rad, -len / 2 + 0.05, Math.sin(a) * rad)
      d.rotation.set(Math.PI, 0, 0)
      d.rotateOnWorldAxis(new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)), -0.35 - r() * 0.2)
      d.scale.set(1, len, 1)
      d.updateMatrix()
      fringe.current.setMatrixAt(i, d.matrix)
      fringe.current.setColorAt(i, c.set(palette[i % palette.length]))
    }
    fringe.current.instanceMatrix.needsUpdate = true
  }, [])

  const strands = useRef()
  const ST = 420
  useLayoutEffect(() => {
    const d = new THREE.Object3D()
    const r = seeded(11)
    const c = new THREE.Color()
    const apex = new THREE.Vector3(0, 1.25, 0)
    const up = new THREE.Vector3(0, 1, 0)
    for (let i = 0; i < ST; i++) {
      const a = r() * Math.PI * 2
      const rim = new THREE.Vector3(Math.cos(a) * 3.45, -1.25, Math.sin(a) * 3.45)
      const dir = rim.clone().sub(apex).normalize()
      d.position.copy(apex).lerp(rim, 0.12 + r() * 0.85)
      d.position.x += Math.cos(a) * 0.05
      d.position.z += Math.sin(a) * 0.05
      d.quaternion.setFromUnitVectors(up, dir)
      d.scale.set(1.3, 0.6 + r() * 0.9, 0.35)
      d.updateMatrix()
      strands.current.setMatrixAt(i, d.matrix)
      strands.current.setColorAt(i, c.setHSL(0.06 + r() * 0.04, 0.85, 0.45 + r() * 0.2))
    }
    strands.current.instanceMatrix.needsUpdate = true
  }, [])

  const poles = [[-2, -1.5], [2, -1.5], [-2, 1.5], [2, 1.5]]
  return (
    <group {...props}>
      {poles.map(([x, z], i) => (
        <group key={i} position={[x, 1.45, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.1, 0.12, 2.9, 12]} />
            <meshStandardMaterial color="#c4621f" roughness={0.6} />
          </mesh>
          {[-0.8, 0, 0.8].map((y) => (
            <mesh key={y} position-y={y}>
              <torusGeometry args={[0.11, 0.02, 6, 16]} />
              <meshStandardMaterial color="#8a3d10" />
            </mesh>
          ))}
        </group>
      ))}
      {/* roof beams */}
      <mesh position={[0, 2.85, 1.5]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.08, 0.08, 4.4, 8]} />
        <meshStandardMaterial color="#9b4a16" />
      </mesh>
      <mesh position={[0, 2.85, -1.5]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.08, 0.08, 4.4, 8]} />
        <meshStandardMaterial color="#9b4a16" />
      </mesh>
      {/* thatch */}
      <group position-y={4.1}>
        <mesh geometry={roofGeo}>
          <meshStandardMaterial color="#d9581a" roughness={0.9} side={THREE.DoubleSide} flatShading />
        </mesh>
        <mesh geometry={roofGeo} scale={[0.92, 0.95, 0.92]} position-y={0.12}>
          <meshStandardMaterial color="#ee7a28" roughness={0.9} side={THREE.DoubleSide} flatShading />
        </mesh>
        <instancedMesh ref={strands} args={[null, null, ST]}>
          <coneGeometry args={[0.07, 0.9, 3]} />
          <meshStandardMaterial roughness={0.85} />
        </instancedMesh>
        <group position-y={-1.25}>
          <instancedMesh ref={fringe} args={[null, null, FR]}>
            <coneGeometry args={[0.09, 1, 3]} />
            <meshStandardMaterial roughness={0.85} />
          </instancedMesh>
        </group>
        <mesh position-y={1.3}>
          <sphereGeometry args={[0.14, 10, 8]} />
          <meshStandardMaterial color="#b8860b" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
      {/* signboard from the real Kudil logo, on its own two bamboo poles like the logo */}
      {[-1.95, 1.95].map((x) => (
        <mesh key={x} position={[x, 1.6, 3.62]}>
          <cylinderGeometry args={[0.08, 0.09, 3.2, 10]} />
          <meshStandardMaterial color="#d86a22" roughness={0.6} />
        </mesh>
      ))}
      <group position={[0, 2.9, 3.68]}>
        <mesh>
          <boxGeometry args={[3.7, 0.78, 0.08]} />
          <meshStandardMaterial color="#b8440f" roughness={0.6} />
        </mesh>
        <mesh position-z={0.045}>
          <planeGeometry args={[3.6, 0.72]} />
          <meshStandardMaterial map={signTex} roughness={0.55} emissive="#ffffff" emissiveMap={signTex} emissiveIntensity={0.35} />
        </mesh>
      </group>
    </group>
  )
}

/* ---------------- mango leaf thoranam with marigold ---------------- */
export function Thoranam({ from, to, sag = 0.2, count = 22 }) {
  const leaves = useRef()
  const a = new THREE.Vector3(...from)
  const b = new THREE.Vector3(...to)
  const pts = useMemo(() => {
    const out = []
    for (let i = 0; i <= count; i++) {
      const t = i / count
      const p = a.clone().lerp(b, t)
      p.y -= Math.sin(t * Math.PI) * sag
      out.push(p)
    }
    return out
  }, [from, to])
  const leafGeo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, 0)
    s.quadraticCurveTo(0.07, -0.12, 0, -0.32)
    s.quadraticCurveTo(-0.07, -0.12, 0, 0)
    return new THREE.ShapeGeometry(s, 6)
  }, [])
  useLayoutEffect(() => {
    const d = new THREE.Object3D()
    pts.forEach((p, i) => {
      d.position.copy(p)
      d.rotation.set(0, 0, (i % 2 ? 1 : -1) * 0.08)
      d.updateMatrix()
      leaves.current.setMatrixAt(i, d.matrix)
    })
    leaves.current.instanceMatrix.needsUpdate = true
  }, [pts])
  useFrame(({ clock }) => {
    leaves.current.rotation.x = Math.sin(clock.elapsedTime * 1.3) * 0.02
  })
  return (
    <group>
      <instancedMesh ref={leaves} args={[leafGeo, null, pts.length]}>
        <meshStandardMaterial color="#2f7d1f" side={THREE.DoubleSide} roughness={0.6} />
      </instancedMesh>
      {pts.map((p, i) =>
        i % 2 ? (
          <mesh key={i} position={[p.x, p.y - 0.02, p.z + 0.02]}>
            <icosahedronGeometry args={[0.055, 1]} />
            <meshStandardMaterial color={i % 4 === 1 ? '#ff9f0f' : '#ffd21f'} roughness={0.9} flatShading />
          </mesh>
        ) : null,
      )}
    </group>
  )
}

/* ---------------- copper biryani handi ---------------- */
export function Handi({ scale = 1, open = true, sealed = false, coals = true, variant = 1, meat = 'chicken', ...props }) {
  const geo = useMemo(() => {
    const pts = [
      [0.0, 0], [0.35, 0.02], [0.56, 0.14], [0.68, 0.36], [0.67, 0.58], [0.57, 0.74], [0.5, 0.8], [0.57, 0.84], [0.58, 0.87], [0.52, 0.87], [0.47, 0.82],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    return new THREE.LatheGeometry(pts, 48)
  }, [])
  return (
    <group scale={scale} {...props}>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial color="#c0632f" metalness={0.85} roughness={0.28} side={THREE.DoubleSide} />
      </mesh>
      <mesh position-y={0.62} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.625, 0.012, 6, 48]} />
        <meshStandardMaterial color="#e2a83a" metalness={0.9} roughness={0.2} />
      </mesh>
      {open && !sealed && <BiryaniTop variant={variant} meat={meat} />}
      {sealed && (
        <group position-y={0.86}>
          <mesh>
            <cylinderGeometry args={[0.6, 0.62, 0.06, 40]} />
            <meshStandardMaterial color="#9c4f26" metalness={0.8} roughness={0.35} />
          </mesh>
          <mesh position-y={-0.02} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.56, 0.05, 8, 40]} />
            <meshStandardMaterial color="#e8d3a8" roughness={1} />
          </mesh>
          {coals && <Coals />}
        </group>
      )}
    </group>
  )
}

function Coals() {
  const ref = useRef()
  const coals = useMemo(() => Array.from({ length: 16 }, (_, i) => [Math.cos(i * 2.4) * (0.15 + (i % 4) * 0.1), 0.06, Math.sin(i * 2.4) * (0.15 + (i % 4) * 0.1)]), [])
  useFrame(({ clock }) => {
    ref.current.emissiveIntensity = 2.2 + Math.sin(clock.elapsedTime * 6) * 0.6
  })
  return coals.map((p, i) => (
    <mesh key={i} position={p} rotation={[i, i * 2, 0]}>
      <dodecahedronGeometry args={[0.07, 0]} />
      <meshStandardMaterial ref={i === 0 ? ref : undefined} color="#2a1208" emissive="#ff4a0f" emissiveIntensity={2.2} toneMapped={false} />
    </mesh>
  ))
}

const RICE_COLORS = [
  ['#f6eedc', '#f2c14e', '#e8902a', '#fff7e6'],
  ['#f8f0dd', '#f5b638', '#e46f1b', '#fffaf0', '#c8401a'],
  ['#fffaf0', '#f7d36b', '#ea8a24', '#ffffff', '#d4521c'],
]

export function BiryaniTop({ variant = 1, meat = 'chicken', grains = 420 }) {
  const rice = useRef()
  useLayoutEffect(() => {
    const d = new THREE.Object3D()
    const c = new THREE.Color()
    const r = seeded(19 + variant)
    const pal = RICE_COLORS[variant] || RICE_COLORS[1]
    for (let i = 0; i < grains; i++) {
      const a = r() * Math.PI * 2
      const rad = Math.sqrt(r()) * 0.52
      const y = 0.78 + (1 - (rad / 0.52) ** 2) * 0.16 + r() * 0.02
      d.position.set(Math.cos(a) * rad, y, Math.sin(a) * rad)
      d.rotation.set(r() * Math.PI, r() * Math.PI, r() * Math.PI)
      d.scale.setScalar(variant === 2 ? 0.75 : 1)
      d.updateMatrix()
      rice.current.setMatrixAt(i, d.matrix)
      rice.current.setColorAt(i, c.set(pal[Math.floor(r() * pal.length)]))
    }
    rice.current.instanceMatrix.needsUpdate = true
  }, [variant, grains])
  const pieces = useMemo(() => Array.from({ length: 6 }, (_, i) => ({ a: (i / 6) * Math.PI * 2 + 0.3, r: i === 0 ? 0 : 0.28 })), [])
  return (
    <group>
      <mesh position-y={0.76} scale={[1, 0.3, 1]}>
        <sphereGeometry args={[0.54, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#efc777" roughness={0.9} />
      </mesh>
      <instancedMesh ref={rice} args={[null, null, grains]}>
        <capsuleGeometry args={[0.012, 0.04, 2, 6]} />
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>
      {pieces.map((p, i) =>
        meat === 'chicken' ? (
          <group key={i} position={[Math.cos(p.a) * p.r, 0.93 - p.r * 0.2, Math.sin(p.a) * p.r]} rotation={[0.9, p.a, 0.3]}>
            <mesh scale={[1, 1.35, 0.9]}>
              <sphereGeometry args={[0.085, 12, 10]} />
              <meshStandardMaterial color="#8f3412" roughness={0.55} />
            </mesh>
            <mesh position-y={0.13}>
              <cylinderGeometry args={[0.018, 0.022, 0.12, 8]} />
              <meshStandardMaterial color="#f1e4c8" />
            </mesh>
          </group>
        ) : (
          <mesh key={i} position={[Math.cos(p.a) * p.r, 0.92 - p.r * 0.2, Math.sin(p.a) * p.r]} rotation={[i, i * 1.3, 0]}>
            <dodecahedronGeometry args={[0.085, 0]} />
            <meshStandardMaterial color="#5a2410" roughness={0.6} flatShading />
          </mesh>
        ),
      )}
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={'m' + i} position={[Math.cos(i * 1.7) * 0.36, 0.9, Math.sin(i * 1.7) * 0.36]} rotation={[-1.2, i, 0]} scale={[1, 1.8, 1]}>
          <circleGeometry args={[0.035, 8]} />
          <meshStandardMaterial color="#3f9b2f" side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------------- firewood stove with flickering fire ---------------- */
export function Stove({ fireScale = 1, light = true, ...props }) {
  const flames = useRef([])
  const lightRef = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    flames.current.forEach((f, i) => {
      if (!f) return
      f.scale.y = 1 + Math.sin(t * (9 + i * 2.3) + i) * 0.25
      f.scale.x = f.scale.z = 1 + Math.sin(t * 7 + i * 3) * 0.12
    })
    if (lightRef.current) lightRef.current.intensity = 9 + Math.sin(t * 12) * 2 + Math.sin(t * 17.3) * 1.5
  })
  const bricks = []
  for (let i = 0; i < 3; i++) {
    bricks.push([-0.45, 0.07 + i * 0.12, 0], [0.45, 0.07 + i * 0.12, 0], [0, 0.07 + i * 0.12, -0.45])
  }
  return (
    <group {...props}>
      {bricks.map((p, i) => (
        <mesh key={i} position={p} rotation-y={p[2] !== 0 ? 0 : Math.PI / 2}>
          <boxGeometry args={[0.85, 0.11, 0.22]} />
          <meshStandardMaterial color={i % 2 ? '#8a3b22' : '#7a3019'} roughness={0.95} />
        </mesh>
      ))}
      {[-0.25, 0, 0.25].map((x, i) => (
        <mesh key={x} position={[x * 0.6, 0.06, 0.35]} rotation={[Math.PI / 2 - 0.2, 0, x]}>
          <cylinderGeometry args={[0.04, 0.05, 0.7, 8]} />
          <meshStandardMaterial color="#4a2a14" />
        </mesh>
      ))}
      <group scale={fireScale} position-y={0.05}>
        {[[0, 0, 0, 0.42, '#ff7a14'], [0.1, 0, 0.06, 0.3, '#ffb21f'], [-0.1, 0, -0.04, 0.32, '#ff5a0a'], [0.02, 0, 0.12, 0.22, '#ffe08a']].map(([x, y, z, h, c], i) => (
          <mesh key={i} ref={(el) => (flames.current[i] = el)} position={[x, y + h / 2, z]}>
            <coneGeometry args={[0.1 - i * 0.012, h, 8]} />
            <meshBasicMaterial color={c} toneMapped={false} transparent opacity={0.92} />
          </mesh>
        ))}
      </group>
      {light && <pointLight ref={lightRef} position={[0, 0.5, 0.3]} color="#ff7a2a" distance={7} decay={1.6} intensity={9} />}
    </group>
  )
}

/* ---------------- rising steam ---------------- */
export function Steam({ count = 16, height = 1.6, spread = 0.35, size = 0.6, speed = 0.35, opacity = 0.35, ...props }) {
  const tex = steamTexture()
  const sprites = useRef([])
  const seeds = useMemo(() => Array.from({ length: count }, () => ({ o: Math.random(), x: rand(-1, 1), z: rand(-1, 1), s: rand(0.7, 1.3) })), [count])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    sprites.current.forEach((sp, i) => {
      if (!sp) return
      const sd = seeds[i]
      const k = (t * speed * sd.s + sd.o) % 1
      sp.position.set(sd.x * spread * (0.4 + k) + Math.sin(t + i) * 0.08, k * height, sd.z * spread * (0.4 + k))
      const sc = size * (0.4 + k * 1.2)
      sp.scale.set(sc, sc, sc)
      sp.material.opacity = Math.sin(k * Math.PI) * opacity
    })
  })
  return (
    <group {...props}>
      {seeds.map((_, i) => (
        <sprite key={i} ref={(el) => (sprites.current[i] = el)}>
          <spriteMaterial map={tex} transparent depthWrite={false} color="#fff3e2" />
        </sprite>
      ))}
    </group>
  )
}

/* ---------------- ammi kal (grinding stone) ---------------- */
export function Ammi({ seed = 0, ...props }) {
  const roller = useRef()
  const z = useRef(0.02)
  useFrame(({ clock }, dt) => {
    const { active, p } = grindStroke(clock.elapsedTime + seed * 7.3)
    const target = active ? 0.02 + p * 0.1 : 0.02
    const prev = z.current
    z.current += (target - z.current) * Math.min(1, dt * 14)
    roller.current.position.z = z.current
    roller.current.rotation.y -= (z.current - prev) / 0.05
  })
  return (
    <group {...props}>
      <mesh position-y={0.4}>
        <boxGeometry args={[0.85, 0.8, 0.6]} />
        <meshStandardMaterial color="#6b4a32" roughness={0.9} />
      </mesh>
      <mesh position-y={0.85}>
        <boxGeometry args={[0.5, 0.1, 0.55]} />
        <meshStandardMaterial color="#4a4744" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, 0.9, 0.06]} scale={[1.5, 0.22, 1.8]}>
        <sphereGeometry args={[0.1, 12, 8]} />
        <meshStandardMaterial color="#5c8f2a" roughness={0.6} />
      </mesh>
      <mesh ref={roller} position={[0, 0.95, 0.02]} rotation-z={Math.PI / 2} rotation-order="ZXY">
        <cylinderGeometry args={[0.05, 0.05, 0.44, 14]} />
        <meshStandardMaterial color="#5a5653" roughness={0.9} flatShading />
      </mesh>
    </group>
  )
}

/* ---------------- floating spices ---------------- */
function starAniseGeo() {
  const s = new THREE.Shape()
  const n = 8
  for (let i = 0; i <= n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2
    const r = i % 2 ? 0.035 : 0.12
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    i ? s.lineTo(x, y) : s.moveTo(x, y)
  }
  return new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 1 })
}
function chiliGeo() {
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.08, -0.12, 0), new THREE.Vector3(0.05, -0.28, 0), new THREE.Vector3(-0.03, -0.36, 0)])
  const g = new THREE.TubeGeometry(curve, 16, 0.04, 8)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i)
    const k = 1 - Math.min(1, Math.max(0, -y / 0.38)) * 0.85
    const cx = y > -0.12 ? (0.08 * -y) / 0.12 : 0.05
    p.setX(i, cx + (p.getX(i) - cx) * k)
    p.setZ(i, p.getZ(i) * k)
  }
  g.computeVertexNormals()
  return g
}

export function Spices({ radius = 2, count = 34, height = 1.4, ...props }) {
  const geos = useMemo(
    () => ({
      anise: starAniseGeo(),
      chili: chiliGeo(),
      cardamom: new THREE.SphereGeometry(0.05, 10, 8).scale(1, 1.7, 1),
      cinnamon: new THREE.CylinderGeometry(0.035, 0.035, 0.32, 10, 1, true, 0, Math.PI * 1.6),
      clove: new THREE.CylinderGeometry(0.012, 0.008, 0.11, 6),
      leaf: (() => {
        const s = new THREE.Shape()
        s.moveTo(0, 0)
        s.quadraticCurveTo(0.08, 0.12, 0, 0.3)
        s.quadraticCurveTo(-0.08, 0.12, 0, 0)
        return new THREE.ShapeGeometry(s, 8)
      })(),
      pepper: new THREE.IcosahedronGeometry(0.03, 1),
      garlic: new THREE.SphereGeometry(0.06, 12, 10).scale(1, 0.85, 1),
    }),
    [],
  )
  const kinds = [
    ['anise', '#5a2a12'],
    ['chili', '#c4160f'],
    ['cardamom', '#7fa83a'],
    ['cinnamon', '#8a4a1f'],
    ['clove', '#3a1a0c'],
    ['leaf', '#6b7d2a'],
    ['leaf', '#2f9b3a'],
    ['pepper', '#1a120c'],
    ['garlic', '#f3ead6'],
  ]
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const [k, c] = kinds[i % kinds.length]
        return { k, c, a: (i / count) * Math.PI * 2, r: radius * (0.75 + Math.random() * 0.5), y: Math.random() * height, sp: 0.15 + Math.random() * 0.2, rot: Math.random() * 5 }
      }),
    [count, radius, height],
  )
  const refs = useRef([])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    items.forEach((it, i) => {
      const m = refs.current[i]
      if (!m) return
      const a = it.a + t * it.sp
      m.position.set(Math.cos(a) * it.r, it.y + Math.sin(t * 1.2 + i) * 0.18, Math.sin(a) * it.r)
      m.rotation.set(t * 0.7 + it.rot, t * 0.9 + i, it.rot)
    })
  })
  return (
    <group {...props}>
      {items.map((it, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} geometry={geos[it.k]} scale={1.6}>
          <meshStandardMaterial color={it.c} roughness={0.55} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------------- kuthu vilakku (brass oil lamp) ---------------- */
export function Vilakku(props) {
  const geo = useMemo(() => {
    const pts = [[0, 0], [0.22, 0], [0.22, 0.03], [0.08, 0.07], [0.04, 0.12], [0.035, 0.6], [0.06, 0.65], [0.035, 0.7], [0.035, 0.9], [0.2, 0.95], [0.21, 0.99], [0.04, 1.0], [0.03, 1.12], [0.06, 1.2], [0, 1.32]].map(([x, y]) => new THREE.Vector2(x, y))
    return new THREE.LatheGeometry(pts, 32)
  }, [])
  const flames = useRef([])
  useFrame(({ clock }) => {
    flames.current.forEach((f, i) => f && (f.scale.y = 1 + Math.sin(clock.elapsedTime * 11 + i * 2) * 0.2))
  })
  return (
    <group {...props}>
      <mesh geometry={geo}>
        <meshStandardMaterial color="#d6a33a" metalness={0.95} roughness={0.22} side={THREE.DoubleSide} />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <mesh key={i} ref={(el) => (flames.current[i] = el)} position={[Math.cos(a) * 0.2, 1.05, Math.sin(a) * 0.2]}>
            <coneGeometry args={[0.022, 0.1, 8]} />
            <meshBasicMaterial color="#ffc04d" toneMapped={false} />
          </mesh>
        )
      })}
      <pointLight position-y={1.15} color="#ffb347" intensity={3} distance={4} decay={1.8} />
    </group>
  )
}

/* ---------------- banana leaf ---------------- */
export function BananaLeaf({ size = 1, ...props }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.45, -0.22)
    s.quadraticCurveTo(0, -0.3, 0.45, -0.2)
    s.quadraticCurveTo(0.55, 0, 0.45, 0.2)
    s.quadraticCurveTo(0, 0.3, -0.45, 0.22)
    s.lineTo(-0.45, -0.22)
    return new THREE.ShapeGeometry(s, 12)
  }, [])
  return (
    <group scale={size} {...props}>
      <mesh geometry={geo} rotation-x={-Math.PI / 2}>
        <meshStandardMaterial color="#2f8a2a" roughness={0.45} side={THREE.DoubleSide} />
      </mesh>
      <mesh position-y={0.003} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.9, 0.012]} />
        <meshStandardMaterial color="#9bcf5a" />
      </mesh>
    </group>
  )
}

/* ---------------- coconut palm ---------------- */
export function CoconutTree({ height = 6, lean = 0.25, ...props }) {
  const frondGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.55, 2.6, 2, 12)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) + 1.3
      const k = y / 2.6
      p.setX(i, p.getX(i) * (1 - k * 0.85))
      p.setZ(i, y * 0.95)
      p.setY(i, y * 0.5 - k * k * 1.7)
    }
    g.computeVertexNormals()
    return g
  }, [])
  const segs = 9
  const top = [Math.sin(lean) * height * 0.5, height, 0]
  return (
    <group {...props}>
      {Array.from({ length: segs }).map((_, i) => {
        const k = i / segs
        const x = Math.sin(lean) * height * 0.5 * k * k
        return (
          <mesh key={i} position={[x, (height / segs) * (i + 0.5), 0]} rotation-z={-lean * k}>
            <cylinderGeometry args={[0.15 - k * 0.04, 0.17 - k * 0.04, height / segs + 0.02, 10]} />
            <meshStandardMaterial color={i % 2 ? '#6e5137' : '#5d432c'} roughness={1} />
          </mesh>
        )
      })}
      <group position={top}>
        {Array.from({ length: 10 }).map((_, i) => (
          <mesh key={i} geometry={frondGeo} rotation={[0, (i / 10) * Math.PI * 2, 0]}>
            <meshStandardMaterial color={i % 2 ? '#2e6b1f' : '#3d7d26'} side={THREE.DoubleSide} roughness={0.7} />
          </mesh>
        ))}
        {[0, 2.1, 4.2].map((a) => (
          <mesh key={a} position={[Math.cos(a) * 0.18, -0.15, Math.sin(a) * 0.18]}>
            <sphereGeometry args={[0.13, 10, 8]} />
            <meshStandardMaterial color="#4a5d1f" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/* ---------------- banana plant ---------------- */
export function BananaPlant({ height = 2.2, ...props }) {
  const leafGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.6, 1.8, 2, 10)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) + 0.9
      const k = y / 1.8
      p.setX(i, p.getX(i) * Math.sin(Math.max(0.15, k) * Math.PI) * 1.1)
      p.setZ(i, y * 0.55)
      p.setY(i, y * 0.85 - k * k * 0.7)
    }
    g.computeVertexNormals()
    return g
  }, [])
  return (
    <group {...props}>
      <mesh position-y={height / 2}>
        <cylinderGeometry args={[0.1, 0.16, height, 10]} />
        <meshStandardMaterial color="#6f8f3a" roughness={0.8} />
      </mesh>
      <group position-y={height}>
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh key={i} geometry={leafGeo} rotation={[0, (i / 7) * Math.PI * 2, 0]}>
            <meshStandardMaterial color={i % 2 ? '#3f8f2a' : '#4fa236'} side={THREE.DoubleSide} roughness={0.55} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/* ---------------- kolam on the ground ---------------- */
export function Kolam({ size = 2.6, ...props }) {
  const tex = kolamTexture()
  return (
    <mesh rotation-x={-Math.PI / 2} {...props}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial map={tex} transparent depthWrite={false} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.25} />
    </mesh>
  )
}

/* ---------------- festival serial lights ---------------- */
export function SerialLights({ from, to, sag = 0.6, count = 30 }) {
  const ref = useRef()
  const pts = useMemo(() => {
    const a = new THREE.Vector3(...from)
    const b = new THREE.Vector3(...to)
    return Array.from({ length: count }, (_, i) => {
      const t = i / (count - 1)
      const p = a.clone().lerp(b, t)
      p.y -= Math.sin(t * Math.PI) * sag
      return p
    })
  }, [from, to, sag, count])
  const palette = useMemo(() => ['#ff3b3b', '#ffd23b', '#3bff6b', '#3bb5ff', '#ff3bd8'].map((c) => new THREE.Color(c).multiplyScalar(3)), [])
  useLayoutEffect(() => {
    const d = new THREE.Object3D()
    pts.forEach((p, i) => {
      d.position.copy(p)
      d.updateMatrix()
      ref.current.setMatrixAt(i, d.matrix)
      ref.current.setColorAt(i, palette[i % palette.length])
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [pts])
  const dim = useMemo(() => new THREE.Color('#331a10'), [])
  useFrame(({ clock }) => {
    const s = Math.floor(clock.elapsedTime * 4)
    pts.forEach((_, i) => ref.current.setColorAt(i, (i + s) % 3 === 0 ? dim : palette[(i + Math.floor(s / 3)) % palette.length]))
    ref.current.instanceColor.needsUpdate = true
  })
  const lineGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(pts), [pts])
  return (
    <group>
      <line geometry={lineGeo}>
        <lineBasicMaterial color="#1a0d06" />
      </line>
      <instancedMesh ref={ref} args={[null, null, pts.length]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

/* ---------------- rice sack ---------------- */
export function Sack({ label = 'சீரக சம்பா', ...props }) {
  const tex = sackTexture(label)
  return (
    <group {...props}>
      <mesh position-y={0.42} scale={[1, 1, 0.8]}>
        <capsuleGeometry args={[0.3, 0.3, 6, 16]} />
        <meshStandardMaterial map={tex} roughness={1} />
      </mesh>
      <mesh position-y={0.86}>
        <coneGeometry args={[0.12, 0.16, 10]} />
        <meshStandardMaterial color="#b8955a" roughness={1} />
      </mesh>
    </group>
  )
}

/* ---------------- banner on two bamboo poles ---------------- */
export function Banner({ ta, en, width = 3.4, height = 0.85, y = 2.6, ...props }) {
  const tex = bannerTexture(ta, en)
  return (
    <group {...props}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * width) / 2 + s * 0.08, y / 2 + 0.2, 0]}>
          <cylinderGeometry args={[0.06, 0.07, y + 0.4, 8]} />
          <meshStandardMaterial color="#c4621f" />
        </mesh>
      ))}
      <mesh position-y={y}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial map={tex} side={THREE.DoubleSide} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}

/* ---------------- paai (woven mat) ---------------- */
export function Mat({ w = 3, d = 1.6, ...props }) {
  const tex = matTexture()
  return (
    <mesh rotation-x={-Math.PI / 2} {...props}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial map={tex} roughness={1} />
    </mesh>
  )
}

/* ---------------- hanging bulb ---------------- */
export function HangingBulb({ y = 3, ...props }) {
  return (
    <group {...props}>
      <mesh position-y={y + 0.6}>
        <cylinderGeometry args={[0.005, 0.005, 1.2, 4]} />
        <meshBasicMaterial color="#111" />
      </mesh>
      <mesh position-y={y}>
        <sphereGeometry args={[0.07, 12, 10]} />
        <meshBasicMaterial color={new THREE.Color('#ffd28a').multiplyScalar(4)} toneMapped={false} />
      </mesh>
      <pointLight position-y={y - 0.1} color="#ffc070" intensity={6} distance={6} decay={1.6} />
    </group>
  )
}

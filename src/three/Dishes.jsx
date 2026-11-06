import { useMemo } from 'react'
import * as THREE from 'three'
import { Handi, BananaLeaf, Steam } from './Props'

const steel = { color: '#d9dde2', metalness: 0.95, roughness: 0.18 }

function Plate({ r = 0.55 }) {
  return (
    <group>
      <mesh position-y={0.02}>
        <cylinderGeometry args={[r, r * 0.9, 0.04, 40]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      <mesh position-y={0.045} rotation-x={Math.PI / 2}>
        <torusGeometry args={[r, 0.018, 8, 40]} />
        <meshStandardMaterial {...steel} />
      </mesh>
    </group>
  )
}

function Bowl({ r = 0.42, color = '#d9dde2', metal = true, liquid }) {
  const geo = useMemo(() => {
    const pts = [[0, 0], [r * 0.6, 0], [r * 0.85, 0.08], [r, 0.26], [r * 1.03, 0.3], [r * 0.97, 0.3]].map(([x, y]) => new THREE.Vector2(x, y))
    return new THREE.LatheGeometry(pts, 40)
  }, [r])
  return (
    <group>
      <mesh geometry={geo}>
        <meshStandardMaterial color={color} metalness={metal ? 0.95 : 0} roughness={metal ? 0.18 : 0.85} side={THREE.DoubleSide} />
      </mesh>
      {liquid && (
        <mesh position-y={0.24} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[r * 0.95, 40]} />
          <meshStandardMaterial color={liquid} roughness={0.25} metalness={0.1} />
        </mesh>
      )}
    </group>
  )
}

function Chunks({ n = 18, color = '#c0391b', spread = 0.32, y = 0.08, size = 0.07, seed = 1 }) {
  const items = useMemo(() => {
    let s = seed
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
    return Array.from({ length: n }, (_, i) => {
      const a = r() * Math.PI * 2
      const rad = Math.sqrt(r()) * spread
      return { p: [Math.cos(a) * rad, y + (1 - rad / spread) * 0.12 + r() * 0.04, Math.sin(a) * rad], rot: [r() * 6, r() * 6, r() * 6], s: size * (0.8 + r() * 0.5) }
    })
  }, [n, spread, y, size, seed])
  return items.map((it, i) => (
    <mesh key={i} position={it.p} rotation={it.rot} scale={it.s}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={color} roughness={0.55} flatShading />
    </mesh>
  ))
}

function CurryLeaves({ n = 6, r = 0.3, y = 0.2 }) {
  return Array.from({ length: n }).map((_, i) => (
    <mesh key={i} position={[Math.cos(i * 2.1) * r, y, Math.sin(i * 2.1) * r]} rotation={[-1.3, i, 0]} scale={[1, 2, 1]}>
      <circleGeometry args={[0.03, 8]} />
      <meshStandardMaterial color="#1f6b1a" side={THREE.DoubleSide} />
    </mesh>
  ))
}

function Cashews({ n = 7, r = 0.22, y = 0.28 }) {
  return Array.from({ length: n }).map((_, i) => (
    <mesh key={i} position={[Math.cos(i * 2.4) * r * (0.4 + (i % 3) * 0.3), y - (i % 3) * 0.04, Math.sin(i * 2.4) * r * (0.4 + (i % 3) * 0.3)]} rotation={[Math.PI / 2, 0, i]}>
      <torusGeometry args={[0.035, 0.016, 6, 10, Math.PI * 1.2]} />
      <meshStandardMaterial color="#efd8a8" roughness={0.6} />
    </mesh>
  ))
}

export function Dish({ visual, variant = 1 }) {
  switch (visual) {
    case 'handi-chicken':
    case 'handi-mutton':
      return (
        <group>
          <Handi scale={0.62} variant={variant} meat={visual === 'handi-mutton' ? 'mutton' : 'chicken'} />
          <Steam position-y={0.62} count={12} height={1.1} spread={0.2} size={0.45} opacity={0.3} />
        </group>
      )
    case 'chicken65':
      return (
        <group>
          <Plate />
          <BananaLeaf size={0.95} position-y={0.05} />
          <Chunks n={22} color="#c0341a" y={0.1} seed={3} />
          {[0.25, -0.2].map((x, i) => (
            <mesh key={i} position={[x, 0.1, 0.25 - i * 0.45]} rotation-x={Math.PI / 2}>
              <torusGeometry args={[0.07, 0.012, 6, 16]} />
              <meshStandardMaterial color="#e9c6d8" />
            </mesh>
          ))}
          <mesh position={[0.32, 0.1, -0.15]} rotation-z={Math.PI / 2}>
            <sphereGeometry args={[0.08, 12, 8, 0, Math.PI]} />
            <meshStandardMaterial color="#e9d63a" />
          </mesh>
          <CurryLeaves y={0.25} r={0.2} />
          <Steam position-y={0.2} count={8} height={0.8} spread={0.2} size={0.35} opacity={0.25} />
        </group>
      )
    case 'gravy-chettinad':
    case 'gravy-pepper': {
      const pepper = visual === 'gravy-pepper'
      return (
        <group>
          <Plate r={0.6} />
          <group position-y={0.04}>
            <Bowl liquid={pepper ? '#4a2a12' : '#8a2d0e'} />
            <Chunks n={9} color={pepper ? '#3a1d0c' : '#6e260c'} spread={0.25} y={0.22} size={0.06} seed={pepper ? 7 : 5} />
            {pepper && <Chunks n={30} color="#0b0805" spread={0.32} y={0.25} size={0.012} seed={11} />}
            <CurryLeaves y={0.3} r={0.22} />
          </group>
          <Steam position-y={0.35} count={10} height={0.9} spread={0.2} size={0.4} opacity={0.3} />
        </group>
      )
    }
    case 'kesari':
    case 'halwa': {
      const halwa = visual === 'halwa'
      return (
        <group>
          <Plate />
          <BananaLeaf size={0.95} position-y={0.05} />
          <mesh position-y={0.06} scale={[1, 0.55, 1]}>
            <sphereGeometry args={[0.36, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={halwa ? '#6b2410' : '#f59a1a'} roughness={halwa ? 0.15 : 0.5} metalness={0.05} />
          </mesh>
          <Cashews y={0.24} />
          {!halwa &&
            Array.from({ length: 5 }).map((_, i) => (
              <mesh key={i} position={[Math.cos(i * 1.3) * 0.15, 0.24, Math.sin(i * 1.3) * 0.15]}>
                <sphereGeometry args={[0.022, 8, 6]} />
                <meshStandardMaterial color="#3d1408" />
              </mesh>
            ))}
        </group>
      )
    }
    case 'firni':
      return (
        <group>
          <Plate />
          <group position-y={0.04}>
            <Bowl r={0.38} color="#9c4a2a" metal={false} liquid="#f5ead0" />
            <Chunks n={18} color="#7cb342" spread={0.25} y={0.26} size={0.018} seed={13} />
            {Array.from({ length: 8 }).map((_, i) => (
              <mesh key={i} position={[Math.cos(i) * 0.18, 0.26, Math.sin(i) * 0.18]} rotation={[Math.PI / 2, 0, i]}>
                <cylinderGeometry args={[0.003, 0.003, 0.08, 4]} />
                <meshBasicMaterial color="#e2380f" />
              </mesh>
            ))}
          </group>
        </group>
      )
    default:
      return null
  }
}

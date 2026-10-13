import * as THREE from 'three'

const cache = new Map()

function canvasTexture(key, w, h, draw, opts = {}) {
  if (cache.has(key)) return cache.get(key)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d'), w, h)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  if (opts.repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(...opts.repeat)
  }
  cache.set(key, tex)
  return tex
}

export const steamTexture = () =>
  canvasTexture('steam', 128, 128, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
    grd.addColorStop(0, 'rgba(255,255,255,0.9)')
    grd.addColorStop(0.4, 'rgba(255,255,255,0.35)')
    grd.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grd
    g.fillRect(0, 0, w, h)
  })

export const glowTexture = () =>
  canvasTexture('glow', 128, 128, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
    grd.addColorStop(0, 'rgba(255,220,150,1)')
    grd.addColorStop(0.25, 'rgba(255,150,60,0.6)')
    grd.addColorStop(1, 'rgba(255,90,20,0)')
    g.fillStyle = grd
    g.fillRect(0, 0, w, h)
  })

export const kolamTexture = () =>
  canvasTexture('kolam', 1024, 1024, (g, w) => {
    g.clearRect(0, 0, w, w)
    const n = 7
    const step = w / (n + 1)
    g.strokeStyle = 'rgba(255,250,235,0.95)'
    g.fillStyle = 'rgba(255,250,235,0.95)'
    g.lineWidth = 9
    g.lineCap = 'round'
    const cx = w / 2
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= n; j++) {
        const x = i * step
        const y = j * step
        const d = Math.abs(i - 4) + Math.abs(j - 4)
        if (d > 3) continue
        g.beginPath()
        g.arc(x, y, 8, 0, Math.PI * 2)
        g.fill()
        g.beginPath()
        g.arc(x, y, step * 0.42, (Math.PI / 4) * ((i + j) % 4), (Math.PI / 4) * ((i + j) % 4) + Math.PI * 1.5)
        g.stroke()
      }
    }
    g.lineWidth = 14
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2
      g.beginPath()
      g.ellipse(cx + Math.cos(a) * w * 0.36, cx + Math.sin(a) * w * 0.36, w * 0.07, w * 0.035, a, 0, Math.PI * 2)
      g.stroke()
    }
    g.strokeStyle = 'rgba(232,80,40,0.95)'
    g.beginPath()
    g.arc(cx, cx, w * 0.46, 0, Math.PI * 2)
    g.stroke()
    g.strokeStyle = 'rgba(244,182,63,0.95)'
    g.beginPath()
    g.arc(cx, cx, w * 0.485, 0, Math.PI * 2)
    g.stroke()
  })

export const checkTexture = (a = '#1f4fa8', b = '#e9e4d6', key = 'chk') =>
  canvasTexture(`check-${a}-${b}-${key}`, 128, 128, (g, w) => {
    g.fillStyle = b
    g.fillRect(0, 0, w, w)
    g.fillStyle = a
    g.globalAlpha = 0.75
    for (let i = 0; i < 4; i++) {
      g.fillRect(i * 32, 0, 14, w)
      g.fillRect(0, i * 32, w, 14)
    }
    g.globalAlpha = 1
  }, { repeat: [3, 3] })

export const sackTexture = (label) =>
  canvasTexture(`sack-${label}`, 512, 512, (g, w, h) => {
    g.fillStyle = '#c9a66b'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = 'rgba(90,60,25,0.25)'
    for (let i = 0; i < w; i += 6) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke()
      g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke()
    }
    g.fillStyle = '#8b1a0f'
    g.font = 'bold 64px "Baloo Thambi 2", "Tamil Sangam MN", sans-serif'
    g.textAlign = 'center'
    g.fillText(label, w / 4, h / 2)
    g.font = 'bold 34px "Baloo Thambi 2", sans-serif'
    g.fillStyle = '#2d5a1d'
    g.fillText('குடில்', w / 4, h / 2 + 60)
  })

export const bannerTexture = (ta, en) =>
  canvasTexture(`banner-${ta}`, 1024, 256, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h)
    grd.addColorStop(0, '#b3200f')
    grd.addColorStop(1, '#6d0f07')
    g.fillStyle = grd
    g.fillRect(0, 0, w, h)
    g.strokeStyle = '#f4b63f'
    g.lineWidth = 10
    g.strokeRect(14, 14, w - 28, h - 28)
    g.fillStyle = '#fff4e0'
    g.textAlign = 'center'
    g.font = 'bold 92px "Baloo Thambi 2", "Tamil Sangam MN", sans-serif'
    g.fillText(ta, w / 2, h / 2 + 10)
    g.font = '600 38px "Poppins", sans-serif'
    g.fillStyle = '#f4b63f'
    g.fillText(en, w / 2, h / 2 + 70)
  })

export const matTexture = () =>
  canvasTexture('paai', 256, 256, (g, w, h) => {
    const cols = ['#c98d3f', '#a8432a', '#d9b061', '#3d6b3a', '#d9b061']
    for (let i = 0; i < 32; i++) {
      g.fillStyle = cols[i % cols.length]
      g.fillRect(0, i * 8, w, 8)
    }
    g.fillStyle = 'rgba(0,0,0,0.12)'
    for (let i = 0; i < w; i += 4) g.fillRect(i, 0, 1, h)
  }, { repeat: [1, 1] })

export const groundTexture = () =>
  canvasTexture('ground', 512, 512, (g, w, h) => {
    g.fillStyle = '#4a2c17'
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 5000; i++) {
      const v = Math.random()
      g.fillStyle = v > 0.5 ? 'rgba(120,75,40,0.35)' : 'rgba(30,15,6,0.35)'
      g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 2 + Math.random() * 3)
    }
  }, { repeat: [40, 40] })

import { lazy, Suspense, useEffect, useState } from 'react'
import { CartProvider, useCart } from './cart'
import Catalog from './components/Catalog'
import Catering from './components/Catering'
import { CartDrawer, Toast } from './components/Cart'
import { BRAND, INGREDIENTS, STEPS, REVIEWS } from './data/menu'
import { useScene } from './store'

const Experience = lazy(() => import('./three/Experience'))

function useReveal(ready) {
  useEffect(() => {
    if (!ready) return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
      { threshold: 0.15 },
    )
    const scan = () => document.querySelectorAll('.reveal:not(.in)').forEach((el) => io.observe(el))
    scan()
    const mo = new MutationObserver(scan)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [ready])
}

function Loader({ done }) {
  return (
    <div className={`loader ${done ? 'gone' : ''}`}>
      <div className="loader-inner">
        <div className="loader-steam">
          <span />
          <span />
          <span />
        </div>
        <img src="/kudil-logo.jpg" alt="Kudil Biryani" />
        <p className="ta">அடுப்பு பத்த வைக்கிறோம்…</p>
        <div className="loader-bar">
          <i />
        </div>
      </div>
    </div>
  )
}

const LINKS = [
  ['#home', 'முகப்பு', 'Home'],
  ['#masala', 'மசாலா', 'Masala'],
  ['#menu', 'மெனு', 'Menu'],
  ['#catering', 'கேட்டரிங்', 'Catering'],
  ['#contact', 'தொடர்பு', 'Contact'],
]

function Nav() {
  const { count, setOpen } = useCart()
  const station = useScene((s) => s.station)
  const [menu, setMenu] = useState(false)
  const activeHref = ['#home', '#masala', '#masala', '#menu', null, '#catering', '#contact'][station]
  return (
    <nav className="nav">
      <a href="#home" className="brand">
        <img src="/kudil-logo.jpg" alt="" />
        <span>
          <b className="ta">{BRAND.ta}</b>
          <small>Trichy · Halal</small>
        </span>
      </a>
      <div className={`links ${menu ? 'open' : ''}`}>
        {LINKS.map(([href, ta, en]) => (
          <a key={href} href={href} className={activeHref === href ? 'on' : ''} onClick={() => setMenu(false)}>
            <span className="ta">{ta}</span>
            <small>{en}</small>
          </a>
        ))}
      </div>
      <div className="nav-actions">
        <a className="btn btn-ghost hide-sm" href={`tel:+${BRAND.phoneIntl}`}>
          {BRAND.phone}
        </a>
        <button className="cart-btn" onClick={() => setOpen(true)} aria-label="Open order">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 11h18l-2 9H5l-2-9z" />
            <path d="M7 11a5 5 0 0 1 10 0" />
          </svg>
          {count > 0 && <span className="badge">{count}</span>}
        </button>
        <button className="burger" onClick={() => setMenu((m) => !m)} aria-label="Menu">
          <i />
          <i />
        </button>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section id="home" className="section hero" data-station="0">
      <div className="hero-copy">
        <p className="eyebrow reveal">Trichy · Our Heritage, Our Pride</p>
        <h1 className="reveal">
          <span className="ta mega">குடில்</span>
          <span className="ta mega fire">பிரியாணி</span>
        </h1>
        <p className="tagline reveal">{BRAND.tagline}</p>
        <p className="lead reveal">
          Seeraga samba dum biryani, slow-cooked over firewood by our biryani masters. For your home, your function, your people.
        </p>
        <div className="row reveal">
          <a href="#menu" className="btn btn-fire">Order Now</a>
          <a href="#catering" className="btn btn-ghost">Wedding Catering</a>
        </div>
        <div className="chips reveal">
          <span>100% Halal</span>
          <span>Firewood Dum</span>
          <span>Stone-ground Masala</span>
        </div>
      </div>
      <div className="scroll-hint">
        <span className="mouse" />
        <small>Scroll · கீழே போங்க</small>
      </div>
      <div className="marquee" aria-hidden="true">
        <div>
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k}>
              மணக்கும் பிரியாணி ✦ Seeraga Samba ✦ தம் பிரியாணி ✦ Chettinadu Gravy ✦ கல்யாண பிரியாணி ✦ Chicken 65 ✦ பிரெட் அல்வா ✦ Mini Hall Catering ✦&nbsp;
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function Masala() {
  return (
    <section id="masala" className="section" data-station="1">
      <div className="panel reveal">
        <p className="eyebrow">மசாலா தான் ரகசியம்</p>
        <h2 className="title">
          Ground by <span className="fire">hand</span>, not by machine.
        </h2>
        <p className="lead">Every morning Amma sits at the ammi kal and grinds the day's masala. That smell is the first thing you notice at Kudil.</p>
        <div className="ingredients">
          {INGREDIENTS.map((i, k) => (
            <div key={i.en} className="ing reveal" style={{ '--d': `${k * 70}ms` }}>
              <b className="ta">{i.ta}</b>
              <span>{i.en}</span>
              <small>{i.note}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Dum() {
  return (
    <section id="dum" className="section" data-station="2">
      <div className="panel reveal">
        <p className="eyebrow">தம் போடுறோம் · The Dum Ritual</p>
        <h2 className="title">
          Sealed, slow, <span className="fire">smoky</span>.
        </h2>
        <div className="steps">
          {STEPS.map((s, k) => (
            <div key={s.n} className="step reveal" style={{ '--d': `${k * 90}ms` }}>
              <span className="n">{s.n}</span>
              <div>
                <b>
                  <span className="ta">{s.ta}</span> · {s.en}
                </b>
                <p>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Together() {
  return (
    <section id="together" className="section" data-station="4">
      <div className="panel reveal">
        <p className="eyebrow">எல்லோரும் சேர்ந்து சாப்பிடலாம்</p>
        <h2 className="title">
          {BRAND.promise.replace('…', '')}
          <span className="fire">…</span>
        </h2>
        <div className="stats">
          <div>
            <b>9</b>
            <small>servings per padi</small>
          </div>
          <div>
            <b>130g</b>
            <small>per chicken piece</small>
          </div>
          <div>
            <b>1.5kg</b>
            <small>mutton per padi</small>
          </div>
        </div>
        <div className="reviews">
          {REVIEWS.map((r, k) => (
            <figure key={r.name} className="review reveal" style={{ '--d': `${k * 90}ms` }}>
              <blockquote>“{r.text}”</blockquote>
              <figcaption>
                <b>{r.name}</b> · {r.place}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

function Contact() {
  return (
    <section id="contact" className="section contact" data-station="6">
      <div className="panel center reveal">
        <p className="eyebrow">வாங்க பேசலாம்</p>
        <h2 className="title">
          Hungry? <span className="fire">Call Kudil.</span>
        </h2>
        <div className="contact-grid">
          <a href={`tel:+${BRAND.phoneIntl}`} className="contact-card">
            <small>Call us</small>
            <b>{BRAND.phone}</b>
          </a>
          <a href={`https://wa.me/${BRAND.phoneIntl}`} target="_blank" rel="noreferrer" className="contact-card wa">
            <small>WhatsApp</small>
            <b>Chat & Order</b>
          </a>
          <a href={`mailto:${BRAND.email}`} className="contact-card">
            <small>Email</small>
            <b className="email">{BRAND.email}</b>
          </a>
        </div>
        <p className="lead">{BRAND.city} · Traditional Flavors · Memorable Occasions · Happy People</p>
      </div>
      <footer>
        © {new Date().getFullYear()} Kudil Biryani & Catering, Trichy · <span className="ta">சுவை நினைவில் நிற்கும்</span>
      </footer>
    </section>
  )
}

function Site() {
  const [fontsReady, setFontsReady] = useState(false)
  const [loaded, setLoaded] = useState(false)
  useReveal(fontsReady)

  useEffect(() => {
    const min = new Promise((r) => setTimeout(r, 1800))
    const fonts = Promise.all([
      document.fonts.load('700 64px "Baloo Thambi 2"', 'தமிழ்'),
      document.fonts.load('600 38px "Poppins"'),
    ]).catch(() => {})
    const cap = new Promise((r) => setTimeout(r, 3500))
    Promise.race([fonts, cap]).then(() => setFontsReady(true))
    Promise.all([min, Promise.race([fonts, cap])]).then(() => setLoaded(true))
  }, [])

  useEffect(() => {
    const n = new URLSearchParams(location.search).get('station')
    if (n === null || !fontsReady) return
    requestAnimationFrame(() => document.querySelector(`[data-station="${n}"]`)?.scrollIntoView({ behavior: 'instant' }))
  }, [fontsReady])

  return (
    <>
      <Loader done={loaded} />
      {fontsReady && (
        <Suspense fallback={null}>
          <Experience />
        </Suspense>
      )}
      <Nav />
      <main>
        <Hero />
        <Masala />
        <Dum />
        <Catalog />
        <Together />
        <Catering />
        <Contact />
      </main>
      <CartDrawer />
      <Toast />
    </>
  )
}

export default function App() {
  return (
    <CartProvider>
      <Site />
    </CartProvider>
  )
}

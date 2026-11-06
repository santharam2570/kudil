import { useMemo, useState } from 'react'
import { MENU, BRAND, formatINR } from '../data/menu'
import { useCart } from '../cart'

const TIER_LABEL = { budget: 'Budget · Thulasi Gold', premium: 'Premium · Kalyana Biryani', luxury: 'Luxury · Pure Seeraga Samba' }

export default function Catering() {
  const { add, setOpen } = useCart()
  const [guests, setGuests] = useState(100)
  const [meat, setMeat] = useState('chicken')
  const [tier, setTier] = useState('premium')
  const [extras, setExtras] = useState({ 'chicken-65': 0, kesari: 0 })

  const pack = MENU.find((m) => m.id === `${meat}-${tier}`)
  const padis = Math.max(1, Math.ceil(guests / 9))
  const extrasTotal = Object.entries(extras).reduce((s, [id, q]) => s + (MENU.find((m) => m.id === id)?.price || 0) * q, 0)
  const total = pack.price * padis + extrasTotal

  const enquiry = useMemo(() => {
    const msg = [
      'வணக்கம் Kudil Catering!',
      `Catering enquiry for ${guests} guests.`,
      `${pack.name} (${pack.rice}) × ${padis} Padi = ${formatINR(pack.price * padis)}`,
      ...Object.entries(extras)
        .filter(([, q]) => q > 0)
        .map(([id, q]) => {
          const it = MENU.find((m) => m.id === id)
          return `${it.name} × ${q} ${it.unit} = ${formatINR(it.price * q)}`
        }),
      `Estimated total: ${formatINR(total)}`,
    ].join('\n')
    return `https://wa.me/${BRAND.phoneIntl}?text=${encodeURIComponent(msg)}`
  }, [guests, pack, padis, extras, total])

  return (
    <section id="catering" className="section" data-station="5">
      <div className="panel wide reveal">
        <p className="eyebrow">கல்யாணம் · விசேஷம் · Mini Hall Catering</p>
        <h2 className="title">
          How many <span className="fire">people</span> are coming?
        </h2>
        <p className="lead">Tell us the guest count. We'll work out how many padis you need, the way our catering masters do.</p>

        <div className="calc">
          <label className="range">
            <span>
              Guests <b>{guests}</b>
            </span>
            <input type="range" min={9} max={1000} step={1} value={guests} onChange={(e) => setGuests(+e.target.value)} />
          </label>
          <div className="seg">
            {['chicken', 'mutton'].map((m) => (
              <button key={m} className={meat === m ? 'on' : ''} onClick={() => setMeat(m)}>
                {m === 'chicken' ? 'சிக்கன் · Chicken' : 'மட்டன் · Mutton'}
              </button>
            ))}
          </div>
          <div className="seg three">
            {['budget', 'premium', 'luxury'].map((t) => (
              <button key={t} className={tier === t ? 'on' : ''} onClick={() => setTier(t)}>
                {TIER_LABEL[t]}
              </button>
            ))}
          </div>
          <div className="extras">
            {[
              ['chicken-65', 'Chicken 65 (kg)'],
              ['kesari', 'Kesari (kg)'],
            ].map(([id, label]) => (
              <label key={id}>
                {label}
                <span className="stepper">
                  <button onClick={() => setExtras((x) => ({ ...x, [id]: Math.max(0, x[id] - 1) }))}>−</button>
                  <span>{extras[id]}</span>
                  <button onClick={() => setExtras((x) => ({ ...x, [id]: x[id] + 1 }))}>+</button>
                </span>
              </label>
            ))}
          </div>
          <div className="result">
            <div>
              <small>You need</small>
              <b className="big">{padis} Padi</b>
              <small>
                ≈ {padis * 9} servings · {meat === 'chicken' ? `${padis * 10} chicken pieces` : `${(padis * 1.5).toFixed(1)} kg mutton`}
              </small>
            </div>
            <div>
              <small>Estimate</small>
              <b className="big fire">{formatINR(total)}</b>
              <small>≈ {formatINR(Math.round(total / guests))} per guest</small>
            </div>
          </div>
          <div className="row">
            <button
              className="btn btn-fire"
              onClick={() => {
                add(pack.id, padis)
                Object.entries(extras).forEach(([id, q]) => q > 0 && add(id, q))
                setOpen(true)
              }}
            >
              Add to order
            </button>
            <a className="btn btn-whatsapp" href={enquiry} target="_blank" rel="noreferrer">
              Enquire on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

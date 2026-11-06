import { useState } from 'react'
import { CATEGORIES, MENU, formatINR } from '../data/menu'
import { useCart } from '../cart'
import { sceneStore, useScene } from '../store'

function tilt(e) {
  const el = e.currentTarget
  const r = el.getBoundingClientRect()
  const x = (e.clientX - r.left) / r.width - 0.5
  const y = (e.clientY - r.top) / r.height - 0.5
  el.style.setProperty('--rx', `${-y * 14}deg`)
  el.style.setProperty('--ry', `${x * 16}deg`)
  el.style.setProperty('--gx', `${(x + 0.5) * 100}%`)
  el.style.setProperty('--gy', `${(y + 0.5) * 100}%`)
}
function untilt(e) {
  e.currentTarget.style.setProperty('--rx', '0deg')
  e.currentTarget.style.setProperty('--ry', '0deg')
}

function Card({ item }) {
  const { add } = useCart()
  const [qty, setQty] = useState(1)
  const selected = useScene((s) => s.selected === item.id)
  const select = () => sceneStore.set({ selected: item.id })
  return (
    <article
      className={`card reveal ${selected ? 'active' : ''} tier-${(item.tier || 'x').toLowerCase()}`}
      onMouseMove={tilt}
      onMouseLeave={untilt}
      onMouseEnter={select}
      onFocus={select}
      onClick={select}
      tabIndex={0}
    >
      <div className="card-shine" />
      <div className="card-top">
        {item.tier ? <span className="tier">{item.tier} Pack</span> : <span className="tier">{item.unit === 'Litre' ? 'Per Litre' : 'Per kg'}</span>}
        {selected && <span className="live">● On the counter</span>}
      </div>
      <h3 className="ta">{item.ta}</h3>
      <p className="en">{item.name}</p>
      {item.rice && <p className="rice">{item.rice} rice</p>}
      <ul>
        <li>{item.serves}</li>
        {item.details.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
      <div className="card-bottom">
        <div className="price">
          {formatINR(item.price)}
          <small>/ {item.unit}</small>
        </div>
        <div className="stepper" onClick={(e) => e.stopPropagation()}>
          <button aria-label="less" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span>{qty}</span>
          <button aria-label="more" onClick={() => setQty((q) => q + 1)}>+</button>
        </div>
      </div>
      <button
        className="btn btn-fire full"
        onClick={(e) => {
          e.stopPropagation()
          add(item.id, qty)
          setQty(1)
        }}
      >
        Add to order · {formatINR(item.price * qty)}
      </button>
    </article>
  )
}

export default function Catalog() {
  const [cat, setCat] = useState('chicken')
  const items = MENU.filter((m) => m.cat === cat)
  return (
    <section id="menu" className="section catalog" data-station="3">
      <div className="catalog-stage" aria-hidden="true">
        <p className="stage-hint">Our server shows you each dish live. Hover a card or tap it.</p>
      </div>
      <div className="catalog-panel">
        <p className="eyebrow">எங்க மெனு · The Kudil Menu</p>
        <h2 className="title">
          Pick your <span className="fire">padi</span>.
        </h2>
        <p className="lead">Every biryani pack is 1 Padi, about 9 full servings, with thalcha and onion raitha. Halal, cooked fresh to order.</p>
        <div className="tabs" role="tablist">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={cat === c.id}
              className={cat === c.id ? 'on' : ''}
              onClick={() => {
                setCat(c.id)
                const first = MENU.find((m) => m.cat === c.id)
                sceneStore.set({ selected: first.id })
              }}
            >
              <span className="ta">{c.ta}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
        <div className="grid" key={cat}>
          {items.map((it) => (
            <Card key={it.id} item={it} />
          ))}
        </div>
      </div>
    </section>
  )
}

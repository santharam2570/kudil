import { useEffect, useState } from 'react'
import { useCart, whatsappLink } from '../cart'
import { BRAND, formatINR } from '../data/menu'

export function CartDrawer() {
  const { lines, total, open, setOpen, setQty, clear } = useCart()
  const [info, setInfo] = useState({ name: '', phone: '', date: '', address: '', note: '' })
  const set = (k) => (e) => setInfo((i) => ({ ...i, [k]: e.target.value }))

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setOpen])

  return (
    <>
      <div className={`scrim ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
        <header>
          <div>
            <p className="eyebrow">உங்க ஆர்டர்</p>
            <h3>Your Order</h3>
          </div>
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close">✕</button>
        </header>
        {lines.length === 0 ? (
          <div className="empty">
            <img src="/kudil-logo.jpg" alt="" />
            <p>Your leaf is empty. Add some biryani!</p>
            <a className="btn btn-fire" href="#menu" onClick={() => setOpen(false)}>Browse the menu</a>
          </div>
        ) : (
          <>
            <ul className="lines">
              {lines.map(({ item, qty }) => (
                <li key={item.id}>
                  <div>
                    <b className="ta">{item.ta}</b>
                    <small>{item.name}</small>
                    <small>
                      {formatINR(item.price)} / {item.unit}
                    </small>
                  </div>
                  <div className="stepper">
                    <button onClick={() => setQty(item.id, qty - 1)}>−</button>
                    <span>{qty}</span>
                    <button onClick={() => setQty(item.id, qty + 1)}>+</button>
                  </div>
                  <b className="line-total">{formatINR(item.price * qty)}</b>
                </li>
              ))}
            </ul>
            <div className="total">
              <span>Total</span>
              <b>{formatINR(total)}</b>
            </div>
            <form className="order-form" onSubmit={(e) => e.preventDefault()}>
              <input placeholder="Your name" value={info.name} onChange={set('name')} />
              <input placeholder="Phone" inputMode="tel" value={info.phone} onChange={set('phone')} />
              <input type="date" value={info.date} onChange={set('date')} />
              <input placeholder="Delivery address / Venue" value={info.address} onChange={set('address')} />
              <textarea placeholder="Anything else? (spice level, timing…)" rows={2} value={info.note} onChange={set('note')} />
            </form>
            <a className="btn btn-whatsapp full" href={whatsappLink(lines, total, info)} target="_blank" rel="noreferrer">
              Order on WhatsApp
            </a>
            <div className="drawer-row">
              <a className="btn btn-ghost" href={`tel:+${BRAND.phoneIntl}`}>Call {BRAND.phone}</a>
              <button className="btn btn-ghost" onClick={clear}>Clear</button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}

export function Toast() {
  const { toast, setOpen } = useCart()
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (!toast) return
    setShow(true)
    const t = setTimeout(() => setShow(false), 2200)
    return () => clearTimeout(t)
  }, [toast])
  return (
    <button className={`toast ${show ? 'show' : ''}`} onClick={() => setOpen(true)}>
      <span className="toast-dot" /> {toast?.text} · <u>View order</u>
    </button>
  )
}

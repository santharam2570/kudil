import { DIWALI, DIWALI_MENU, formatINR } from '../data/menu'
import { useCart } from '../cart'

function OfferCard({ item, k }) {
  const { add } = useCart()
  return (
    <article className={`offer-card ${item.kind} reveal`} style={{ '--d': `${k * 80}ms` }}>
      <h3>
        <span className="ta">{item.ta}</span>
        <small>{item.name.replace('Diwali ', '')}</small>
      </h3>
      <div className="offer-price">
        {formatINR(item.price)}
        <small>/ {item.unit}</small>
      </div>
      <p className="offer-serves">{item.serves}</p>
      <ul>
        {item.details.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
      <button className="btn btn-fire full" onClick={() => add(item.id, 1)}>
        Pre-order · {formatINR(item.price)}
      </button>
    </article>
  )
}

export default function DiwaliOffer() {
  const combos = DIWALI_MENU.filter((m) => m.kind === 'combo')
  const buckets = DIWALI_MENU.filter((m) => m.kind === 'bucket')
  return (
    <section id="diwali" className="section offer">
      <div className="panel offer-panel">
        <div className="diyas" aria-hidden="true">
          <i />
          <i />
        </div>
        <header className="offer-head reveal">
          <p className="eyebrow">{DIWALI.ta}</p>
          <h2 className="title">
            Diwali Special <span className="fire">Pre-Order</span> Offer
          </h2>
          <p className="lead">Celebrate with family. Biryani combos and buckets, available only on pre-order.</p>
        </header>

        <div className="offer-grid combos">
          {combos.map((it, k) => (
            <OfferCard key={it.id} item={it} k={k} />
          ))}
        </div>
        <div className="offer-grid buckets">
          {buckets.map((it, k) => (
            <OfferCard key={it.id} item={it} k={k} />
          ))}
        </div>

        <div className="offer-note reveal">
          <b className="pill">Pre-orders only</b>
          <p>
            Book before <b>{DIWALI.bookBy}</b> and make full payment to receive <b className="double">Double</b> the Bread Halwa listed on the menu.
          </p>
        </div>

        <div className="offer-dates reveal">
          <small>Offer Dates</small>
          <div>
            {DIWALI.dates.map(([d, day]) => (
              <span key={d}>
                <b>{d}</b> {day}
              </span>
            ))}
          </div>
        </div>

        <a className="offer-call reveal" href={`tel:+${DIWALI.phoneIntl}`}>
          <span className="offer-call-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" />
            </svg>
          </span>
          <span>
            Call <b>{DIWALI.phone}</b>
            <small>for bookings</small>
          </span>
        </a>
      </div>
    </section>
  )
}

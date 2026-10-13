import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { MENU, BRAND, formatINR } from './data/menu'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('kudil-cart')) || {}
    } catch {
      return {}
    }
  })
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => localStorage.setItem('kudil-cart', JSON.stringify(items)), [items])

  const api = useMemo(() => {
    const lines = Object.entries(items)
      .map(([id, qty]) => ({ item: MENU.find((m) => m.id === id), qty }))
      .filter((l) => l.item && l.qty > 0)
    const total = lines.reduce((s, l) => s + l.item.price * l.qty, 0)
    const count = lines.reduce((s, l) => s + l.qty, 0)
    return {
      items,
      lines,
      total,
      count,
      open,
      setOpen,
      toast,
      add: (id, qty = 1) => {
        setItems((c) => ({ ...c, [id]: (c[id] || 0) + qty }))
        const it = MENU.find((m) => m.id === id)
        setToast({ key: Date.now(), text: `${it.ta} × ${qty} added` })
      },
      setQty: (id, qty) =>
        setItems((c) => {
          const n = { ...c }
          if (qty <= 0) delete n[id]
          else n[id] = qty
          return n
        }),
      clear: () => setItems({}),
    }
  }, [items, open, toast])

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)

export function whatsappLink(lines, total, info = {}) {
  const rows = lines.map((l) => `• ${l.item.name} (${l.item.ta}) × ${l.qty} ${l.item.unit} = ${formatINR(l.item.price * l.qty)}`)
  const msg = [
    'வணக்கம் Kudil Biryani!',
    'I would like to order:',
    ...rows,
    `Total: ${formatINR(total)}`,
    '',
    info.name && `Name: ${info.name}`,
    info.phone && `Phone: ${info.phone}`,
    info.date && `Date: ${info.date}`,
    info.address && `Address / Venue: ${info.address}`,
    info.note && `Note: ${info.note}`,
  ]
    .filter((x) => x !== undefined && x !== false && x !== null)
    .join('\n')
  return `https://wa.me/${BRAND.phoneIntl}?text=${encodeURIComponent(msg)}`
}

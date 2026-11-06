import { useSyncExternalStore } from 'react'

function createStore(initial) {
  let state = initial
  const listeners = new Set()
  return {
    get: () => state,
    set: (patch) => {
      const next = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) }
      if (Object.keys(next).every((k) => next[k] === state[k])) return
      state = next
      listeners.forEach((l) => l())
    },
    subscribe: (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
  }
}

// `station` is the section currently in view, `selected` is the dish the server presents.
export const sceneStore = createStore({ station: 0, selected: 'chicken-premium', mobile: false })

export function useScene(selector) {
  return useSyncExternalStore(sceneStore.subscribe, () => selector(sceneStore.get()))
}

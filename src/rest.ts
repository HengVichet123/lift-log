import { useSyncExternalStore } from 'react'

/** Rest timer shared by the whole app; kept in storage so a reload does not lose it. */
interface RestState {
  endsAt: number | null
  total: number
}

const KEY = 'lift-log:rest'
const DEFAULT_KEY = 'lift-log:rest-default'
let state: RestState = load()
const listeners = new Set<() => void>()

function load(): RestState {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (s && typeof s.total === 'number') return s
  } catch {
    // ignore
  }
  return { endsAt: null, total: 0 }
}

function set(next: RestState) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
  listeners.forEach((l) => l())
}

export function defaultRest(): number {
  try {
    return Number(localStorage.getItem(DEFAULT_KEY)) || 90
  } catch {
    return 90
  }
}

export const rest = {
  start(sec = defaultRest()) {
    set({ endsAt: Date.now() + sec * 1000, total: sec })
  },
  add(sec: number) {
    if (!state.endsAt) return
    const endsAt = Math.max(Date.now(), state.endsAt + sec * 1000)
    const total = Math.max(15, state.total + sec)
    set({ endsAt, total })
    try {
      localStorage.setItem(DEFAULT_KEY, String(total)) // the next rest starts from this length
    } catch {
      // ignore
    }
  },
  stop() {
    set({ endsAt: null, total: 0 })
  },
}

export function useRest(): RestState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

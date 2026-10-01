import { useEffect, useState } from 'react'

/** Where a picked exercise goes: a routine or one workout. */
export type PickTarget = { kind: 'type'; id: string } | { kind: 'session'; id: number }

export type Route =
  | { name: 'workout' }
  | { name: 'active'; sessionId: number }
  | { name: 'summary'; sessionId: number }
  | { name: 'history'; day?: string }
  | { name: 'progress'; typeId?: string }
  | { name: 'exercise'; id: string }
  | { name: 'routine'; typeId: string }
  | { name: 'pick'; target: PickTarget }

function parse(hash: string): Route {
  const [, a, b, c] = hash.replace(/^#/, '').split('/').map(decodeURIComponent)
  switch (a) {
    case 'w': return b ? { name: 'active', sessionId: Number(b) } : { name: 'workout' }
    case 's': return b ? { name: 'summary', sessionId: Number(b) } : { name: 'history' }
    case 'history': return { name: 'history', day: b || undefined }
    case 'progress': return { name: 'progress', typeId: b || undefined }
    case 'ex': return b ? { name: 'exercise', id: b } : { name: 'progress' }
    case 'routine': return b ? { name: 'routine', typeId: b } : { name: 'workout' }
    case 'pick':
      if (b === 'type' && c) return { name: 'pick', target: { kind: 'type', id: c } }
      if (b === 'session' && c) return { name: 'pick', target: { kind: 'session', id: Number(c) } }
      return { name: 'workout' }
    default: return { name: 'workout' }
  }
}

const enc = encodeURIComponent

export function href(r: Route): string {
  switch (r.name) {
    case 'workout': return '#/'
    case 'active': return `#/w/${r.sessionId}`
    case 'summary': return `#/s/${r.sessionId}`
    case 'history': return r.day ? `#/history/${r.day}` : '#/history'
    case 'progress': return r.typeId ? `#/progress/${enc(r.typeId)}` : '#/progress'
    case 'exercise': return `#/ex/${enc(r.id)}`
    case 'routine': return `#/routine/${enc(r.typeId)}`
    case 'pick': return `#/pick/${r.target.kind}/${enc(String(r.target.id))}`
  }
}

export function go(r: Route, replace = false) {
  if (replace) location.replace(href(r))
  else location.hash = href(r)
}

export function back(fallback: Route) {
  if (history.length > 1) history.back()
  else go(fallback, true)
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(location.hash))
  useEffect(() => {
    const on = () => {
      setRoute(parse(location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

/** Re-render every `ms` (for clocks). */
export function useTick(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}

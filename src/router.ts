import { useEffect, useState } from 'react'

/** Where a picked exercise goes: a program day or one workout. */
export type PickTarget = { kind: 'type'; id: string } | { kind: 'session'; id: number }

export type Route =
  | { name: 'home' }
  | { name: 'day'; sessionId: number }
  | { name: 'data'; typeId?: string }
  | { name: 'exercise'; id: string }
  | { name: 'program' }
  | { name: 'programDay'; typeId: string }
  | { name: 'pick'; target: PickTarget }

function parse(hash: string): Route {
  const [, a, b, c] = hash.replace(/^#/, '').split('/').map(decodeURIComponent)
  switch (a) {
    case 'day': return b ? { name: 'day', sessionId: Number(b) } : { name: 'home' }
    case 'data': return { name: 'data', typeId: b || undefined }
    case 'ex': return b ? { name: 'exercise', id: b } : { name: 'data' }
    case 'program': return b ? { name: 'programDay', typeId: b } : { name: 'program' }
    case 'pick':
      if (b === 'type' && c) return { name: 'pick', target: { kind: 'type', id: c } }
      if (b === 'session' && c) return { name: 'pick', target: { kind: 'session', id: Number(c) } }
      return { name: 'home' }
    default: return { name: 'home' }
  }
}

const enc = encodeURIComponent

export function href(r: Route): string {
  switch (r.name) {
    case 'home': return '#/'
    case 'day': return `#/day/${r.sessionId}`
    case 'data': return r.typeId ? `#/data/${enc(r.typeId)}` : '#/data'
    case 'exercise': return `#/ex/${enc(r.id)}`
    case 'program': return '#/program'
    case 'programDay': return `#/program/${enc(r.typeId)}`
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

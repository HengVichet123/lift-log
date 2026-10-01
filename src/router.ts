import { useEffect, useState } from 'react'

export type Route =
  | { name: 'today' }
  | { name: 'pick' }
  | { name: 'log'; id: string }
  | { name: 'history' }
  | { name: 'progress' }
  | { name: 'progressDetail'; id: string }

function parse(hash: string): Route {
  const [, a, b] = hash.replace(/^#/, '').split('/')
  if (a === 'pick') return { name: 'pick' }
  if (a === 'log' && b) return { name: 'log', id: decodeURIComponent(b) }
  if (a === 'history') return { name: 'history' }
  if (a === 'progress' && b) return { name: 'progressDetail', id: decodeURIComponent(b) }
  if (a === 'progress') return { name: 'progress' }
  return { name: 'today' }
}

export function href(r: Route): string {
  switch (r.name) {
    case 'today': return '#/'
    case 'pick': return '#/pick'
    case 'log': return `#/log/${encodeURIComponent(r.id)}`
    case 'history': return '#/history'
    case 'progress': return '#/progress'
    case 'progressDetail': return `#/progress/${encodeURIComponent(r.id)}`
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

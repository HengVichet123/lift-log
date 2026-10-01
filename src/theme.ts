export type Theme = 'dark' | 'light'
const KEY = 'lift-log:theme'

export function getTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function applyTheme(t: Theme) {
  document.documentElement.dataset.theme = t
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#0f1214' : '#f2f4f5')
  try {
    localStorage.setItem(KEY, t)
  } catch {
    // not saved; applies for this visit
  }
}

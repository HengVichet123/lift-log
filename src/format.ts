import type { SetEntry } from './db'

export function fmtKg(w: number): string {
  return Number.isInteger(w) ? String(w) : String(Math.round(w * 100) / 100)
}

export function fmtReps(s: SetEntry): string {
  let t = s.rTo && s.rTo > s.r ? `${fmtKg(s.r)}-${fmtKg(s.rTo)}` : fmtKg(s.r)
  if (s.assist) t += ` +${s.assist}`
  return t
}

export function fmtSet(s: SetEntry, bw: string): string {
  return `${s.w > 0 ? fmtKg(s.w) : bw} × ${fmtReps(s)}`
}

/** Consecutive sets at the same weight become one line: "69 × 13-14, 11-12". */
export function groupSets(sets: SetEntry[]): { w: number; warmup: boolean; reps: string[] }[] {
  const out: { w: number; warmup: boolean; reps: string[] }[] = []
  for (const s of sets) {
    const last = out[out.length - 1]
    if (last && last.w === s.w && last.warmup === !!s.warmup) last.reps.push(fmtReps(s))
    else out.push({ w: s.w, warmup: !!s.warmup, reps: [fmtReps(s)] })
  }
  return out
}

/** Epley estimate of the one-rep max. */
export function est1rm(s: SetEntry): number {
  return s.r <= 1 ? s.w : s.w * (1 + s.r / 30)
}

export function volume(sets: SetEntry[]): number {
  return sets.reduce((v, s) => v + s.w * s.r, 0)
}

/** Heaviest set; ties broken by reps. */
export function topSet(sets: SetEntry[]): SetEntry | undefined {
  let best: SetEntry | undefined
  for (const s of sets) if (!best || isBetter(s, best)) best = s
  return best
}

export function isBetter(a: SetEntry, b: SetEntry): boolean {
  return a.w > b.w || (a.w === b.w && a.r > b.r)
}

export function fmtDuration(ms: number): string {
  const m = Math.max(0, Math.round(ms / 60000))
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`
}

export function fmtClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const mm = String(Math.floor((s % 3600) / 60)).padStart(h ? 2 : 1, '0')
  const ss = String(s % 60).padStart(2, '0')
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export function fmtVolume(v: number): string {
  return Math.round(v).toLocaleString('en-US')
}

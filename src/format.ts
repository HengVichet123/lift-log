import type { SetEntry } from './db'

export function fmtKg(w: number): string {
  return Number.isInteger(w) ? String(w) : String(Math.round(w * 100) / 100)
}

export function fmtReps(s: SetEntry): string {
  let t = s.rTo && s.rTo > s.r ? `${fmtKg(s.r)}-${fmtKg(s.rTo)}` : fmtKg(s.r)
  if (s.assist) t += ` +${s.assist}`
  return t
}

/** Consecutive sets at the same weight become one line: "69 × 13-14, 11-12". */
export function groupSets(sets: SetEntry[]): { w: number; reps: string[] }[] {
  const out: { w: number; reps: string[] }[] = []
  for (const s of sets) {
    const last = out[out.length - 1]
    if (last && last.w === s.w) last.reps.push(fmtReps(s))
    else out.push({ w: s.w, reps: [fmtReps(s)] })
  }
  return out
}

/** Heaviest set; ties broken by reps. For bodyweight work, most reps. */
export function topSet(sets: SetEntry[]): SetEntry | undefined {
  let best: SetEntry | undefined
  for (const s of sets) {
    if (!best || s.w > best.w || (s.w === best.w && s.r > best.r)) best = s
  }
  return best
}

export function isBetter(a: SetEntry, b: SetEntry): boolean {
  return a.w > b.w || (a.w === b.w && a.r > b.r)
}

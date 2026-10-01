import type { WorkoutSet } from './db'

/** True when the set should be judged by reps (no added weight). */
export function byReps(sets: WorkoutSet[]): boolean {
  return sets.every((s) => s.weight === 0)
}

/** Heaviest set; for bodyweight work, the set with most reps. */
export function bestSet(sets: WorkoutSet[]): WorkoutSet | undefined {
  const reps = byReps(sets)
  let best: WorkoutSet | undefined
  for (const s of sets) {
    if (!best) best = s
    else if (reps ? s.reps > best.reps : s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps)) best = s
  }
  return best
}

export function metric(s: WorkoutSet, reps: boolean): number {
  return reps ? s.reps : s.weight
}

export function groupByDay(sets: WorkoutSet[]): Map<string, WorkoutSet[]> {
  const m = new Map<string, WorkoutSet[]>()
  for (const s of sets) {
    const list = m.get(s.day)
    if (list) list.push(s)
    else m.set(s.day, [s])
  }
  return m
}

export function fmtWeight(w: number): string {
  return Number.isInteger(w) ? String(w) : w.toFixed(1).replace(/\.0$/, '')
}

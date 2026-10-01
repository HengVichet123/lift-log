import type { WorkoutSet } from '../db'

/** [exerciseId, sets] in the order each exercise was first done. */
export function groupByExercise(sets: WorkoutSet[]): [string, WorkoutSet[]][] {
  const m = new Map<string, WorkoutSet[]>()
  for (const s of [...sets].sort((a, b) => a.ts - b.ts)) {
    const list = m.get(s.exerciseId)
    if (list) list.push(s)
    else m.set(s.exerciseId, [s])
  }
  return [...m.entries()]
}

import Dexie, { type EntityTable } from 'dexie'

export interface WorkoutSet {
  id?: number
  exerciseId: string
  /** local calendar day, YYYY-MM-DD */
  day: string
  ts: number
  /** kg; 0 means bodyweight */
  weight: number
  reps: number
}

export const db = new Dexie('lift-log') as Dexie & {
  sets: EntityTable<WorkoutSet, 'id'>
}

db.version(1).stores({
  sets: '++id, exerciseId, day, ts, [exerciseId+day]',
})

export function dayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseDay(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

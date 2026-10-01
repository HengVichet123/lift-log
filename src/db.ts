import Dexie, { type EntityTable } from 'dexie'
import type { Group } from './exercises'

/** One set: kg × reps. Optional rep range upper bound and assisted reps. */
export interface SetEntry {
  w: number
  r: number
  rTo?: number
  assist?: number
}

/** A day in the program (Push, Pull, Legs ...): the rows of the grid. */
export interface DayType {
  id: string
  name: string
  order: number
  exerciseIds: string[]
}

/** An exercise the user typed in that is not in the photo library. */
export interface CustomExercise {
  id: string
  name: string
  group: Group
}

/** A workout on a date. */
export interface Session {
  id?: number
  date: string
  dayTypeId: string
  createdAt: number
  /** made by "Load sample data", so it can be removed again */
  sample?: boolean
}

/** What was done for one exercise in one workout. */
export interface Entry {
  id?: number
  sessionId: number
  date: string
  exerciseId: string
  order: number
  sets: SetEntry[]
  note: string
}

export const db = new Dexie('lift-log') as Dexie & {
  dayTypes: EntityTable<DayType, 'id'>
  customExercises: EntityTable<CustomExercise, 'id'>
  sessions: EntityTable<Session, 'id'>
  entries: EntityTable<Entry, 'id'>
}

db.version(1).stores({ sets: '++id, exerciseId, day, ts, [exerciseId+day]' })
db.version(2).stores({
  sets: null,
  dayTypes: 'id, order',
  customExercises: 'id',
  sessions: '++id, date, dayTypeId, [dayTypeId+date]',
  entries: '++id, sessionId, exerciseId, date, [exerciseId+date]',
})

export function newId(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

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

export function daysBetween(a: string, b: string): number {
  return Math.round((parseDay(b).getTime() - parseDay(a).getTime()) / 86_400_000)
}

/** Sets that count: reps filled in. */
export function doneSets(e: Entry): SetEntry[] {
  return e.sets.filter((s) => s.r > 0)
}

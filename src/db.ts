import Dexie, { type EntityTable } from 'dexie'
import type { Group } from './exercises'

/** One set: kg × reps. */
export interface SetEntry {
  w: number
  r: number
  /** upper end of a rep range, e.g. 13-14 */
  rTo?: number
  /** reps done with a partner's help */
  assist?: number
  warmup?: boolean
  /** ticked off during the workout; only done sets are kept */
  done?: boolean
}

/** A routine (Push, Pull, Legs ...). */
export interface DayType {
  id: string
  name: string
  order: number
  exerciseIds: string[]
}

export interface CustomExercise {
  id: string
  name: string
  group: Group
}

export interface Session {
  id?: number
  date: string
  dayTypeId: string
  createdAt: number
  startedAt: number
  /** unset while the workout is still running */
  finishedAt?: number
  sample?: boolean
}

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
db.version(3)
  .stores({
    dayTypes: 'id, order',
    customExercises: 'id',
    sessions: '++id, date, dayTypeId, finishedAt, [dayTypeId+date]',
    entries: '++id, sessionId, exerciseId, date, [exerciseId+date]',
  })
  .upgrade(async (tx) => {
    // v2 workouts had no timer or ticks: treat them as finished, one hour long
    await tx.table('sessions').toCollection().modify((s: Session) => {
      s.startedAt ??= s.createdAt
      s.finishedAt ??= s.createdAt + 3_600_000
    })
    await tx.table('entries').toCollection().modify((e: Entry) => {
      e.sets = e.sets.filter((x) => x.r > 0).map((x) => ({ ...x, done: true }))
    })
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

/** Sets that count: any set with reps filled in. */
export function doneSets(e: Entry): SetEntry[] {
  return e.sets.filter((s) => s.r > 0)
}

/** Done sets without warm-ups: what records and charts use. */
export function workSets(e: Entry): SetEntry[] {
  return doneSets(e).filter((s) => !s.warmup)
}

/** All logged workouts, oldest first. */
export async function finishedSessions(): Promise<Session[]> {
  return db.sessions.orderBy('date').toArray()
}

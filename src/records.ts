import { db, workSets, type Entry, type SetEntry } from './db'
import { est1rm, isBetter } from './format'

export type RecordKind = 'heaviest' | 'e1rm' | 'setVolume'

export interface Records {
  heaviest?: { set: SetEntry; date: string }
  e1rm?: { value: number; set: SetEntry; date: string }
  setVolume?: { value: number; set: SetEntry; date: string }
}

/** Best values over the given workouts of one exercise. */
export function recordsOf(entries: Entry[]): Records {
  const r: Records = {}
  for (const e of entries) {
    for (const s of workSets(e)) {
      if (s.w <= 0) continue
      if (!r.heaviest || isBetter(s, r.heaviest.set)) r.heaviest = { set: s, date: e.date }
      const one = est1rm(s)
      if (!r.e1rm || one > r.e1rm.value) r.e1rm = { value: one, set: s, date: e.date }
      const v = s.w * s.r
      if (!r.setVolume || v > r.setVolume.value) r.setVolume = { value: v, set: s, date: e.date }
    }
  }
  return r
}

function earlier(a: Entry, b: Entry): boolean {
  return a.date < b.date || (a.date === b.date && a.sessionId < b.sessionId)
}

/** Records this workout set for the first time, per exercise. */
export async function sessionRecords(sessionId: number): Promise<{ exerciseId: string; kinds: RecordKind[] }[]> {
  const entries = await db.entries.where('sessionId').equals(sessionId).toArray()
  const out: { exerciseId: string; kinds: RecordKind[] }[] = []
  for (const e of entries) {
    const all = await db.entries.where('exerciseId').equals(e.exerciseId).toArray()
    const before = all.filter((x) => earlier(x, e) && x.sessionId !== sessionId)
    if (before.every((x) => workSets(x).length === 0)) continue // first time is not a record
    const old = recordsOf(before)
    const now = recordsOf([e])
    const kinds: RecordKind[] = []
    if (now.heaviest && (!old.heaviest || now.heaviest.set.w > old.heaviest.set.w)) kinds.push('heaviest')
    if (now.e1rm && (!old.e1rm || now.e1rm.value > old.e1rm.value + 0.01)) kinds.push('e1rm')
    if (now.setVolume && (!old.setVolume || now.setVolume.value > old.setVolume.value)) kinds.push('setVolume')
    if (kinds.length) out.push({ exerciseId: e.exerciseId, kinds })
  }
  return out
}

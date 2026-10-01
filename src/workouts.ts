import { db, doneSets, parseDay, type SetEntry } from './db'
import { go } from './router'

/** Empty rows for an exercise, shaped like last time (same number of sets and warm-ups). */
async function suggestedRows(exerciseId: string, date: string, sessionId?: number): Promise<SetEntry[]> {
  const prev = (await db.entries.where('[exerciseId+date]').between([exerciseId, ''], [exerciseId, date], true, true).reverse().toArray()).find(
    (e) => e.sessionId !== sessionId && doneSets(e).length > 0,
  )
  if (!prev) return [{ w: 0, r: 0 }, { w: 0, r: 0 }, { w: 0, r: 0 }]
  return doneSets(prev).map((s) => ({ w: 0, r: 0, warmup: s.warmup }))
}

/** Start filling in a routine on a day: every exercise of the routine, with suggested rows. */
export async function logForDay(day: string, dayTypeId: string) {
  const type = await db.dayTypes.get(dayTypeId)
  const start = parseDay(day)
  start.setHours(18, 0, 0, 0)
  const startedAt = start.getTime()
  const sessionId = (await db.sessions.add({ date: day, dayTypeId, createdAt: Date.now(), startedAt, finishedAt: startedAt + 3_600_000 })) as number
  for (const [order, exerciseId] of (type?.exerciseIds ?? []).entries()) {
    await db.entries.add({ sessionId, date: day, exerciseId, order, sets: await suggestedRows(exerciseId, day, sessionId), note: '' })
  }
  go({ name: 'active', sessionId })
}

/** Open a saved workout for editing with the same suggestions as the first time:
 *  routine exercises that were skipped come back as empty rows (dropped again on Done). */
export async function editWorkout(sessionId: number) {
  const s = await db.sessions.get(sessionId)
  if (!s) return
  const type = await db.dayTypes.get(s.dayTypeId)
  const entries = await db.entries.where('sessionId').equals(sessionId).toArray()
  const have = new Set(entries.map((e) => e.exerciseId))
  for (const [order, exerciseId] of (type?.exerciseIds ?? []).entries()) {
    if (have.has(exerciseId)) continue
    await db.entries.add({ sessionId, date: s.date, exerciseId, order: order - 0.5, sets: await suggestedRows(exerciseId, s.date, sessionId), note: '' })
  }
  go({ name: 'active', sessionId })
}

export async function deleteSession(id: number) {
  await db.transaction('rw', db.entries, db.sessions, async () => {
    await db.entries.where('sessionId').equals(id).delete()
    await db.sessions.delete(id)
  })
}

import { db, dayKey, type SetEntry } from './db'

interface Plan {
  id: string
  start: number
  step: number
  every: number
  reps: [number, number, number]
  range?: boolean
  assist?: boolean
}

// starting kg, kg added every `every` workouts, and a typical 3-set rep pattern
const PLANS: Record<string, Plan[]> = {
  push: [
    { id: 'Barbell_Bench_Press_-_Medium_Grip', start: 55, step: 2.5, every: 2, reps: [8, 7, 6] },
    { id: 'Incline_Dumbbell_Press', start: 18, step: 2, every: 3, reps: [10, 9, 8] },
    { id: 'Dumbbell_Shoulder_Press', start: 14, step: 2, every: 4, reps: [10, 8, 8], range: true },
    { id: 'Side_Lateral_Raise', start: 6, step: 1, every: 5, reps: [15, 12, 12] },
    { id: 'Triceps_Pushdown', start: 25, step: 2.5, every: 3, reps: [12, 10, 10] },
  ],
  pull: [
    { id: 'Wide-Grip_Lat_Pulldown', start: 35, step: 2.5, every: 2, reps: [12, 12, 10] },
    { id: 'Seated_Cable_Rows', start: 60, step: 2.5, every: 2, reps: [10, 9, 8], range: true },
    { id: 'Dumbbell_Bicep_Curl', start: 10, step: 1, every: 4, reps: [9, 8, 8], range: true },
    { id: 'Preacher_Curl', start: 25, step: 2.5, every: 3, reps: [12, 10, 9], assist: true },
    { id: 'Seated_Bent-Over_Rear_Delt_Raise', start: 4, step: 1, every: 5, reps: [15, 15, 15] },
  ],
  legs: [
    { id: 'Barbell_Squat', start: 70, step: 2.5, every: 1, reps: [6, 5, 5] },
    { id: 'Leg_Press', start: 120, step: 10, every: 2, reps: [12, 10, 10] },
    { id: 'Romanian_Deadlift', start: 50, step: 5, every: 3, reps: [10, 8, 8] },
    { id: 'Lying_Leg_Curls', start: 30, step: 2.5, every: 3, reps: [12, 10, 10] },
    { id: 'Standing_Calf_Raises', start: 40, step: 5, every: 3, reps: [15, 12, 12] },
  ],
}

const NOTES = ['felt strong', 'bad shoulder today', 'failed the last rep', 'short rest, 90 s', 'slept badly']

/** Deterministic pseudo-random so the sample looks the same each time. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

export async function loadSample() {
  const rand = rng(7)
  const order = ['push', 'pull', 'legs']
  const today = new Date()
  const count: Record<string, number> = { push: 0, pull: 0, legs: 0 }

  await db.transaction('rw', db.sessions, db.entries, async () => {
    // about 8 weeks, a workout every 2 days, one rest day now and then
    let k = 0
    for (let back = 56; back >= 1; back -= rand() < 0.2 ? 3 : 2) {
      const d = new Date(today)
      d.setDate(d.getDate() - back)
      const date = dayKey(d)
      const type = order[k++ % 3]
      const n = count[type]++
      const sessionId = (await db.sessions.add({ date, dayTypeId: type, createdAt: d.getTime(), sample: true })) as number

      for (const [i, p] of PLANS[type].entries()) {
        const w = p.start + Math.floor(n / p.every) * p.step
        const sets: SetEntry[] = p.reps.map((r, j) => {
          const reps = Math.max(1, r + Math.round((rand() - 0.5) * 2))
          const s: SetEntry = { w, r: reps }
          if (p.range && j > 0 && rand() < 0.5) s.rTo = reps + 1
          if (p.assist && j === 2 && rand() < 0.6) s.assist = 2 + Math.floor(rand() * 3)
          return s
        })
        if (rand() < 0.25) sets.unshift({ w: w + p.step, r: Math.max(1, p.reps[0] - 3) }) // a heavy top set
        const note = rand() < 0.08 ? NOTES[Math.floor(rand() * NOTES.length)] : ''
        await db.entries.add({ sessionId, date, exerciseId: p.id, order: i, sets, note })
      }
    }
  })
}

export async function clearSample() {
  await db.transaction('rw', db.sessions, db.entries, async () => {
    const ids = (await db.sessions.filter((s) => !!s.sample).primaryKeys()) as number[]
    await db.entries.where('sessionId').anyOf(ids).delete()
    await db.sessions.bulkDelete(ids)
  })
}

export async function hasSample(): Promise<boolean> {
  return (await db.sessions.filter((s) => !!s.sample).count()) > 0
}

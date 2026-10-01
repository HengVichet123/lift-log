import { db, type DayType } from './db'

/** First-run program; the Pull day follows a real beginner routine. */
const DEFAULT_PROGRAM: DayType[] = [
  {
    id: 'push',
    name: 'Push',
    order: 0,
    exerciseIds: [
      'Barbell_Bench_Press_-_Medium_Grip',
      'Incline_Dumbbell_Press',
      'Dumbbell_Shoulder_Press',
      'Side_Lateral_Raise',
      'Triceps_Pushdown',
      'Lying_Triceps_Press',
    ],
  },
  {
    id: 'pull',
    name: 'Pull',
    order: 1,
    exerciseIds: [
      'Wide-Grip_Lat_Pulldown',
      'Seated_Cable_Rows',
      'Dumbbell_Bicep_Curl',
      'Preacher_Curl',
      'Incline_Dumbbell_Curl',
      'Seated_Bent-Over_Rear_Delt_Raise',
    ],
  },
  {
    id: 'legs',
    name: 'Legs',
    order: 2,
    exerciseIds: [
      'Barbell_Squat',
      'Leg_Press',
      'Romanian_Deadlift',
      'Lying_Leg_Curls',
      'Leg_Extensions',
      'Standing_Calf_Raises',
    ],
  },
]

export async function seedIfEmpty() {
  await db.transaction('rw', db.dayTypes, db.sessions, async () => {
    if ((await db.dayTypes.count()) === 0) await db.dayTypes.bulkAdd(DEFAULT_PROGRAM)
    // workouts left running by the old "Start" version become normal logged days
    await db.sessions.filter((s) => !s.finishedAt).modify((s) => {
      s.finishedAt = s.startedAt
    })
  })
}

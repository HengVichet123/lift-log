import raw from './data/exercises.json'

export type Group = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core'

export interface Exercise {
  id: string
  name: string
  group: Group
  equipment: string
  frames: number
  starter: boolean
}

export const EXERCISES = raw as Exercise[]
const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]))

export function getExercise(id: string): Exercise | undefined {
  return BY_ID.get(id)
}

export const GROUPS: Group[] = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core']

/** The starter exercise whose photo stands for the whole body part. */
export const GROUP_COVER: Record<Group, string> = {
  chest: 'Barbell_Bench_Press_-_Medium_Grip',
  back: 'Pullups',
  legs: 'Barbell_Squat',
  shoulders: 'Dumbbell_Shoulder_Press',
  arms: 'Barbell_Curl',
  core: 'Crunches',
}

const REMOTE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'

export function photoUrl(ex: Exercise, frame: number): string {
  const f = Math.min(frame, ex.frames - 1)
  return ex.starter ? `./ex/${ex.id}/${f}.webp` : `${REMOTE}${ex.id}/${f}.jpg`
}

export function isBodyweight(ex: Exercise): boolean {
  return ex.equipment === 'body only'
}

export function defaultWeight(ex: Exercise): number {
  if (isBodyweight(ex)) return 0
  if (ex.equipment === 'barbell') return 20
  if (ex.equipment === 'dumbbell' || ex.equipment === 'kettlebells') return 10
  return 20
}

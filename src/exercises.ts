import { useLiveQuery } from 'dexie-react-hooks'
import raw from './data/exercises.json'
import { db } from './db'

export type Group = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core'

export interface Exercise {
  id: string
  name: string
  group: Group
  equipment: string
  /** number of photos; 0 for exercises the user typed in */
  frames: number
  starter: boolean
}

export const CATALOG = raw as Exercise[]
const BY_ID = new Map(CATALOG.map((e) => [e.id, e]))

export const GROUPS: Group[] = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core']

/** The starter exercise whose photo stands for the whole body part. */
export const GROUP_COVER: Record<Group, string> = {
  chest: 'Barbell_Bench_Press_-_Medium_Grip',
  back: 'Wide-Grip_Lat_Pulldown',
  legs: 'Barbell_Squat',
  shoulders: 'Dumbbell_Shoulder_Press',
  arms: 'Preacher_Curl',
  core: 'Crunches',
}

export function catalogExercise(id: string): Exercise | undefined {
  return BY_ID.get(id)
}

/** Catalog plus the user's own exercises, as one lookup. */
export function useExercises(): (id: string) => Exercise | undefined {
  const custom = useLiveQuery(() => db.customExercises.toArray(), [])
  const map = new Map<string, Exercise>()
  for (const c of custom ?? []) map.set(c.id, { id: c.id, name: c.name, group: c.group, equipment: 'other', frames: 0, starter: false })
  return (id) => BY_ID.get(id) ?? map.get(id)
}

const REMOTE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'

export function photoUrl(ex: Exercise, frame: number): string {
  const f = Math.min(frame, ex.frames - 1)
  return ex.starter ? `./ex/${ex.id}/${f}.webp` : `${REMOTE}${ex.id}/${f}.jpg`
}

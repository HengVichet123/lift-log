import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Group } from './exercises'

export type Lang = 'en'

const ordinal = (n: number) => {
  const v = n % 100
  if (v >= 11 && v <= 13) return `${n}th`
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
}

const en = {
  workout: 'Workout',
  history: 'History',
  progress: 'Progress',
  routines: 'Routines',
  start: 'Start',
  newRoutine: 'New routine',
  routineName: 'Routine name',
  lastDone: (n: number) => (n === 0 ? 'Today' : n === 1 ? 'Yesterday' : `${n} days ago`),
  never: 'Not done yet',
  exercisesCount: (n: number) => `${n} exercises`,
  resume: 'Resume',
  inProgress: 'Workout in progress',
  finish: 'Finish',
  cancelWorkout: 'Cancel workout',
  cancelConfirm: 'Cancel this workout? Nothing from it is saved.',
  finishEmptyConfirm: 'No sets are ticked. Discard this workout?',
  setCol: 'Set',
  previousCol: 'Previous',
  kg: 'kg',
  reps: 'reps',
  warmupShort: 'W',
  addSet: 'Add set',
  warmup: 'Warm-up',
  range: 'Rep range',
  assist: 'Assist',
  deleteSet: 'Delete set',
  note: 'Note',
  notePlaceholder: 'e.g. failed at 5, bad shoulder',
  addExercise: 'Add exercise',
  removeExercise: 'Remove exercise',
  options: 'Options',
  rest: 'Rest',
  skip: 'Skip',
  volume: 'Volume',
  setsWord: 'Sets',
  duration: 'Duration',
  complete: 'Workout complete',
  nth: (n: number) => `Your ${ordinal(n)} workout`,
  records: 'Records',
  recordKind: { heaviest: 'Heaviest weight', e1rm: 'Best est. 1RM', setVolume: 'Best set volume', mostReps: 'Most reps' },
  done: 'Done',
  edit: 'Edit',
  bestSet: 'Best set',
  weekdaysShort: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  dateLabel: 'Date',
  prevMonth: 'Previous month',
  nextMonth: 'Next month',
  todayBtn: 'Today',
  noWorkoutDay: 'No workout on this day',
  logForDay: 'Log a workout for this day',
  deleteBtn: 'Delete',
  addAnother: 'Add another workout on this day',
  copyLast: 'Same as last time',
  notFoundWorkout: 'This workout no longer exists. It may have been deleted.',
  notFoundExercise: 'This exercise could not be found.',
  typeRepsFirst: 'Type the reps first, then tick.',
  allTab: 'All',
  emptyHistory: 'No workouts yet',
  emptyHistoryHint: 'Start a routine on the Workout tab',
  weekly: 'Workouts per week',
  exercises: 'Exercises',
  metric: { heaviest: 'Heaviest', e1rm: 'Est. 1RM', volume: 'Volume' },
  needMore: 'Do this exercise on more days to see a line',
  noHistory: 'Not done yet',
  pickExercise: 'Pick exercise',
  search: 'Search',
  moreExercises: 'Show all exercises',
  fewerExercises: 'Show fewer',
  noMatch: 'No exercise found',
  ownExercise: 'Add your own',
  ownName: 'Exercise name',
  create: 'Add',
  rename: 'Rename',
  deleteRoutine: 'Delete routine',
  deleteRoutineConfirm: 'Delete this routine? Past workouts stay in History.',
  remove: 'Remove',
  moveUp: 'Move up',
  moveDown: 'Move down',
  deleteWorkout: 'Delete workout',
  deleteWorkoutConfirm: 'Delete this whole workout?',
  back: 'Back',
  language: 'Language',
  theme: 'Light or dark',
  bw: 'BW',
  firstTime: 'First time',
  sampleTitle: 'Sample data',
  sampleHint: 'Fill the app with 8 weeks of example workouts to see how it looks. Your own workouts are not touched.',
  sampleLoad: 'Load sample data',
  sampleClear: 'Remove sample data',
  groups: {
    chest: 'Chest',
    back: 'Back',
    legs: 'Legs',
    shoulders: 'Shoulders',
    arms: 'Arms',
    core: 'Belly',
  } as Record<Group, string>,
}

type Dict = typeof en

const DICTS: Record<Lang, Dict> = { en }
const KEY = 'lift-log:lang'

function initialLang(): Lang {
  return 'en'
}

export type DateStyle = 'long' | 'medium' | 'short' | 'month'


const EN_FMT: Record<DateStyle, Intl.DateTimeFormat> = {
  long: new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
  medium: new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'long' }),
  short: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }),
  month: new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }),
}

function formatDate(_lang: Lang, d: Date, style: DateStyle): string {
  return EN_FMT[style].format(d)
}

interface Ctx {
  lang: Lang
  t: Dict
  date: (d: Date, style: DateStyle) => string
  setLang: (l: Lang) => void
}

const I18n = createContext<Ctx | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  const setLang = (l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(KEY, l)
    } catch {
      // not saved; the choice still applies for this visit
    }
  }
  return (
    <I18n.Provider value={{ lang, t: DICTS[lang], date: (d, style) => formatDate(lang, d, style), setLang }}>
      {children}
    </I18n.Provider>
  )
}

export function useI18n(): Ctx {
  const c = useContext(I18n)
  if (!c) throw new Error('useI18n outside provider')
  return c
}

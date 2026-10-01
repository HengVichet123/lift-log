import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Group } from './exercises'

export type Lang = 'en' | 'km'

const en = {
  home: 'Home',
  data: 'All data',
  program: 'Program',
  startDay: 'Start a workout',
  lastDone: (n: number) => (n === 0 ? 'Today' : n === 1 ? 'Yesterday' : `${n} days ago`),
  never: 'Not done yet',
  exercisesCount: (n: number) => `${n} exercises`,
  recent: 'Recent workouts',
  finish: 'Finish workout',
  addSet: 'Add set',
  copyLast: 'Same as last time',
  lastTime: 'Last time',
  firstTime: 'First time',
  note: 'Note',
  notePlaceholder: 'e.g. failed at 5, bad shoulder',
  kg: 'kg',
  reps: 'reps',
  repsTo: 'to',
  assist: 'assist',
  more: 'More',
  removeSet: 'Remove set',
  addExercise: 'Add exercise',
  pickExercise: 'Pick exercise',
  search: 'Search',
  moreExercises: 'Show all exercises',
  fewerExercises: 'Show fewer',
  noMatch: 'No exercise found',
  ownExercise: 'Add your own',
  ownName: 'Exercise name',
  ownGroup: 'Body part',
  create: 'Add',
  best: 'Best',
  emptyData: 'No workouts yet',
  emptyDataHint: 'Finish a workout and its numbers show up here',
  noHistory: 'Not done yet',
  workouts: 'Workouts',
  topSetChart: 'Heaviest set each workout',
  needMore: 'Do this exercise on more days to see a line',
  newDay: 'New day',
  dayName: 'Day name',
  rename: 'Rename',
  deleteDay: 'Delete this day',
  deleteDayConfirm: 'Delete this day from your program? Past workouts stay in All data.',
  remove: 'Remove',
  moveUp: 'Move up',
  moveDown: 'Move down',
  deleteWorkout: 'Delete workout',
  deleteWorkoutConfirm: 'Delete this whole workout?',
  date: 'Date',
  back: 'Back',
  language: 'Language',
  all: 'All',
  bw: 'BW',
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

const km: Dict = {
  home: 'ទំព័រដើម',
  data: 'ទិន្នន័យទាំងអស់',
  program: 'កម្មវិធី',
  startDay: 'ចាប់ផ្តើមហាត់',
  lastDone: (n: number) => (n === 0 ? 'ថ្ងៃនេះ' : n === 1 ? 'ម្សិលមិញ' : `${n} ថ្ងៃមុន`),
  never: 'មិនទាន់ធ្វើ',
  exercisesCount: (n: number) => `លំហាត់ ${n}`,
  recent: 'ការហាត់ថ្មីៗ',
  finish: 'បញ្ចប់',
  addSet: 'បន្ថែមឈុត',
  copyLast: 'ដូចលើកមុន',
  lastTime: 'លើកមុន',
  firstTime: 'លើកដំបូង',
  note: 'កំណត់ចំណាំ',
  notePlaceholder: 'ឧ. ធ្វើមិនរួចនៅដងទី 5',
  kg: 'គ.ក',
  reps: 'ដង',
  repsTo: 'ដល់',
  assist: 'ជំនួយ',
  more: 'បន្ថែម',
  removeSet: 'លុបឈុត',
  addExercise: 'បន្ថែមលំហាត់',
  pickExercise: 'ជ្រើសលំហាត់',
  search: 'ស្វែងរក',
  moreExercises: 'បង្ហាញលំហាត់ទាំងអស់',
  fewerExercises: 'បង្ហាញតិចជាងនេះ',
  noMatch: 'រកមិនឃើញលំហាត់',
  ownExercise: 'បន្ថែមលំហាត់ផ្ទាល់ខ្លួន',
  ownName: 'ឈ្មោះលំហាត់',
  ownGroup: 'ផ្នែករាងកាយ',
  create: 'បន្ថែម',
  best: 'ល្អបំផុត',
  emptyData: 'មិនទាន់មានការហាត់',
  emptyDataHint: 'បញ្ចប់ការហាត់ ហើយលេខនឹងបង្ហាញនៅទីនេះ',
  noHistory: 'មិនទាន់ធ្វើ',
  workouts: 'ការហាត់',
  topSetChart: 'ឈុតធ្ងន់បំផុតក្នុងការហាត់នីមួយៗ',
  needMore: 'ហាត់លំហាត់នេះច្រើនថ្ងៃទៀត ដើម្បីឃើញខ្សែ',
  newDay: 'ថ្ងៃថ្មី',
  dayName: 'ឈ្មោះថ្ងៃ',
  rename: 'ប្តូរឈ្មោះ',
  deleteDay: 'លុបថ្ងៃនេះ',
  deleteDayConfirm: 'លុបថ្ងៃនេះពីកម្មវិធី? ការហាត់ចាស់នៅតែមាន។',
  remove: 'ដកចេញ',
  moveUp: 'ឡើងលើ',
  moveDown: 'ចុះក្រោម',
  deleteWorkout: 'លុបការហាត់',
  deleteWorkoutConfirm: 'លុបការហាត់នេះទាំងមូល?',
  date: 'កាលបរិច្ឆេទ',
  back: 'ត្រឡប់',
  language: 'ភាសា',
  all: 'ទាំងអស់',
  bw: 'ខ្លួន',
  groups: {
    chest: 'ទ្រូង',
    back: 'ខ្នង',
    legs: 'ជើង',
    shoulders: 'ស្មា',
    arms: 'ដៃ',
    core: 'ពោះ',
  },
}

const DICTS: Record<Lang, Dict> = { en, km }
const KEY = 'lift-log:lang'

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'en' || saved === 'km') return saved
  } catch {
    // storage blocked: use the default
  }
  return 'en'
}

export type DateStyle = 'long' | 'medium' | 'short'

const KM_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ']
const KM_DAYS = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍']

const EN_FMT: Record<DateStyle, Intl.DateTimeFormat> = {
  long: new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
  medium: new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'long' }),
  short: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }),
}

/** Browsers format km-KH poorly ("M10 2, Fri"), so Khmer dates are built by hand. */
function formatDate(lang: Lang, d: Date, style: DateStyle): string {
  if (lang === 'en') return EN_FMT[style].format(d)
  const dm = `${d.getDate()} ${KM_MONTHS[d.getMonth()]}`
  if (style === 'short') return dm
  return `${style === 'long' ? 'ថ្ងៃ' : ''}${KM_DAYS[d.getDay()]} ${dm}`
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

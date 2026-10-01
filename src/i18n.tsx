import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Group } from './exercises'

export type Lang = 'en' | 'km'

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
  recordKind: { heaviest: 'Heaviest weight', e1rm: 'Best est. 1RM', setVolume: 'Best set volume' },
  done: 'Done',
  edit: 'Edit',
  bestSet: 'Best set',
  weekdaysShort: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  dateLabel: 'Date',
  addPast: 'Add a past workout',
  addPastHint: 'Forgot to log a day? Pick the day on the calendar and fill it in.',
  prevMonth: 'Previous month',
  nextMonth: 'Next month',
  todayBtn: 'Today',
  noWorkoutDay: 'No workout on this day',
  logForDay: 'Log a workout for this day',
  deleteBtn: 'Delete',
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

const km: Dict = {
  workout: 'ហាត់',
  history: 'ប្រវត្តិ',
  progress: 'វឌ្ឍនភាព',
  routines: 'កម្មវិធីហាត់',
  start: 'ចាប់ផ្តើម',
  newRoutine: 'កម្មវិធីថ្មី',
  routineName: 'ឈ្មោះកម្មវិធី',
  lastDone: (n: number) => (n === 0 ? 'ថ្ងៃនេះ' : n === 1 ? 'ម្សិលមិញ' : `${n} ថ្ងៃមុន`),
  never: 'មិនទាន់ធ្វើ',
  exercisesCount: (n: number) => `លំហាត់ ${n}`,
  resume: 'បន្ត',
  inProgress: 'កំពុងហាត់',
  finish: 'បញ្ចប់',
  cancelWorkout: 'បោះបង់ការហាត់',
  cancelConfirm: 'បោះបង់ការហាត់នេះ? គ្មានអ្វីត្រូវបានរក្សាទុកទេ។',
  finishEmptyConfirm: 'មិនទាន់ធីកឈុតណាមួយ។ បោះបង់ការហាត់នេះ?',
  setCol: 'ឈុត',
  previousCol: 'លើកមុន',
  kg: 'គ.ក',
  reps: 'ដង',
  warmupShort: 'W',
  addSet: 'បន្ថែមឈុត',
  warmup: 'កម្តៅខ្លួន',
  range: 'ចន្លោះដង',
  assist: 'ជំនួយ',
  deleteSet: 'លុបឈុត',
  note: 'កំណត់ចំណាំ',
  notePlaceholder: 'ឧ. ធ្វើមិនរួចនៅដងទី 5',
  addExercise: 'បន្ថែមលំហាត់',
  removeExercise: 'ដកលំហាត់ចេញ',
  options: 'ជម្រើស',
  rest: 'សម្រាក',
  skip: 'រំលង',
  volume: 'បរិមាណ',
  setsWord: 'ឈុត',
  duration: 'រយៈពេល',
  complete: 'ហាត់រួចរាល់',
  nth: (n: number) => `ការហាត់លើកទី ${n}`,
  records: 'កំណត់ត្រា',
  recordKind: { heaviest: 'ទម្ងន់ធ្ងន់បំផុត', e1rm: '1RM ប៉ាន់ស្មានល្អបំផុត', setVolume: 'បរិមាណឈុតល្អបំផុត' },
  done: 'រួចរាល់',
  edit: 'កែ',
  bestSet: 'ឈុតល្អបំផុត',
  weekdaysShort: ['ច', 'អ', 'ព', 'ព្រ', 'សុ', 'ស', 'អា'],
  dateLabel: 'កាលបរិច្ឆេទ',
  addPast: 'បន្ថែមការហាត់ថ្ងៃមុន',
  addPastHint: 'ភ្លេចកត់ត្រាថ្ងៃណាមួយ? ជ្រើសថ្ងៃនោះនៅលើប្រតិទិន ហើយបំពេញ។',
  prevMonth: 'ខែមុន',
  nextMonth: 'ខែក្រោយ',
  todayBtn: 'ថ្ងៃនេះ',
  noWorkoutDay: 'គ្មានការហាត់នៅថ្ងៃនេះ',
  logForDay: 'កត់ត្រាការហាត់សម្រាប់ថ្ងៃនេះ',
  deleteBtn: 'លុប',
  emptyHistory: 'មិនទាន់មានការហាត់',
  emptyHistoryHint: 'ចាប់ផ្តើមកម្មវិធីនៅផ្ទាំង ហាត់',
  weekly: 'ការហាត់ក្នុងមួយសប្តាហ៍',
  exercises: 'លំហាត់',
  metric: { heaviest: 'ធ្ងន់បំផុត', e1rm: '1RM', volume: 'បរិមាណ' },
  needMore: 'ហាត់លំហាត់នេះច្រើនថ្ងៃទៀត ដើម្បីឃើញខ្សែ',
  noHistory: 'មិនទាន់ធ្វើ',
  pickExercise: 'ជ្រើសលំហាត់',
  search: 'ស្វែងរក',
  moreExercises: 'បង្ហាញលំហាត់ទាំងអស់',
  fewerExercises: 'បង្ហាញតិចជាងនេះ',
  noMatch: 'រកមិនឃើញលំហាត់',
  ownExercise: 'បន្ថែមលំហាត់ផ្ទាល់ខ្លួន',
  ownName: 'ឈ្មោះលំហាត់',
  create: 'បន្ថែម',
  rename: 'ប្តូរឈ្មោះ',
  deleteRoutine: 'លុបកម្មវិធី',
  deleteRoutineConfirm: 'លុបកម្មវិធីនេះ? ការហាត់ចាស់នៅតែមានក្នុងប្រវត្តិ។',
  remove: 'ដកចេញ',
  moveUp: 'ឡើងលើ',
  moveDown: 'ចុះក្រោម',
  deleteWorkout: 'លុបការហាត់',
  deleteWorkoutConfirm: 'លុបការហាត់នេះទាំងមូល?',
  back: 'ត្រឡប់',
  language: 'ភាសា',
  theme: 'ភ្លឺ ឬ ងងឹត',
  bw: 'ខ្លួន',
  firstTime: 'លើកដំបូង',
  sampleTitle: 'ទិន្នន័យគំរូ',
  sampleHint: 'បំពេញកម្មវិធីដោយការហាត់គំរូ 8 សប្តាហ៍ ដើម្បីមើលរូបរាង។ ការហាត់របស់អ្នកមិនត្រូវបានប៉ះពាល់ទេ។',
  sampleLoad: 'បញ្ចូលទិន្នន័យគំរូ',
  sampleClear: 'លុបទិន្នន័យគំរូ',
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

export type DateStyle = 'long' | 'medium' | 'short' | 'month'

const KM_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ']
const KM_DAYS = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍']

const EN_FMT: Record<DateStyle, Intl.DateTimeFormat> = {
  long: new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
  medium: new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'long' }),
  short: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }),
  month: new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }),
}

/** Browsers format km-KH poorly ("M10 2, Fri"), so Khmer dates are built by hand. */
function formatDate(lang: Lang, d: Date, style: DateStyle): string {
  if (lang === 'en') return EN_FMT[style].format(d)
  if (style === 'month') return `${KM_MONTHS[d.getMonth()]} ${d.getFullYear()}`
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

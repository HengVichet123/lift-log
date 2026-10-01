import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Group } from './exercises'

export type Lang = 'en' | 'km'

const en = {
  today: 'Today',
  history: 'History',
  progress: 'Progress',
  addExercise: 'Add exercise',
  pickExercise: 'Pick exercise',
  search: 'Search',
  moreExercises: 'Show all exercises',
  fewerExercises: 'Show fewer',
  saveSet: 'Save set',
  lastTime: 'Last time',
  firstTime: 'First time',
  todaySets: 'Today',
  kg: 'kg',
  reps: 'reps',
  body: 'Body',
  emptyToday: 'Nothing yet today',
  emptyTodayHint: 'Pick an exercise to start',
  again: 'Do again',
  emptyHistory: 'No workouts yet',
  emptyHistoryHint: 'Your saved sets appear here',
  emptyProgress: 'No progress yet',
  emptyProgressHint: 'Save a few sets and your chart grows here',
  best: 'Best',
  newBest: 'New best',
  sessions: 'Workouts',
  deleteSet: 'Delete set',
  back: 'Back',
  noMatch: 'No exercise found',
  language: 'Language',
  heaviest: 'Heaviest set each day',
  mostReps: 'Most reps each day',
  needMore: 'Do this exercise on more days to see a line',
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
  today: 'ថ្ងៃនេះ',
  history: 'ប្រវត្តិ',
  progress: 'វឌ្ឍនភាព',
  addExercise: 'បន្ថែមលំហាត់',
  pickExercise: 'ជ្រើសលំហាត់',
  search: 'ស្វែងរក',
  moreExercises: 'បង្ហាញលំហាត់ទាំងអស់',
  fewerExercises: 'បង្ហាញតិចជាងនេះ',
  saveSet: 'រក្សាទុក',
  lastTime: 'លើកមុន',
  firstTime: 'លើកដំបូង',
  todaySets: 'ថ្ងៃនេះ',
  kg: 'គ.ក',
  reps: 'ដង',
  body: 'ខ្លួន',
  emptyToday: 'ថ្ងៃនេះមិនទាន់មានលំហាត់',
  emptyTodayHint: 'ជ្រើសលំហាត់ដើម្បីចាប់ផ្តើម',
  again: 'ធ្វើម្តងទៀត',
  emptyHistory: 'មិនទាន់មានលំហាត់',
  emptyHistoryHint: 'ឈុតដែលអ្នករក្សាទុកនឹងបង្ហាញនៅទីនេះ',
  emptyProgress: 'មិនទាន់មានវឌ្ឍនភាព',
  emptyProgressHint: 'រក្សាទុកឈុតខ្លះ ក្រាហ្វនឹងបង្ហាញនៅទីនេះ',
  best: 'ល្អបំផុត',
  newBest: 'កំណត់ត្រាថ្មី',
  sessions: 'ដងហាត់',
  deleteSet: 'លុបឈុតនេះ',
  back: 'ត្រឡប់',
  noMatch: 'រកមិនឃើញលំហាត់',
  language: 'ភាសា',
  heaviest: 'ទម្ងន់ធ្ងន់បំផុតក្នុងមួយថ្ងៃ',
  mostReps: 'ចំនួនដងច្រើនបំផុតក្នុងមួយថ្ងៃ',
  needMore: 'ហាត់លំហាត់នេះច្រើនថ្ងៃទៀត ដើម្បីឃើញខ្សែ',
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

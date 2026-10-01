import { CalendarBlank, ChartLineUp, ListChecks } from '@phosphor-icons/react'
import { useI18n } from '../i18n'
import { href } from '../router'

export type Tab = 'history' | 'routines' | 'progress'

export function BottomNav({ tab }: { tab: Tab }) {
  const { t } = useI18n()
  const item = (key: Tab, label: string, Icon: typeof CalendarBlank, to: string) => (
    <a href={to} aria-current={tab === key ? 'page' : undefined}>
      <Icon size={26} weight={tab === key ? 'fill' : 'regular'} />
      <span>{label}</span>
    </a>
  )
  return (
    <nav className="tabbar" aria-label="Main">
      {item('history', t.history, CalendarBlank, href({ name: 'history' }))}
      {item('routines', t.routines, ListChecks, href({ name: 'routines' }))}
      {item('progress', t.progress, ChartLineUp, href({ name: 'progress' }))}
    </nav>
  )
}

import { Barbell, ChartLineUp, ClockCounterClockwise } from '@phosphor-icons/react'
import { useI18n } from '../i18n'
import { href } from '../router'

export type Tab = 'workout' | 'history' | 'progress'

export function BottomNav({ tab }: { tab: Tab }) {
  const { t } = useI18n()
  const item = (key: Tab, label: string, Icon: typeof Barbell, to: string) => (
    <a href={to} aria-current={tab === key ? 'page' : undefined}>
      <Icon size={26} weight={tab === key ? 'fill' : 'regular'} />
      <span>{label}</span>
    </a>
  )
  return (
    <nav className="tabbar" aria-label="Main">
      {item('workout', t.workout, Barbell, href({ name: 'workout' }))}
      {item('history', t.history, ClockCounterClockwise, href({ name: 'history' }))}
      {item('progress', t.progress, ChartLineUp, href({ name: 'progress' }))}
    </nav>
  )
}

import { House, ListChecks, Table } from '@phosphor-icons/react'
import { useI18n } from '../i18n'
import { href } from '../router'

export type Tab = 'home' | 'data' | 'program'

export function BottomNav({ tab }: { tab: Tab }) {
  const { t } = useI18n()
  const item = (key: Tab, label: string, Icon: typeof House, to: string) => (
    <a href={to} aria-current={tab === key ? 'page' : undefined}>
      <Icon size={28} weight={tab === key ? 'fill' : 'regular'} />
      <span>{label}</span>
    </a>
  )
  return (
    <nav className="tabbar" aria-label="Main">
      {item('home', t.home, House, href({ name: 'home' }))}
      {item('data', t.data, Table, href({ name: 'data' }))}
      {item('program', t.program, ListChecks, href({ name: 'program' }))}
    </nav>
  )
}

import { Barbell, CalendarBlank, ChartLineUp } from '@phosphor-icons/react'
import { useI18n } from './i18n'
import { href, useRoute, type Route } from './router'
import { History } from './screens/History'
import { Log } from './screens/Log'
import { Pick } from './screens/Pick'
import { Progress, ProgressDetail } from './screens/Progress'
import { Today } from './screens/Today'

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case 'today': return <Today />
    case 'pick': return <Pick />
    case 'log': return <Log key={route.id} id={route.id} />
    case 'history': return <History />
    case 'progress': return <Progress />
    case 'progressDetail': return <ProgressDetail id={route.id} />
  }
}

export default function App() {
  const route = useRoute()
  const { t } = useI18n()
  const tab = route.name === 'history' ? 'history' : route.name === 'progress' || route.name === 'progressDetail' ? 'progress' : 'today'
  const showNav = route.name !== 'pick' && route.name !== 'log'

  return (
    <div className={`app ${showNav ? 'has-nav' : ''}`}>
      <Screen route={route} />
      {showNav && (
        <nav className="tabbar" aria-label="Main">
          <a href={href({ name: 'today' })} aria-current={tab === 'today' ? 'page' : undefined}>
            <Barbell size={28} weight={tab === 'today' ? 'fill' : 'regular'} />
            <span>{t.today}</span>
          </a>
          <a href={href({ name: 'history' })} aria-current={tab === 'history' ? 'page' : undefined}>
            <CalendarBlank size={28} weight={tab === 'history' ? 'fill' : 'regular'} />
            <span>{t.history}</span>
          </a>
          <a href={href({ name: 'progress' })} aria-current={tab === 'progress' ? 'page' : undefined}>
            <ChartLineUp size={28} weight={tab === 'progress' ? 'fill' : 'regular'} />
            <span>{t.progress}</span>
          </a>
        </nav>
      )}
    </div>
  )
}

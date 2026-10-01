import { BottomNav, type Tab } from './components/BottomNav'
import { useRoute, type Route } from './router'
import { Active } from './screens/Active'
import { ExerciseDetail } from './screens/ExerciseDetail'
import { History } from './screens/History'
import { Pick } from './screens/Pick'
import { Progress } from './screens/Progress'
import { Routine } from './screens/Routine'
import { Summary } from './screens/Summary'
import { Workout } from './screens/Workout'

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case 'workout': return <Workout />
    case 'active': return <Active key={route.sessionId} sessionId={route.sessionId} />
    case 'summary': return <Summary sessionId={route.sessionId} />
    case 'history': return <History day={route.day} />
    case 'progress': return <Progress typeId={route.typeId} />
    case 'exercise': return <ExerciseDetail id={route.id} />
    case 'routine': return <Routine typeId={route.typeId} />
    case 'pick': return <Pick target={route.target} />
  }
}

function tabOf(route: Route): Tab | null {
  switch (route.name) {
    case 'workout': return 'workout'
    case 'history': return 'history'
    case 'progress': return 'progress'
    default: return null
  }
}

export default function App() {
  const route = useRoute()
  const tab = tabOf(route)
  return (
    <div className={`app ${tab ? 'has-nav' : ''}`}>
      <Screen route={route} />
      {tab && <BottomNav tab={tab} />}
    </div>
  )
}

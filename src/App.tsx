import { BottomNav, type Tab } from './components/BottomNav'
import { useRoute, type Route } from './router'
import { Data } from './screens/Data'
import { Day } from './screens/Day'
import { ExerciseDetail } from './screens/ExerciseDetail'
import { Home } from './screens/Home'
import { Pick } from './screens/Pick'
import { Program, ProgramDay } from './screens/Program'

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case 'home': return <Home />
    case 'day': return <Day key={route.sessionId} sessionId={route.sessionId} />
    case 'data': return <Data typeId={route.typeId} />
    case 'exercise': return <ExerciseDetail id={route.id} />
    case 'program': return <Program />
    case 'programDay': return <ProgramDay typeId={route.typeId} />
    case 'pick': return <Pick target={route.target} />
  }
}

function tabOf(route: Route): Tab | null {
  switch (route.name) {
    case 'home': return 'home'
    case 'data':
    case 'exercise': return 'data'
    case 'program': return 'program'
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

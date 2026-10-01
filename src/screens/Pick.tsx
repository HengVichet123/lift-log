import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { EXERCISES, GROUPS, GROUP_COVER, getExercise, type Group } from '../exercises'
import { useI18n } from '../i18n'
import { back, go } from '../router'
import { ExercisePhoto } from '../components/ExercisePhoto'
import { ScreenHeader } from '../components/ScreenHeader'

const GROUP_KEY = 'lift-log:group'

function savedGroup(): Group {
  try {
    const g = sessionStorage.getItem(GROUP_KEY)
    if (g && (GROUPS as string[]).includes(g)) return g as Group
  } catch {
    // ignore
  }
  return 'chest'
}

export function Pick() {
  const { t } = useI18n()
  const [group, setGroupState] = useState<Group>(savedGroup)
  const [showAll, setShowAll] = useState(false)
  const [q, setQ] = useState('')

  const setGroup = (g: Group) => {
    setGroupState(g)
    setShowAll(false)
    try {
      sessionStorage.setItem(GROUP_KEY, g)
    } catch {
      // ignore
    }
  }

  const query = q.trim().toLowerCase()
  const list = useMemo(() => {
    if (query) return EXERCISES.filter((e) => e.name.toLowerCase().includes(query)).slice(0, 60)
    return EXERCISES.filter((e) => e.group === group && (showAll || e.starter))
  }, [query, group, showAll])

  return (
    <main className="screen">
      <ScreenHeader title={t.pickExercise} onBack={() => back({ name: 'today' })} />

      <div className="search">
        <MagnifyingGlass size={22} aria-hidden />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} aria-label={t.search} />
        {q && (
          <button type="button" className="icon-btn" onClick={() => setQ('')} aria-label="Clear">
            <X size={20} />
          </button>
        )}
      </div>

      {!query && (
        <nav className="groups" aria-label="Body part">
          {GROUPS.map((g) => (
            <button type="button" key={g} className={`group-tab g-${g}`} aria-pressed={g === group} onClick={() => setGroup(g)}>
              <ExercisePhoto ex={getExercise(GROUP_COVER[g])!} className="group-photo" />
              <span>{t.groups[g]}</span>
            </button>
          ))}
        </nav>
      )}

      {list.length === 0 ? (
        <p className="empty-hint pad">{t.noMatch}</p>
      ) : (
        <ul className="grid">
          {list.map((ex) => (
            <li key={ex.id}>
              <button type="button" className={`card g-${ex.group}`} onClick={() => go({ name: 'log', id: ex.id }, true)}>
                <ExercisePhoto ex={ex} />
                <span className="card-name">{ex.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!query && (
        <button type="button" className="btn-quiet" onClick={() => setShowAll((v) => !v)}>
          {showAll ? t.fewerExercises : t.moreExercises}
        </button>
      )}
    </main>
  )
}

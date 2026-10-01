import { MagnifyingGlass, Plus, X } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { db, newId } from '../db'
import { CATALOG, GROUPS, GROUP_COVER, catalogExercise, type Group } from '../exercises'
import { useI18n } from '../i18n'
import { back, type PickTarget } from '../router'
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

async function addTo(target: PickTarget, exerciseId: string) {
  if (target.kind === 'type') {
    const dt = await db.dayTypes.get(target.id)
    if (dt && !dt.exerciseIds.includes(exerciseId)) await db.dayTypes.update(target.id, { exerciseIds: [...dt.exerciseIds, exerciseId] })
  } else {
    const s = await db.sessions.get(target.id)
    if (!s) return
    const has = await db.entries.where('sessionId').equals(target.id).filter((e) => e.exerciseId === exerciseId).count()
    if (!has) await db.entries.add({ sessionId: target.id, date: s.date, exerciseId, order: 1000 + Date.now() % 100000, sets: [], note: '' })
  }
}

export function Pick({ target }: { target: PickTarget }) {
  const { t } = useI18n()
  const [group, setGroupState] = useState<Group>(savedGroup)
  const [showAll, setShowAll] = useState(false)
  const [q, setQ] = useState('')
  const [ownName, setOwnName] = useState('')

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
    if (query) return CATALOG.filter((e) => e.name.toLowerCase().includes(query)).slice(0, 60)
    return CATALOG.filter((e) => e.group === group && (showAll || e.starter))
  }, [query, group, showAll])

  const choose = async (id: string) => {
    await addTo(target, id)
    back({ name: 'home' })
  }

  const createOwn = async () => {
    const name = ownName.trim()
    if (!name) return
    const id = newId('c')
    await db.customExercises.add({ id, name, group })
    await choose(id)
  }

  return (
    <main className="screen">
      <ScreenHeader title={t.pickExercise} onBack={() => back({ name: 'home' })} />

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
        <nav className="groups" aria-label={t.ownGroup}>
          {GROUPS.map((g) => (
            <button type="button" key={g} className={`group-tab g-${g}`} aria-pressed={g === group} onClick={() => setGroup(g)}>
              <ExercisePhoto ex={catalogExercise(GROUP_COVER[g])!} className="group-photo" />
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
              <button type="button" className={`card g-${ex.group}`} onClick={() => choose(ex.id)}>
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

      <form
        className="inline-form own"
        onSubmit={(e) => {
          e.preventDefault()
          createOwn()
        }}
      >
        <label className="field-label" htmlFor="own-name">
          {t.ownExercise} ({t.groups[group]})
        </label>
        <div className="inline-row">
          <input id="own-name" className="text-input" value={ownName} onChange={(e) => setOwnName(e.target.value)} placeholder={t.ownName} />
          <button type="submit" className="btn-chip strong" disabled={!ownName.trim()}>
            <Plus size={18} weight="bold" />
            {t.create}
          </button>
        </div>
      </form>
    </main>
  )
}

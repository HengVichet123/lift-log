import { Plus } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, dayKey, type WorkoutSet } from '../db'
import { getExercise } from '../exercises'
import { useI18n } from '../i18n'
import { go } from '../router'
import { ExercisePhoto } from '../components/ExercisePhoto'
import { LangSwitch } from '../components/LangSwitch'
import { ScreenHeader } from '../components/ScreenHeader'
import { SetChip } from '../components/SetChip'
import { groupByExercise } from './shared'

export function Today() {
  const { t, date } = useI18n()
  const today = dayKey()
  const todaySets = useLiveQuery(() => db.sets.where('day').equals(today).sortBy('ts'), [today])
  const lastDayIds = useLiveQuery(async () => {
    const prev = await db.sets.where('day').below(today).reverse().sortBy('ts')
    if (!prev.length) return []
    const day = prev[0].day
    return [...new Set(prev.filter((s) => s.day === day).reverse().map((s) => s.exerciseId))]
  }, [today])

  const dateText = date(new Date(), 'long')
  const rows = todaySets ? groupByExercise(todaySets) : []
  const doneIds = new Set(rows.map(([id]) => id))
  const again = (lastDayIds ?? []).filter((id) => !doneIds.has(id) && getExercise(id))

  return (
    <main className="screen">
      <ScreenHeader title={<><span>{t.today}</span><small className="screen-sub">{dateText}</small></>} right={<LangSwitch />} />

      {todaySets && rows.length === 0 && (
        <section className="empty">
          <p className="empty-title">{t.emptyToday}</p>
          <p className="empty-hint">{t.emptyTodayHint}</p>
        </section>
      )}

      {rows.length > 0 && (
        <ul className="ex-list">
          {rows.map(([id, sets]) => (
            <ExerciseRow key={id} id={id} sets={sets} onClick={() => go({ name: 'log', id })} />
          ))}
        </ul>
      )}

      <button type="button" className="btn-primary btn-add" onClick={() => go({ name: 'pick' })}>
        <Plus size={26} weight="bold" />
        {t.addExercise}
      </button>

      {again.length > 0 && (
        <section className="again">
          <h2 className="section-title">{t.again}</h2>
          <div className="again-strip">
            {again.map((id) => {
              const ex = getExercise(id)!
              return (
                <button type="button" key={id} className={`again-item g-${ex.group}`} onClick={() => go({ name: 'log', id })}>
                  <ExercisePhoto ex={ex} />
                  <span className="again-name">{ex.name}</span>
                </button>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}

export function ExerciseRow({ id, sets, onClick }: { id: string; sets: WorkoutSet[]; onClick: () => void }) {
  const ex = getExercise(id)
  if (!ex) return null
  return (
    <li>
      <button type="button" className={`ex-row g-${ex.group}`} onClick={onClick}>
        <ExercisePhoto ex={ex} className="thumb" />
        <span className="ex-row-body">
          <span className="ex-name">{ex.name}</span>
          <span className="chips">
            {sets.map((s) => (
              <SetChip key={s.id} s={s} />
            ))}
          </span>
        </span>
      </button>
    </li>
  )
}

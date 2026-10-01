import { Trophy } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, parseDay } from '../db'
import { getExercise } from '../exercises'
import { useI18n } from '../i18n'
import { back, go } from '../router'
import { bestSet, byReps, groupByDay, metric } from '../stats'
import { ExercisePhoto } from '../components/ExercisePhoto'
import { LangSwitch } from '../components/LangSwitch'
import { LineChart } from '../components/LineChart'
import { ScreenHeader } from '../components/ScreenHeader'
import { SetChip } from '../components/SetChip'

export function Progress() {
  const { t } = useI18n()
  const rows = useLiveQuery(async () => {
    const sets = await db.sets.orderBy('ts').reverse().toArray()
    const m = new Map<string, typeof sets>()
    for (const s of sets) {
      const l = m.get(s.exerciseId)
      if (l) l.push(s)
      else m.set(s.exerciseId, [s])
    }
    return [...m.entries()].filter(([id]) => getExercise(id))
  })

  return (
    <main className="screen">
      <ScreenHeader title={t.progress} right={<LangSwitch />} />
      {rows && rows.length === 0 && (
        <section className="empty">
          <p className="empty-title">{t.emptyProgress}</p>
          <p className="empty-hint">{t.emptyProgressHint}</p>
        </section>
      )}
      <ul className="ex-list">
        {(rows ?? []).map(([id, sets]) => {
          const ex = getExercise(id)!
          const best = bestSet(sets)!
          const days = new Set(sets.map((s) => s.day)).size
          return (
            <li key={id}>
              <button type="button" className={`ex-row g-${ex.group}`} onClick={() => go({ name: 'progressDetail', id })}>
                <ExercisePhoto ex={ex} className="thumb" />
                <span className="ex-row-body">
                  <span className="ex-name">{ex.name}</span>
                  <span className="chips">
                    <Trophy size={20} weight="fill" className="trophy" aria-label={t.best} />
                    <SetChip s={best} best />
                    <span className="muted-num">
                      {days} {t.sessions}
                    </span>
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </main>
  )
}

export function ProgressDetail({ id }: { id: string }) {
  const { t, date } = useI18n()
  const ex = getExercise(id)
  const sets = useLiveQuery(() => db.sets.where('exerciseId').equals(id).sortBy('ts'), [id])
  if (!ex) return null

  const list = sets ?? []
  const reps = byReps(list)
  const days = [...groupByDay(list).entries()]
  const points = days.map(([day, s]) => ({ label: date(parseDay(day), 'short'), value: metric(bestSet(s)!, reps) }))
  const best = bestSet(list)

  return (
    <main className="screen">
      <ScreenHeader title={<span className="title-ex">{ex.name}</span>} onBack={() => back({ name: 'progress' })} />

      <div className={`detail-top g-${ex.group}`}>
        <ExercisePhoto ex={ex} moving className="detail-photo" />
        {best && (
          <div className="best-big">
            <Trophy size={28} weight="fill" className="trophy" />
            <SetChip s={best} best />
          </div>
        )}
      </div>

      {points.length >= 2 ? (
        <section>
          <h2 className="section-title">{reps ? t.mostReps : t.heaviest}</h2>
          <LineChart points={points} unit={reps ? t.reps : t.kg} />
        </section>
      ) : (
        list.length > 0 && <p className="empty-hint pad">{t.needMore}</p>
      )}

      <section>
        <h2 className="section-title">{t.sessions}</h2>
        <ul className="session-list">
          {[...days].reverse().map(([day, s]) => {
            const b = bestSet(s)
            return (
              <li key={day} className="session">
                <span className="session-date">{date(parseDay(day), 'medium')}</span>
                <span className="chips">
                  {s.map((x) => (
                    <SetChip key={x.id} s={x} best={x === b && b === best} />
                  ))}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <button type="button" className="btn-primary" onClick={() => go({ name: 'log', id })}>
        {t.again}
      </button>
    </main>
  )
}

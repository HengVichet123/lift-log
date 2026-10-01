import { useLiveQuery } from 'dexie-react-hooks'
import { db, parseDay } from '../db'
import { useI18n } from '../i18n'
import { go } from '../router'
import { groupByDay } from '../stats'
import { LangSwitch } from '../components/LangSwitch'
import { ScreenHeader } from '../components/ScreenHeader'
import { ExerciseRow } from './Today'
import { groupByExercise } from './shared'

export function History() {
  const { t, date } = useI18n()
  const sets = useLiveQuery(() => db.sets.orderBy('ts').reverse().toArray())
  const days = sets ? [...groupByDay(sets).entries()] : []

  return (
    <main className="screen">
      <ScreenHeader title={t.history} right={<LangSwitch />} />
      {sets && days.length === 0 && (
        <section className="empty">
          <p className="empty-title">{t.emptyHistory}</p>
          <p className="empty-hint">{t.emptyHistoryHint}</p>
        </section>
      )}
      {days.map(([day, list]) => (
        <section key={day} className="day">
          <h2 className="section-title">{date(parseDay(day), 'medium')}</h2>
          <ul className="ex-list">
            {groupByExercise(list).map(([id, s]) => (
              <ExerciseRow key={id} id={id} sets={s} onClick={() => go({ name: 'progressDetail', id })} />
            ))}
          </ul>
        </section>
      ))}
    </main>
  )
}

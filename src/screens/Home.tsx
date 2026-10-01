import { CaretRight } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, dayKey, daysBetween, doneSets, parseDay } from '../db'
import { useExercises } from '../exercises'
import { useI18n } from '../i18n'
import { go } from '../router'
import { ExercisePhoto } from '../components/ExercisePhoto'
import { LangSwitch } from '../components/LangSwitch'
import { ScreenHeader } from '../components/ScreenHeader'

/** Open today's workout of this type, or start a new one. */
export async function startWorkout(dayTypeId: string) {
  const today = dayKey()
  const existing = await db.sessions.where('[dayTypeId+date]').equals([dayTypeId, today]).first()
  const id = existing?.id ?? (await db.sessions.add({ date: today, dayTypeId, createdAt: Date.now() }))
  go({ name: 'day', sessionId: id as number })
}

export function Home() {
  const { t, date } = useI18n()
  const lookup = useExercises()
  const today = dayKey()

  const types = useLiveQuery(() => db.dayTypes.orderBy('order').toArray(), [])
  const sessions = useLiveQuery(async () => {
    const all = await db.sessions.orderBy('date').reverse().toArray()
    const out = []
    for (const s of all) {
      const entries = (await db.entries.where('sessionId').equals(s.id!).toArray()).filter((e) => doneSets(e).length > 0)
      if (entries.length) out.push({ s, entries })
    }
    return out
  }, [])

  const lastDone = (typeId: string) => sessions?.find((x) => x.s.dayTypeId === typeId)?.s.date
  const typeName = (id: string) => types?.find((x) => x.id === id)?.name ?? '?'

  return (
    <main className="screen">
      <ScreenHeader title="Lift Log" right={<LangSwitch />} />

      <section>
        <h2 className="section-title">{t.startDay}</h2>
        <ul className="daytype-list">
          {(types ?? []).map((dt) => {
            const last = lastDone(dt.id)
            const thumbs = dt.exerciseIds.map(lookup).filter(Boolean).slice(0, 3)
            return (
              <li key={dt.id}>
                <button type="button" className="daytype" onClick={() => startWorkout(dt.id)}>
                  <span className="daytype-thumbs">
                    {thumbs.map((ex) => (
                      <ExercisePhoto key={ex!.id} ex={ex!} />
                    ))}
                  </span>
                  <span className="daytype-body">
                    <span className="daytype-name">{dt.name}</span>
                    <span className="daytype-meta">
                      {t.exercisesCount(dt.exerciseIds.length)}
                      {' · '}
                      {last ? t.lastDone(daysBetween(last, today)) : t.never}
                    </span>
                  </span>
                  <CaretRight size={24} weight="bold" className="daytype-go" />
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {sessions && sessions.length > 0 && (
        <section>
          <h2 className="section-title">{t.recent}</h2>
          <ul className="recent-list">
            {sessions.slice(0, 12).map(({ s, entries }) => (
              <li key={s.id}>
                <button type="button" className="recent" onClick={() => go({ name: 'day', sessionId: s.id! })}>
                  <span className="recent-date">{date(parseDay(s.date), 'medium')}</span>
                  <span className="recent-type">{typeName(s.dayTypeId)}</span>
                  <span className="recent-thumbs">
                    {entries.slice(0, 4).map((e) => {
                      const ex = lookup(e.exerciseId)
                      return ex ? <ExercisePhoto key={e.id} ex={ex} /> : null
                    })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}

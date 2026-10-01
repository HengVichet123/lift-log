import { PencilSimple, Trophy } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, doneSets, parseDay, workSets } from '../db'
import { useExercises } from '../exercises'
import { fmtVolume, volume } from '../format'
import { useI18n } from '../i18n'
import { sessionRecords } from '../records'
import { back, go } from '../router'
import { editWorkout } from '../workouts'
import { ExercisePhoto } from '../components/ExercisePhoto'
import { ScreenHeader } from '../components/ScreenHeader'
import { SetLines } from '../components/SetLines'

/** A saved workout, read-only. Edit opens it with last time's suggestions again. */
export function View({ sessionId }: { sessionId: number }) {
  const { t, date } = useI18n()
  const lookup = useExercises()
  const data = useLiveQuery(async () => {
    const session = await db.sessions.get(sessionId)
    if (!session) return null
    const type = await db.dayTypes.get(session.dayTypeId)
    const entries = (await db.entries.where('sessionId').equals(sessionId).toArray()).filter((e) => doneSets(e).length > 0 || e.note).sort((a, b) => a.order - b.order)
    const records = await sessionRecords(sessionId)
    return { session, type, entries, records }
  }, [sessionId])

  if (data === undefined) return <main className="screen" />
  if (data === null) {
    return (
      <main className="screen">
        <ScreenHeader title={t.history} onBack={() => go({ name: 'history' }, true)} />
        <p className="empty-hint pad">{t.notFoundWorkout}</p>
      </main>
    )
  }
  const { session, type, entries, records } = data
  const prs = new Set(records.map((r) => r.exerciseId))
  const sets = entries.flatMap(workSets)

  return (
    <main className="screen">
      <ScreenHeader
        title={
          <>
            <span>{type?.name ?? t.workout}</span>
            <small className="screen-sub">{date(parseDay(session.date), 'long')}</small>
          </>
        }
        onBack={() => back({ name: 'history', day: session.date })}
        right={
          <button type="button" className="btn-chip strong" onClick={() => editWorkout(sessionId)}>
            <PencilSimple size={18} />
            {t.edit}
          </button>
        }
      />

      <p className="view-meta">
        {t.exercisesCount(entries.length)} · {sets.length} {t.setsWord.toLowerCase()} · {fmtVolume(volume(sets))} {t.kg}
      </p>

      <ul className="plain-list view-list">
        {entries.map((e) => {
          const ex = lookup(e.exerciseId)
          if (!ex) return null
          return (
            <li key={e.id} className={`view-ex g-${ex.group}`}>
              <button type="button" className="view-ex-head" onClick={() => go({ name: 'exercise', id: ex.id })}>
                <ExercisePhoto ex={ex} className="avatar" />
                <span className="ex-name">{ex.name}</span>
                {prs.has(ex.id) && <Trophy size={20} weight="fill" className="trophy" aria-label={t.records} />}
              </button>
              <SetLines sets={doneSets(e)} className="stacked view-sets" />
              {e.note && <p className="view-note">{e.note}</p>}
            </li>
          )
        })}
      </ul>
    </main>
  )
}

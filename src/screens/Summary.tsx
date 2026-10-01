import { PencilSimple, Trophy } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, doneSets, finishedSessions, parseDay, workSets } from '../db'
import { useExercises } from '../exercises'
import { fmtSet, fmtVolume, topSet, volume } from '../format'
import { useI18n } from '../i18n'
import { sessionRecords } from '../records'
import { back, go } from '../router'
import { ExercisePhoto } from '../components/ExercisePhoto'
import { ScreenHeader } from '../components/ScreenHeader'

/** After Finish, and when a workout is opened from History. */
export function Summary({ sessionId }: { sessionId: number }) {
  const { t, date } = useI18n()
  const lookup = useExercises()
  const data = useLiveQuery(async () => {
    const session = await db.sessions.get(sessionId)
    if (!session) return null
    const type = await db.dayTypes.get(session.dayTypeId)
    const entries = (await db.entries.where('sessionId').equals(sessionId).toArray()).sort((a, b) => a.order - b.order)
    const all = await finishedSessions()
    const nth = all.findIndex((s) => s.id === sessionId) + 1
    const records = await sessionRecords(sessionId)
    return { session, type, entries, nth, records }
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
  const { session, type, entries, nth, records } = data
  const sets = entries.flatMap(workSets)
  const prs = new Map(records.map((r) => [r.exerciseId, r.kinds]))

  return (
    <main className="screen">
      <ScreenHeader
        title={
          <>
            <span>{type?.name ?? t.workout}</span>
            <small className="screen-sub">{date(parseDay(session.date), 'long')}</small>
          </>
        }
        onBack={() => back({ name: 'history' })}
        right={
          <button type="button" className="icon-btn" aria-label={t.edit} onClick={() => go({ name: 'active', sessionId })}>
            <PencilSimple size={22} />
          </button>
        }
      />

      <section className="summary-hero">
        <p className="summary-nth">{nth > 0 ? t.nth(nth) : t.complete}</p>
        <div className="stat-row">
          <div className="stat">
            <span className="stat-val">
              {fmtVolume(volume(sets))} <small>{t.kg}</small>
            </span>
            <span className="stat-label">{t.volume}</span>
          </div>
          <div className="stat">
            <span className="stat-val">{sets.length}</span>
            <span className="stat-label">{t.setsWord}</span>
          </div>
        </div>
      </section>

      {records.length > 0 && (
        <section className="records-box">
          <h2 className="section-title">
            <Trophy size={18} weight="fill" className="trophy" /> {t.records}
          </h2>
          <ul className="plain-list">
            {records.map((r) => {
              const ex = lookup(r.exerciseId)
              return (
                <li key={r.exerciseId} className="record-row">
                  <span className="ex-name">{ex?.name}</span>
                  <span className="muted">{r.kinds.map((k) => t.recordKind[k]).join(', ')}</span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section>
        <div className="table-head">
          <span>{t.exercises}</span>
          <span>{t.bestSet}</span>
        </div>
        <ul className="plain-list">
          {entries.map((e) => {
            const ex = lookup(e.exerciseId)
            const done = doneSets(e)
            const best = topSet(workSets(e))
            if (!ex) return null
            return (
              <li key={e.id}>
                <button type="button" className="sum-row" onClick={() => go({ name: 'exercise', id: ex.id })}>
                  <ExercisePhoto ex={ex} className="avatar" />
                  <span className="sum-name">
                    <span className="ex-name">
                      {done.length} × {ex.name}
                    </span>
                    {e.note && <span className="muted">{e.note}</span>}
                  </span>
                  <span className="sum-best">
                    {best ? fmtSet(best, t.bw) : ''}
                    {prs.has(ex.id) && <Trophy size={16} weight="fill" className="trophy" />}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <button type="button" className="btn-primary" onClick={() => go({ name: 'history', day: session.date }, true)}>
        {t.done}
      </button>
    </main>
  )
}

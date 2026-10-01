import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db, doneSets, finishedSessions, parseDay, workSets } from '../db'
import { useExercises } from '../exercises'
import { est1rm, fmtKg, fmtSet, topSet, volume } from '../format'
import { useI18n } from '../i18n'
import { recordsOf } from '../records'
import { back } from '../router'
import { ExercisePhoto } from '../components/ExercisePhoto'
import { LineChart } from '../components/LineChart'
import { ScreenHeader } from '../components/ScreenHeader'
import { SetLines } from '../components/SetLines'

type Metric = 'heaviest' | 'e1rm' | 'volume'

export function ExerciseDetail({ id }: { id: string }) {
  const { t, date } = useI18n()
  const ex = useExercises()(id)
  const [metric, setMetric] = useState<Metric>('heaviest')
  const entries = useLiveQuery(async () => {
    const finished = new Set((await finishedSessions()).map((s) => s.id))
    const list = await db.entries.where('exerciseId').equals(id).toArray()
    return list.filter((e) => finished.has(e.sessionId) && doneSets(e).length > 0).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.sessionId - b.sessionId))
  }, [id])
  if (!ex) return <main className="screen" />

  const list = entries ?? []
  const withWork = list.filter((e) => workSets(e).length > 0)
  const rec = recordsOf(list)
  const bodyweight = withWork.length > 0 && withWork.every((e) => workSets(e).every((s) => s.w === 0))
  const value = (sets: ReturnType<typeof workSets>) => {
    if (bodyweight) return Math.max(...sets.map((s) => s.r))
    if (metric === 'heaviest') return topSet(sets)!.w
    if (metric === 'e1rm') return Math.round(Math.max(...sets.map(est1rm)) * 10) / 10
    return volume(sets)
  }
  const points = withWork.map((e) => ({ label: date(parseDay(e.date), 'short'), value: value(workSets(e)) }))

  return (
    <main className="screen">
      <ScreenHeader title={<span className="title-ex">{ex.name}</span>} onBack={() => back({ name: 'progress' })} />

      <div className={`detail-photo-wrap g-${ex.group}`}>
        <ExercisePhoto ex={ex} moving className="detail-photo" />
      </div>

      {!bodyweight && withWork.length > 0 && (
        <div className="segmented" role="group">
          {(['heaviest', 'e1rm', 'volume'] as Metric[]).map((m) => (
            <button type="button" key={m} aria-pressed={metric === m} onClick={() => setMetric(m)}>
              {t.metric[m]}
            </button>
          ))}
        </div>
      )}
      {points.length >= 2 ? (
        <LineChart points={points} unit={bodyweight ? t.reps : t.kg} />
      ) : (
        withWork.length > 0 && <p className="empty-hint pad">{t.needMore}</p>
      )}

      {rec.heaviest && (
        <section>
          <h2 className="section-title">{t.records}</h2>
          <div className="rec-grid">
            <div className="rec">
              <span className="rec-val">{fmtSet(rec.heaviest.set, t.bw)}</span>
              <span className="rec-label">{t.recordKind.heaviest}</span>
            </div>
            {rec.e1rm && (
              <div className="rec">
                <span className="rec-val">
                  {fmtKg(Math.round(rec.e1rm.value * 10) / 10)} {t.kg}
                </span>
                <span className="rec-label">{t.recordKind.e1rm}</span>
              </div>
            )}
            {rec.setVolume && (
              <div className="rec">
                <span className="rec-val">{fmtSet(rec.setVolume.set, t.bw)}</span>
                <span className="rec-label">{t.recordKind.setVolume}</span>
              </div>
            )}
          </div>
        </section>
      )}

      <section>
        <h2 className="section-title">{t.history}</h2>
        {list.length === 0 && <p className="empty-hint pad">{t.noHistory}</p>}
        <ul className="session-list">
          {[...list].reverse().map((e) => (
            <li key={e.id} className="session">
              <span className="session-date">{date(parseDay(e.date), 'medium')}</span>
              <SetLines sets={doneSets(e)} />
              {e.note && <span className="session-note">{e.note}</span>}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

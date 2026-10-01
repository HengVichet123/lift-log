import { Trophy } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, doneSets, parseDay } from '../db'
import { fmtKg, isBetter, topSet } from '../format'
import { useExercises } from '../exercises'
import { useI18n } from '../i18n'
import { back } from '../router'
import { ExercisePhoto } from '../components/ExercisePhoto'
import { LineChart } from '../components/LineChart'
import { ScreenHeader } from '../components/ScreenHeader'
import { SetLines } from '../components/SetLines'

export function ExerciseDetail({ id }: { id: string }) {
  const { t, date } = useI18n()
  const ex = useExercises()(id)
  const entries = useLiveQuery(
    async () => (await db.entries.where('[exerciseId+date]').between([id, ''], [id, '￿']).toArray()).filter((e) => doneSets(e).length > 0 || e.note),
    [id],
  )
  if (!ex) return <main className="screen" />

  const withSets = (entries ?? []).filter((e) => doneSets(e).length > 0)
  const tops = withSets.map((e) => topSet(doneSets(e))!)
  const best = tops.reduce<(typeof tops)[number] | undefined>((b, s) => (!b || isBetter(s, b) ? s : b), undefined)
  const byReps = tops.every((s) => s.w === 0)
  const points = withSets.map((e, i) => ({ label: date(parseDay(e.date), 'short'), value: byReps ? tops[i].r : tops[i].w }))

  return (
    <main className="screen">
      <ScreenHeader title={<span className="title-ex">{ex.name}</span>} onBack={() => back({ name: 'data' })} />

      <div className={`detail-top g-${ex.group}`}>
        <ExercisePhoto ex={ex} moving className="detail-photo" />
        {best && (
          <div className="best-big">
            <Trophy size={26} weight="fill" className="trophy" />
            <b>{best.w > 0 ? fmtKg(best.w) : t.bw}</b>
            <span className="x">×</span>
            <b>{fmtKg(best.r)}</b>
          </div>
        )}
      </div>

      {points.length >= 2 ? (
        <section>
          <h2 className="section-title">{t.topSetChart}</h2>
          <LineChart points={points} unit={byReps ? t.reps : t.kg} />
        </section>
      ) : (
        withSets.length > 0 && <p className="empty-hint pad">{t.needMore}</p>
      )}

      <section>
        <h2 className="section-title">{t.workouts}</h2>
        <ul className="session-list">
          {[...(entries ?? [])].reverse().map((e) => (
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

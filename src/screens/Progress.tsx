import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef } from 'react'
import { db, dayKey, finishedSessions, parseDay, workSets, type Entry } from '../db'
import { useExercises, type Exercise } from '../exercises'
import { fmtSet, topSet } from '../format'
import { useI18n } from '../i18n'
import { go } from '../router'
import { ExercisePhoto } from '../components/ExercisePhoto'
import { HeaderTools } from '../components/HeaderTools'
import { ScreenHeader } from '../components/ScreenHeader'
import { SetLines } from '../components/SetLines'
import { Sparkline } from '../components/Sparkline'
import { WeekBars } from '../components/WeekBars'

const WEEKS = 12

function weekStart(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)) // Monday
  return x
}

export function Progress({ typeId }: { typeId?: string }) {
  const { t, date } = useI18n()
  const lookup = useExercises()
  const types = useLiveQuery(() => db.dayTypes.orderBy('order').toArray(), [])
  const current = typeId ?? types?.[0]?.id ?? 'all'

  const weeks = useLiveQuery(async () => {
    const sessions = await finishedSessions()
    const thisWeek = weekStart(new Date())
    const counts = Array.from({ length: WEEKS }, () => 0)
    for (const s of sessions) {
      const diff = Math.round((thisWeek.getTime() - weekStart(parseDay(s.date)).getTime()) / (7 * 86_400_000))
      if (diff >= 0 && diff < WEEKS) counts[WEEKS - 1 - diff]++
    }
    const first = new Date(thisWeek)
    first.setDate(first.getDate() - 7 * (WEEKS - 1))
    return { counts, labels: [date(first, 'short'), date(thisWeek, 'short')] }
  }, [date])

  const rows = useLiveQuery(async () => {
    const finished = new Set((await finishedSessions()).map((s) => s.id))
    let ids: string[]
    if (current === 'all') {
      // every exercise ever done, most recent first
      const done = (await db.entries.orderBy('date').reverse().toArray()).filter((e) => finished.has(e.sessionId) && workSets(e).length > 0)
      ids = [...new Set(done.map((e) => e.exerciseId))]
    } else {
      const type = await db.dayTypes.get(current)
      ids = [...(type?.exerciseIds ?? [])]
      const sessionIds = (await db.sessions.where('dayTypeId').equals(current).primaryKeys()) as number[]
      for (const e of await db.entries.where('sessionId').anyOf(sessionIds).toArray()) if (!ids.includes(e.exerciseId)) ids.push(e.exerciseId)
    }
    return Promise.all(
      ids.map(async (id) => {
        const entries = (await db.entries.where('[exerciseId+date]').between([id, ''], [id, dayKey(new Date(Date.now() + 864e5))]).toArray()).filter(
          (e) => finished.has(e.sessionId) && workSets(e).length > 0,
        )
        return { id, entries }
      }),
    )
  }, [current])

  return (
    <main className="screen">
      <ScreenHeader title={t.progress} right={<HeaderTools />} />

      {weeks && (
        <section className="panel">
          <h2 className="section-title">{t.weekly}</h2>
          <WeekBars counts={weeks.counts} labels={weeks.labels} />
        </section>
      )}

      <h2 className="section-title">{t.exercises}</h2>
      <nav className="type-tabs" aria-label={t.routines}>
        {(types ?? []).map((dt) => (
          <button type="button" key={dt.id} aria-pressed={dt.id === current} onClick={() => go({ name: 'progress', typeId: dt.id }, true)}>
            {dt.name}
          </button>
        ))}
        <button type="button" aria-pressed={current === 'all'} onClick={() => go({ name: 'progress', typeId: 'all' }, true)}>
          {t.allTab}
        </button>
      </nav>

      <ul className="prog-cards">
        {(rows ?? []).map(({ id, entries }) => {
          const ex = lookup(id)
          return ex ? <ProgressCard key={id} ex={ex} entries={entries} /> : null
        })}
      </ul>
    </main>
  )
}

function ProgressCard({ ex, entries }: { ex: Exercise; entries: Entry[] }) {
  const { t, date } = useI18n()
  const strip = useRef<HTMLDivElement>(null)
  const tops = entries.map((e) => topSet(workSets(e))!)
  const best = topSet(tops)

  // every workout of this exercise, sideways; opens at the newest
  useEffect(() => {
    const el = strip.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [entries.length])

  return (
    <li className={`p-card g-${ex.group}`}>
      <button type="button" className="p-top" onClick={() => go({ name: 'exercise', id: ex.id })}>
        <ExercisePhoto ex={ex} className="avatar lg" />
        <span className="p-title">
          <span className="ex-name">{ex.name}</span>
          <span className="muted">{best ? `${t.bestSet}: ${fmtSet(best, t.bw)}` : t.noHistory}</span>
        </span>
        <Sparkline values={tops.map((s) => (s.w > 0 ? s.w : s.r))} />
      </button>
      {entries.length > 0 && (
        <div className="strip" ref={strip}>
          {entries.map((e) => (
            <div key={e.id} className="strip-col">
              <span className="strip-date">{date(parseDay(e.date), 'short')}</span>
              <SetLines sets={workSets(e)} className="stacked" />
              {e.note && <span className="strip-note">{e.note}</span>}
            </div>
          ))}
        </div>
      )}
    </li>
  )
}

import { CaretLeft, CaretRight, CheckCircle, Plus, Trophy } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { db, dayKey, finishedSessions, newId, parseDay, workSets, type Session } from '../db'
import { useExercises } from '../exercises'
import { fmtSet, fmtVolume, topSet, volume } from '../format'
import { useI18n } from '../i18n'
import { deleteSession, logForDay } from '../workouts'
import { sessionRecords } from '../records'
import { go } from '../router'
import { ExercisePhoto } from '../components/ExercisePhoto'
import { HeaderTools } from '../components/HeaderTools'
import { SwipeRow } from '../components/SwipeRow'
import { ScreenHeader } from '../components/ScreenHeader'

function monthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1)
  const lead = (first.getDay() + 6) % 7 // weeks start on Monday
  const days = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = Array.from({ length: lead }, () => null)
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7) cells.push(null)
  return cells
}

export function History({ day }: { day?: string }) {
  const { t, date } = useI18n()
  const today = dayKey()
  const sessions = useLiveQuery(finishedSessions, [])
  const types = useLiveQuery(() => db.dayTypes.orderBy('order').toArray(), [])

  const byDay = useMemo(() => {
    const m = new Map<string, Session[]>()
    for (const s of sessions ?? []) m.set(s.date, [...(m.get(s.date) ?? []), s])
    return m
  }, [sessions])

  // the day to show: from the URL, else today, else the latest workout
  const selected = day ?? (byDay.has(today) || !sessions?.length ? today : sessions[sessions.length - 1].date)
  const sel = parseDay(selected)
  const cells = monthGrid(sel.getFullYear(), sel.getMonth())
  const pick = (d: string) => go({ name: 'history', day: d }, true)
  const shiftMonth = (n: number) => {
    const d = new Date(sel.getFullYear(), sel.getMonth() + n, 1)
    pick(dayKey(d))
  }
  const dayList = byDay.get(selected) ?? []

  return (
    <main className="screen">
      <ScreenHeader title={t.recordTitle} right={<HeaderTools />} />

      <section className="cal">
        <div className="cal-head">
          <button type="button" className="icon-btn" aria-label={t.prevMonth} onClick={() => shiftMonth(-1)}>
            <CaretLeft size={22} weight="bold" />
          </button>
          <span className="cal-title">{date(sel, 'month')}</span>
          <button type="button" className="icon-btn" aria-label={t.nextMonth} onClick={() => shiftMonth(1)}>
            <CaretRight size={22} weight="bold" />
          </button>
          <button type="button" className="btn-chip" onClick={() => pick(today)}>
            {t.todayBtn}
          </button>
        </div>
        <div className="cal-grid" role="grid">
          {t.weekdaysShort.map((w, i) => (
            <span key={i} className="cal-wd">
              {w}
            </span>
          ))}
          {cells.map((d, i) => {
            if (!d) return <span key={i} />
            const k = dayKey(d)
            const has = byDay.has(k)
            return (
              <button
                type="button"
                key={i}
                className={`cal-day ${has ? 'has' : ''} ${k === today ? 'today' : ''}`}
                aria-pressed={k === selected}
                aria-label={date(d, 'long')}
                onClick={() => pick(k)}
              >
                {d.getDate()}
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="section-title">{date(sel, 'long')}</h2>
        {dayList.length > 0 && (
          <ul className="history-list">
            {dayList.map((s) => (
              <DayWorkout key={s.id} s={s} name={types?.find((x) => x.id === s.dayTypeId)?.name ?? t.workout} />
            ))}
          </ul>
        )}
        {selected <= today && (
          <div className={`day-empty ${dayList.length ? 'after' : ''}`}>
            {dayList.length === 0 && <p className="muted">{t.noWorkoutDay}</p>}
            <p className="field-label">{dayList.length ? t.addAnother : t.recordThisDay}</p>
            <div className="chip-row">
              {(types ?? []).map((dt) => (
                <button type="button" key={dt.id} className="btn-chip" onClick={() => logForDay(selected, dt.id)}>
                  <Plus size={16} weight="bold" />
                  {dt.name}
                </button>
              ))}
            </div>
            <NewRoutine />
          </div>
        )}
        {selected > today && <p className="muted">{t.noWorkoutDay}</p>}
      </section>
    </main>
  )
}

function DayWorkout({ s, name }: { s: Session; name: string }) {
  const { t } = useI18n()
  const lookup = useExercises()
  const data = useLiveQuery(async () => {
    const entries = (await db.entries.where('sessionId').equals(s.id!).toArray()).sort((a, b) => a.order - b.order)
    return { entries, prs: (await sessionRecords(s.id!)).length }
  }, [s.id])
  const entries = data?.entries ?? []
  const sets = entries.flatMap(workSets)

  return (
    <li className="h-card">
      <SwipeRow
        label={t.deleteBtn}
        onDelete={() => {
          if (confirm(t.deleteWorkoutConfirm)) deleteSession(s.id!)
        }}
      >
        <button type="button" className="w-card" onClick={() => go({ name: 'summary', sessionId: s.id! })}>
          <span className="w-head">
            <CheckCircle size={28} weight="fill" className="w-check" />
            <span className="w-title">
              <span className="w-name">{name}</span>
              <span className="w-meta">
                {t.exercisesCount(entries.length)} · {sets.length} {t.setsWord.toLowerCase()} · {fmtVolume(volume(sets))} {t.kg}
              </span>
            </span>
            {!!data?.prs && (
              <span className="w-pr">
                <Trophy size={16} weight="fill" /> {data.prs}
              </span>
            )}
            <CaretRight size={20} weight="bold" className="w-go" />
          </span>
          <span className="w-rows">
            {entries.map((e) => {
              const ex = lookup(e.exerciseId)
              const best = topSet(workSets(e))
              return ex ? (
                <span key={e.id} className={`w-row g-${ex.group}`}>
                  <ExercisePhoto ex={ex} className="avatar sm" />
                  <span className="w-ex">{ex.name}</span>
                  <span className="w-best">{best ? fmtSet(best, t.bw) : ''}</span>
                </span>
              ) : null
            })}
          </span>
        </button>
      </SwipeRow>
    </li>
  )
}

/** Make a new routine right from the day, then pick its exercises. */
function NewRoutine() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  if (!open) {
    return (
      <button type="button" className="btn-dashed" onClick={() => setOpen(true)}>
        <Plus size={16} weight="bold" />
        {t.newRoutine}
      </button>
    )
  }
  return (
    <form
      className="inline-row"
      onSubmit={async (e) => {
        e.preventDefault()
        const n = name.trim()
        if (!n) return
        const id = newId('d')
        const order = (await db.dayTypes.toArray()).reduce((m, x) => Math.max(m, x.order), -1) + 1
        await db.dayTypes.add({ id, name: n, order, exerciseIds: [] })
        go({ name: 'routine', typeId: id })
      }}
    >
      <input className="text-input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={t.routineName} aria-label={t.routineName} />
      <button type="submit" className="btn-chip strong" disabled={!name.trim()}>
        {t.create}
      </button>
    </form>
  )
}

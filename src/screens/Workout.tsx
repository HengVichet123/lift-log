import { DotsThreeVertical, Play, Plus, Trash } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { activeSession, db, dayKey, daysBetween, finishedSessions, newId } from '../db'
import { useExercises } from '../exercises'
import { useI18n } from '../i18n'
import { go } from '../router'
import { clearSample, hasSample, loadSample } from '../sample'
import { ExercisePhoto } from '../components/ExercisePhoto'
import { HeaderTools } from '../components/HeaderTools'
import { ScreenHeader } from '../components/ScreenHeader'

/** Start a routine: one workout at a time, pre-filled with last time's set count. */
export async function startRoutine(dayTypeId: string) {
  const running = await activeSession()
  if (running) {
    go({ name: 'active', sessionId: running.id! })
    return
  }
  const type = await db.dayTypes.get(dayTypeId)
  const now = Date.now()
  const date = dayKey()
  const sessionId = (await db.sessions.add({ date, dayTypeId, createdAt: now, startedAt: now })) as number
  for (const [order, exerciseId] of (type?.exerciseIds ?? []).entries()) {
    const prev = (await db.entries.where('[exerciseId+date]').between([exerciseId, ''], [exerciseId, date], true, true).reverse().toArray()).find(
      (e) => e.sessionId !== sessionId && e.sets.some((s) => s.done),
    )
    const n = prev ? prev.sets.filter((s) => s.done).length : 3
    const sets = prev
      ? prev.sets.filter((s) => s.done).map((s) => ({ w: 0, r: 0, warmup: s.warmup }))
      : Array.from({ length: n }, () => ({ w: 0, r: 0 }))
    await db.entries.add({ sessionId, date, exerciseId, order, sets, note: '' })
  }
  go({ name: 'active', sessionId })
}

export function Workout() {
  const { t } = useI18n()
  const lookup = useExercises()
  const today = dayKey()
  const types = useLiveQuery(() => db.dayTypes.orderBy('order').toArray(), [])
  const running = useLiveQuery(activeSession, [])
  const finished = useLiveQuery(finishedSessions, [])
  const sample = useLiveQuery(hasSample, [])
  const [name, setName] = useState('')

  const lastDone = (id: string) => [...(finished ?? [])].reverse().find((s) => s.dayTypeId === id)?.date

  const addRoutine = async () => {
    const n = name.trim()
    if (!n) return
    const id = newId('d')
    const order = (types?.reduce((m, x) => Math.max(m, x.order), -1) ?? -1) + 1
    await db.dayTypes.add({ id, name: n, order, exerciseIds: [] })
    setName('')
    go({ name: 'routine', typeId: id })
  }

  return (
    <main className="screen">
      <ScreenHeader title={t.workout} right={<HeaderTools />} />

      {running && (
        <button type="button" className="resume" onClick={() => go({ name: 'active', sessionId: running.id! })}>
          <span className="resume-dot" aria-hidden />
          <span className="resume-text">
            <span className="resume-label">{t.inProgress}</span>
            <span className="resume-name">{types?.find((x) => x.id === running.dayTypeId)?.name}</span>
          </span>
          <span className="resume-go">{t.resume}</span>
        </button>
      )}

      <section>
        <h2 className="section-title">{t.routines}</h2>
        <ul className="routine-list">
          {(types ?? []).map((dt) => {
            const last = lastDone(dt.id)
            const exs = dt.exerciseIds.map(lookup).filter((e) => e !== undefined)
            return (
              <li key={dt.id} className="routine">
                <div className="routine-head">
                  <span className="routine-name">{dt.name}</span>
                  <button type="button" className="icon-btn" aria-label={t.edit} onClick={() => go({ name: 'routine', typeId: dt.id })}>
                    <DotsThreeVertical size={24} weight="bold" />
                  </button>
                </div>
                <span className="routine-meta">
                  {last ? t.lastDone(daysBetween(last, today)) : t.never}
                </span>
                <div className="routine-thumbs">
                  {exs.slice(0, 6).map((ex) => (
                    <ExercisePhoto key={ex.id} ex={ex} className="avatar" />
                  ))}
                </div>
                <p className="routine-list-names">{exs.map((e) => e.name).join(', ')}</p>
                <button type="button" className="btn-primary" onClick={() => startRoutine(dt.id)} disabled={!!running && running.dayTypeId !== dt.id}>
                  <Play size={20} weight="fill" />
                  {t.start}
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <form
        className="inline-form"
        onSubmit={(e) => {
          e.preventDefault()
          addRoutine()
        }}
      >
        <label className="field-label" htmlFor="new-routine">
          {t.newRoutine}
        </label>
        <div className="inline-row">
          <input id="new-routine" className="text-input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.routineName} />
          <button type="submit" className="btn-chip strong" disabled={!name.trim()}>
            <Plus size={18} weight="bold" />
            {t.create}
          </button>
        </div>
      </form>

      <section className="sample">
        <h2 className="section-title">{t.sampleTitle}</h2>
        <p className="muted">{t.sampleHint}</p>
        {sample ? (
          <button type="button" className="btn-danger-quiet" onClick={clearSample}>
            <Trash size={20} />
            {t.sampleClear}
          </button>
        ) : (
          <button
            type="button"
            className="btn-quiet"
            onClick={async () => {
              await loadSample()
              go({ name: 'history' })
            }}
          >
            {t.sampleLoad}
          </button>
        )}
      </section>
    </main>
  )
}

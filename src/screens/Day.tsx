import { CalendarBlank, Check, Copy, DotsThree, NotePencil, Plus, Trash, X } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db, doneSets, parseDay, type Entry, type SetEntry } from '../db'
import { fmtKg } from '../format'
import { useExercises, type Exercise } from '../exercises'
import { useI18n } from '../i18n'
import { back, go } from '../router'
import { ExercisePhoto } from '../components/ExercisePhoto'
import { ScreenHeader } from '../components/ScreenHeader'
import { SetLines } from '../components/SetLines'

/** Drop exercises with no reps filled in; drop the workout if nothing is left. */
async function tidy(sessionId: number) {
  await db.transaction('rw', db.entries, db.sessions, async () => {
    const entries = await db.entries.where('sessionId').equals(sessionId).toArray()
    for (const e of entries) {
      const sets = doneSets(e)
      if (sets.length === 0 && !e.note.trim()) await db.entries.delete(e.id!)
      else if (sets.length !== e.sets.length) await db.entries.update(e.id!, { sets })
    }
    if ((await db.entries.where('sessionId').equals(sessionId).count()) === 0) await db.sessions.delete(sessionId)
  })
}

export function Day({ sessionId }: { sessionId: number }) {
  const { t, date } = useI18n()
  const lookup = useExercises()
  const data = useLiveQuery(async () => {
    const session = await db.sessions.get(sessionId)
    if (!session) return null
    const type = await db.dayTypes.get(session.dayTypeId)
    const entries = await db.entries.where('sessionId').equals(sessionId).toArray()
    return { session, type, entries }
  }, [sessionId])
  const [editDate, setEditDate] = useState(false)

  if (data === undefined) return <main className="screen" />
  if (data === null) {
    return (
      <main className="screen">
        <ScreenHeader title="?" onBack={() => go({ name: 'home' }, true)} />
      </main>
    )
  }
  const { session, type, entries } = data
  const ids = [...(type?.exerciseIds ?? [])]
  for (const e of [...entries].sort((a, b) => a.order - b.order)) if (!ids.includes(e.exerciseId)) ids.push(e.exerciseId)

  const finish = async () => {
    await tidy(sessionId)
    go({ name: 'home' }, true)
  }

  return (
    <main className="screen">
      <ScreenHeader
        title={
          <>
            <span>{type?.name ?? '?'}</span>
            <small className="screen-sub">{date(parseDay(session.date), 'long')}</small>
          </>
        }
        onBack={async () => {
          await tidy(sessionId)
          back({ name: 'home' })
        }}
        right={
          <button type="button" className="icon-btn" aria-label={t.date} onClick={() => setEditDate((v) => !v)}>
            <CalendarBlank size={26} />
          </button>
        }
      />

      {editDate && (
        <label className="date-edit">
          {t.date}
          <input
            type="date"
            value={session.date}
            onChange={(e) => e.target.value && db.transaction('rw', db.sessions, db.entries, async () => {
              await db.sessions.update(sessionId, { date: e.target.value })
              await db.entries.where('sessionId').equals(sessionId).modify({ date: e.target.value })
            })}
          />
        </label>
      )}

      <ul className="work-list">
        {ids.map((id, i) => {
          const ex = lookup(id)
          if (!ex) return null
          return <ExerciseBlock key={id} ex={ex} order={i} sessionId={sessionId} date={session.date} entry={entries.find((e) => e.exerciseId === id)} />
        })}
      </ul>

      <button type="button" className="btn-quiet" onClick={() => go({ name: 'pick', target: { kind: 'session', id: sessionId } })}>
        <Plus size={20} weight="bold" />
        {t.addExercise}
      </button>

      <button type="button" className="btn-primary" onClick={finish}>
        <Check size={26} weight="bold" />
        {t.finish}
      </button>

      <button
        type="button"
        className="btn-danger-quiet"
        onClick={async () => {
          if (!confirm(t.deleteWorkoutConfirm)) return
          await db.transaction('rw', db.entries, db.sessions, async () => {
            await db.entries.where('sessionId').equals(sessionId).delete()
            await db.sessions.delete(sessionId)
          })
          go({ name: 'home' }, true)
        }}
      >
        <Trash size={20} />
        {t.deleteWorkout}
      </button>
    </main>
  )
}

interface BlockProps {
  ex: Exercise
  order: number
  sessionId: number
  date: string
  entry?: Entry
}

function ExerciseBlock({ ex, order, sessionId, date, entry }: BlockProps) {
  const { t, date: fmtDate } = useI18n()
  const [noteOpen, setNoteOpen] = useState(!!entry?.note)

  // the most recent earlier workout of this exercise, as the guide for today
  const last = useLiveQuery(async () => {
    const prev = await db.entries.where('[exerciseId+date]').between([ex.id, ''], [ex.id, date]).reverse().toArray()
    return prev.find((e) => e.sessionId !== sessionId && doneSets(e).length > 0) ?? null
  }, [ex.id, date, sessionId])

  const sets = entry?.sets ?? []
  const save = async (next: SetEntry[], note = entry?.note ?? '') => {
    if (entry?.id !== undefined) await db.entries.update(entry.id, { sets: next, note })
    else await db.entries.add({ sessionId, date, exerciseId: ex.id, order, sets: next, note })
  }
  const lastSets = last ? doneSets(last) : []

  const addSet = () => {
    const prev = sets[sets.length - 1] ?? lastSets[sets.length] ?? lastSets[lastSets.length - 1]
    save([...sets, prev ? { w: prev.w, r: prev.r } : { w: 0, r: 0 }])
  }

  const done = sets.some((s) => s.r > 0)

  return (
    <li className={`work g-${ex.group} ${done ? 'is-done' : ''}`}>
      <div className="work-head">
        <ExercisePhoto ex={ex} className="work-photo" />
        <div className="work-title">
          <span className="ex-name">{ex.name}</span>
          <span className="work-last">
            {last ? (
              <>
                <span className="muted">
                  {t.lastTime} · {fmtDate(parseDay(last.date), 'short')}
                </span>
                <SetLines sets={lastSets} />
              </>
            ) : (
              <span className="muted">{t.firstTime}</span>
            )}
          </span>
        </div>
      </div>

      {sets.length > 0 && (
        <ol className="set-rows">
          {sets.map((s, i) => (
            <SetRow
              key={`${i}/${sets.length}`}
              n={i + 1}
              s={s}
              onChange={(ns) => save(sets.map((x, j) => (j === i ? ns : x)))}
              onRemove={() => save(sets.filter((_, j) => j !== i))}
            />
          ))}
        </ol>
      )}

      <div className="work-actions">
        {sets.length === 0 && lastSets.length > 0 && (
          <button type="button" className="btn-chip" onClick={() => save(lastSets.map((s) => ({ ...s })))}>
            <Copy size={18} />
            {t.copyLast}
          </button>
        )}
        <button type="button" className="btn-chip" onClick={addSet}>
          <Plus size={18} weight="bold" />
          {t.addSet}
        </button>
        <button type="button" className="btn-chip" aria-pressed={noteOpen} onClick={() => setNoteOpen((v) => !v)}>
          <NotePencil size={18} />
          {t.note}
        </button>
      </div>

      {noteOpen && (
        <textarea
          className="note"
          rows={2}
          aria-label={t.note}
          placeholder={t.notePlaceholder}
          defaultValue={entry?.note ?? ''}
          onBlur={(e) => {
            if (e.target.value !== (entry?.note ?? '')) save(sets, e.target.value)
          }}
        />
      )}
    </li>
  )
}

function NumField({ value, label, onCommit, placeholder }: { value: number | undefined; label: string; onCommit: (v: number) => void; placeholder?: string }) {
  const [text, setText] = useState(value ? fmtKg(value) : '')
  return (
    <input
      className="num"
      type="text"
      inputMode="decimal"
      aria-label={label}
      placeholder={placeholder}
      value={text}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const v = e.target.value.replace(',', '.')
        if (!/^\d*\.?\d*$/.test(v)) return
        setText(v)
        onCommit(v === '' || v === '.' ? 0 : parseFloat(v))
      }}
    />
  )
}

function SetRow({ n, s, onChange, onRemove }: { n: number; s: SetEntry; onChange: (s: SetEntry) => void; onRemove: () => void }) {
  const { t } = useI18n()
  const [more, setMore] = useState(!!(s.rTo || s.assist))
  return (
    <li className="set-row">
      <span className="set-n">{n}</span>
      <span className="field">
        <NumField value={s.w} label={t.kg} placeholder={t.bw} onCommit={(w) => onChange({ ...s, w })} />
        <span className="unit">{t.kg}</span>
      </span>
      <span className="x">×</span>
      <span className="field">
        <NumField value={s.r} label={t.reps} onCommit={(r) => onChange({ ...s, r })} />
        <span className="unit">{t.reps}</span>
      </span>
      <button type="button" className="icon-btn small" aria-label={t.more} aria-pressed={more} onClick={() => setMore((v) => !v)}>
        <DotsThree size={24} weight="bold" />
      </button>
      {more && (
        <span className="set-extra">
          <span className="field">
            <span className="unit">{t.repsTo}</span>
            <NumField value={s.rTo} label={t.repsTo} onCommit={(rTo) => onChange({ ...s, rTo: rTo || undefined })} />
          </span>
          <span className="field">
            <span className="unit">+</span>
            <NumField value={s.assist} label={t.assist} onCommit={(a) => onChange({ ...s, assist: a || undefined })} />
            <span className="unit">{t.assist}</span>
          </span>
          <button type="button" className="icon-btn small" aria-label={t.removeSet} onClick={onRemove}>
            <X size={20} />
          </button>
        </span>
      )}
    </li>
  )
}

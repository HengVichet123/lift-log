import { Check, DotsThree, NotePencil, Plus, Trash, X } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { db, doneSets, workSets, type Entry, type SetEntry } from '../db'
import { useExercises, type Exercise } from '../exercises'
import { fmtClock, fmtKg, fmtReps, fmtVolume, volume } from '../format'
import { useI18n } from '../i18n'
import { rest } from '../rest'
import { back, go, useTick } from '../router'
import { ExercisePhoto } from '../components/ExercisePhoto'
import { RestBar } from '../components/RestBar'

/** Keep only ticked sets; drop exercises with nothing left. */
async function tidy(sessionId: number, editing: boolean) {
  const entries = await db.entries.where('sessionId').equals(sessionId).toArray()
  for (const e of entries) {
    // when editing a finished workout, typed-in sets count without ticking
    const sets = editing ? e.sets.filter((s) => s.r > 0).map((s) => ({ ...s, done: true })) : doneSets(e)
    if (sets.length === 0 && !e.note.trim()) await db.entries.delete(e.id!)
    else await db.entries.update(e.id!, { sets })
  }
}

export function Active({ sessionId }: { sessionId: number }) {
  const { t } = useI18n()
  const lookup = useExercises()
  const now = useTick(1000)
  const data = useLiveQuery(async () => {
    const session = await db.sessions.get(sessionId)
    if (!session) return null
    const type = await db.dayTypes.get(session.dayTypeId)
    const entries = (await db.entries.where('sessionId').equals(sessionId).toArray()).sort((a, b) => a.order - b.order)
    return { session, type, entries }
  }, [sessionId])

  if (data === undefined) return <main className="screen" />
  if (data === null) {
    go({ name: 'workout' }, true)
    return null
  }
  const { session, type, entries } = data
  const editing = !!session.finishedAt
  const all = entries.flatMap(workSets)

  const finish = async () => {
    const counts = (e: Entry) => (editing ? e.sets.some((s) => s.r > 0) : doneSets(e).length > 0)
    if (!entries.some(counts)) {
      if (!confirm(t.finishEmptyConfirm)) return
      await db.transaction('rw', db.entries, db.sessions, async () => {
        await db.entries.where('sessionId').equals(sessionId).delete()
        await db.sessions.delete(sessionId)
      })
      rest.stop()
      go({ name: 'workout' }, true)
      return
    }
    await db.transaction('rw', db.entries, db.sessions, async () => {
      await tidy(sessionId, editing)
      if (!editing) await db.sessions.update(sessionId, { finishedAt: Date.now() })
    })
    rest.stop()
    go({ name: 'summary', sessionId }, true)
  }

  return (
    <main className="screen screen-active">
      <header className="active-header">
        <button type="button" className="icon-btn" aria-label={t.back} onClick={() => back({ name: 'workout' })}>
          <X size={24} weight="bold" />
        </button>
        <div className="active-title">
          <span className="active-name">{type?.name ?? '?'}</span>
          <span className="active-stats">
            {!editing && <b>{fmtClock(now - session.startedAt)}</b>}
            <span>
              {fmtVolume(volume(all))} {t.kg}
            </span>
            <span>
              {all.length} {t.setsWord.toLowerCase()}
            </span>
          </span>
        </div>
        <button type="button" className="btn-finish" onClick={finish}>
          {editing ? t.done : t.finish}
        </button>
      </header>

      {editing && (
        <label className="date-edit">
          {t.dateLabel}
          <input
            type="date"
            value={session.date}
            onChange={(e) => {
              const d = e.target.value
              if (!d) return
              db.transaction('rw', db.sessions, db.entries, async () => {
                await db.sessions.update(sessionId, { date: d })
                await db.entries.where('sessionId').equals(sessionId).modify({ date: d })
              })
            }}
          />
        </label>
      )}

      <ul className="active-list">
        {entries.map((e) => {
          const ex = lookup(e.exerciseId)
          return ex ? <ExerciseCard key={e.id} ex={ex} entry={e} sessionDate={session.date} editing={editing} /> : null
        })}
      </ul>

      <button type="button" className="btn-quiet wide" onClick={() => go({ name: 'pick', target: { kind: 'session', id: sessionId } })}>
        <Plus size={20} weight="bold" />
        {t.addExercise}
      </button>

      <button
        type="button"
        className="btn-danger-quiet"
        onClick={async () => {
          if (!confirm(editing ? t.deleteWorkoutConfirm : t.cancelConfirm)) return
          await db.transaction('rw', db.entries, db.sessions, async () => {
            await db.entries.where('sessionId').equals(sessionId).delete()
            await db.sessions.delete(sessionId)
          })
          rest.stop()
          go({ name: 'workout' }, true)
        }}
      >
        <Trash size={20} />
        {editing ? t.deleteWorkout : t.cancelWorkout}
      </button>

      {!editing && <RestBar />}
    </main>
  )
}

function ExerciseCard({ ex, entry, sessionDate, editing }: { ex: Exercise; entry: Entry; sessionDate: string; editing: boolean }) {
  const { t } = useI18n()
  const [menu, setMenu] = useState(false)
  const [noteOpen, setNoteOpen] = useState(!!entry.note)

  // last earlier workout of this exercise: fills the Previous column
  const prev = useLiveQuery(async () => {
    const list = await db.entries.where('[exerciseId+date]').between([ex.id, ''], [ex.id, sessionDate], true, true).reverse().toArray()
    return list.find((e) => e.sessionId !== entry.sessionId && doneSets(e).length > 0) ?? null
  }, [ex.id, sessionDate, entry.sessionId])
  const prevSets = prev ? doneSets(prev) : []

  const save = (sets: SetEntry[], note = entry.note) => db.entries.update(entry.id!, { sets, note })
  const update = (i: number, patch: Partial<SetEntry>) => save(entry.sets.map((s, j) => (j === i ? { ...s, ...patch } : s)))

  // the hint a row shows: last time's matching set, else the row above
  const hint = (i: number): SetEntry | undefined => {
    const s = entry.sets[i]
    const sameKind = prevSets.filter((p) => !!p.warmup === !!s.warmup)
    const k = entry.sets.slice(0, i).filter((x) => !!x.warmup === !!s.warmup).length
    return sameKind[k] ?? entry.sets[i - 1]
  }

  const tick = (i: number) => {
    const s = entry.sets[i]
    if (s.done) {
      update(i, { done: false })
      return
    }
    const h = hint(i)
    const w = s.w || h?.w || 0
    const r = s.r || h?.r || 0
    if (r <= 0) return
    update(i, { w, r, rTo: s.rTo ?? h?.rTo, assist: s.assist ?? h?.assist, done: true })
    navigator.vibrate?.(20)
    if (!editing) rest.start()
  }

  let n = 0
  return (
    <li className={`ex-card g-${ex.group}`}>
      <div className="ex-card-head">
        <button type="button" className="ex-link" onClick={() => go({ name: 'exercise', id: ex.id })}>
          <ExercisePhoto ex={ex} className="avatar" />
          <span className="ex-name">{ex.name}</span>
        </button>
        <button type="button" className="icon-btn" aria-label={t.options} aria-expanded={menu} onClick={() => setMenu((v) => !v)}>
          <DotsThree size={26} weight="bold" />
        </button>
      </div>

      {menu && (
        <div className="ex-menu">
          <button type="button" className="btn-chip" onClick={() => save([{ w: 0, r: 0, warmup: true }, ...entry.sets])}>
            <Plus size={16} weight="bold" />
            {t.warmup}
          </button>
          <button type="button" className="btn-chip" aria-pressed={noteOpen} onClick={() => setNoteOpen((v) => !v)}>
            <NotePencil size={16} />
            {t.note}
          </button>
          <button type="button" className="btn-chip danger" onClick={() => db.entries.delete(entry.id!)}>
            <Trash size={16} />
            {t.removeExercise}
          </button>
        </div>
      )}

      {noteOpen && (
        <textarea
          className="note"
          rows={2}
          aria-label={t.note}
          placeholder={t.notePlaceholder}
          defaultValue={entry.note}
          onBlur={(e) => e.target.value !== entry.note && save(entry.sets, e.target.value)}
        />
      )}

      <div className="set-table" role="table">
        <div className="set-head" role="row">
          <span role="columnheader">{t.setCol}</span>
          <span role="columnheader">{t.previousCol}</span>
          <span role="columnheader">{t.kg}</span>
          <span role="columnheader">{t.reps}</span>
          <span role="columnheader" aria-label="Done">
            <Check size={16} weight="bold" />
          </span>
        </div>
        {entry.sets.map((s, i) => {
          if (!s.warmup) n++
          const h = hint(i)
          const p = prevSets.filter((x) => !!x.warmup === !!s.warmup)[entry.sets.slice(0, i).filter((x) => !!x.warmup === !!s.warmup).length]
          return (
            <SetRow
              key={`${entry.id}-${i}-${entry.sets.length}`}
              label={s.warmup ? t.warmupShort : String(n)}
              s={s}
              prev={p}
              hint={h}
              onPrev={() => p && update(i, { w: p.w, r: p.r, rTo: p.rTo, assist: p.assist })}
              onChange={(patch) => update(i, patch)}
              onTick={() => tick(i)}
              onDelete={() => save(entry.sets.filter((_, j) => j !== i))}
            />
          )
        })}
      </div>

      <button
        type="button"
        className="add-set"
        onClick={() => {
          const last = entry.sets[entry.sets.length - 1]
          save([...entry.sets, { w: last?.done ? last.w : 0, r: 0 }])
        }}
      >
        <Plus size={18} weight="bold" />
        {t.addSet}
      </button>
    </li>
  )
}

interface RowProps {
  label: string
  s: SetEntry
  prev?: SetEntry
  hint?: SetEntry
  onPrev: () => void
  onChange: (patch: Partial<SetEntry>) => void
  onTick: () => void
  onDelete: () => void
}

function SetRow({ label, s, prev, hint, onPrev, onChange, onTick, onDelete }: RowProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(!!(s.rTo || s.assist))
  return (
    <div className={`set-row ${s.done ? 'is-done' : ''} ${s.warmup ? 'is-warmup' : ''}`} role="row">
      <button type="button" className="set-label" aria-expanded={open} aria-label={`${t.setCol} ${label}: ${t.options}`} onClick={() => setOpen((v) => !v)}>
        {label}
      </button>
      <button type="button" className="set-prev" onClick={onPrev} disabled={!prev}>
        {prev ? `${prev.w > 0 ? fmtKg(prev.w) : t.bw} × ${fmtReps(prev)}` : '-'}
      </button>
      <Num value={s.w} hint={hint && hint.w > 0 ? fmtKg(hint.w) : ''} label={t.kg} onCommit={(w) => onChange({ w })} />
      <Num value={s.r} hint={hint ? fmtKg(hint.r) : ''} label={t.reps} onCommit={(r) => onChange({ r })} />
      <button type="button" className="tick" aria-pressed={!!s.done} aria-label={t.done} onClick={onTick}>
        <Check size={20} weight="bold" />
      </button>
      {open && (
        <div className="set-extra">
          <label className="mini">
            {t.range}
            <Num value={s.rTo ?? 0} hint="" label={t.range} onCommit={(rTo) => onChange({ rTo: rTo || undefined })} />
          </label>
          <label className="mini">
            {t.assist} +
            <Num value={s.assist ?? 0} hint="" label={t.assist} onCommit={(a) => onChange({ assist: a || undefined })} />
          </label>
          <button type="button" className="btn-chip" aria-pressed={!!s.warmup} onClick={() => onChange({ warmup: !s.warmup })}>
            {t.warmup}
          </button>
          <button type="button" className="icon-btn small danger" aria-label={t.deleteSet} onClick={onDelete}>
            <Trash size={18} />
          </button>
        </div>
      )}
    </div>
  )
}

function Num({ value, hint, label, onCommit }: { value: number; hint: string; label: string; onCommit: (v: number) => void }) {
  const [text, setText] = useState(value ? fmtKg(value) : '')
  // follow changes made elsewhere (tick, tap on Previous)
  useEffect(() => {
    setText((cur) => ((parseFloat(cur) || 0) === value ? cur : value ? fmtKg(value) : ''))
  }, [value])
  return (
    <input
      className="num"
      type="text"
      inputMode="decimal"
      aria-label={label}
      placeholder={hint}
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

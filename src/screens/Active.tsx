import { Copy, DotsThree, NotePencil, Plus, Trash, X } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { db, dayKey, doneSets, parseDay, workSets, type Entry, type SetEntry } from '../db'
import { useExercises, type Exercise } from '../exercises'
import { fmtKg, fmtReps, fmtVolume, volume } from '../format'
import { useI18n } from '../i18n'
import { go } from '../router'
import { ExercisePhoto } from '../components/ExercisePhoto'

/** Keep only sets with reps; drop exercises with nothing left. Returns false if the workout is empty. */
async function tidy(sessionId: number): Promise<boolean> {
  const entries = await db.entries.where('sessionId').equals(sessionId).toArray()
  let any = false
  for (const e of entries) {
    const sets = e.sets.filter((s) => s.r > 0)
    if (sets.length === 0 && !e.note.trim()) await db.entries.delete(e.id!)
    else {
      any = true
      if (sets.length !== e.sets.length) await db.entries.update(e.id!, { sets })
    }
  }
  return any
}

async function removeSession(id: number) {
  await db.transaction('rw', db.entries, db.sessions, async () => {
    await db.entries.where('sessionId').equals(id).delete()
    await db.sessions.delete(id)
  })
}

/** Fill in or change one day's workout. Sets with reps count; nothing to tick. */
export function Active({ sessionId }: { sessionId: number }) {
  const { t, date } = useI18n()
  const lookup = useExercises()
  const data = useLiveQuery(async () => {
    const session = await db.sessions.get(sessionId)
    if (!session) return null
    const type = await db.dayTypes.get(session.dayTypeId)
    const entries = (await db.entries.where('sessionId').equals(sessionId).toArray()).sort((a, b) => a.order - b.order)
    return { session, type, entries }
  }, [sessionId])

  // the workout was deleted (or the link is old): go home
  useEffect(() => {
    if (data === null) go({ name: 'history' }, true)
  }, [data])

  if (!data) return <main className="screen" />
  const { session, type, entries } = data
  const all = entries.flatMap(workSets)

  const close = async () => {
    // an empty day (opened by mistake) is not kept
    if (!(await db.transaction('rw', db.entries, db.sessions, () => tidy(sessionId)))) await removeSession(sessionId)
    go({ name: 'history', day: session.date }, true)
  }

  return (
    <main className="screen screen-active">
      <header className="active-header">
        <button type="button" className="icon-btn" aria-label={t.back} onClick={close}>
          <X size={24} weight="bold" />
        </button>
        <div className="active-title">
          <span className="active-name">{type?.name ?? t.workout}</span>
          <span className="active-stats">
            <span>{date(parseDay(session.date), 'medium')}</span>
            <span>
              {fmtVolume(volume(all))} {t.kg}
            </span>
          </span>
        </div>
        <button type="button" className="btn-finish" onClick={close}>
          {t.done}
        </button>
      </header>

      <label className="date-edit">
        {t.dateLabel}
        <input
          type="date"
          value={session.date}
          max={dayKey()}
          onChange={(e) => {
            const d = e.target.value
            if (!d || d > dayKey()) return // no workouts in the future
            db.transaction('rw', db.sessions, db.entries, async () => {
              await db.sessions.update(sessionId, { date: d })
              await db.entries.where('sessionId').equals(sessionId).modify({ date: d })
            })
          }}
        />
      </label>

      <ul className="active-list">
        {entries.map((e) => {
          const ex = lookup(e.exerciseId)
          return ex ? <ExerciseCard key={e.id} ex={ex} entry={e} sessionDate={session.date} /> : null
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
          if (!confirm(t.deleteWorkoutConfirm)) return
          await removeSession(sessionId)
          go({ name: 'history', day: session.date }, true)
        }}
      >
        <Trash size={20} />
        {t.deleteWorkout}
      </button>
    </main>
  )
}

function ExerciseCard({ ex, entry, sessionDate }: { ex: Exercise; entry: Entry; sessionDate: string }) {
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
              onDelete={() => save(entry.sets.filter((_, j) => j !== i))}
            />
          )
        })}
      </div>

      {prevSets.length > 0 && !entry.sets.some((s) => s.r > 0) && (
        <button type="button" className="btn-chip copy-last" onClick={() => save(prevSets.map((s) => ({ w: s.w, r: s.r, rTo: s.rTo, assist: s.assist, warmup: s.warmup })))}>
          <Copy size={16} />
          {t.copyLast}
        </button>
      )}

      <button
        type="button"
        className="add-set"
        onClick={() => {
          const last = entry.sets[entry.sets.length - 1]
          save([...entry.sets, { w: last?.w ?? 0, r: 0 }])
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
  onDelete: () => void
}

function SetRow({ label, s, prev, hint, onPrev, onChange, onDelete }: RowProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(!!(s.rTo || s.assist))
  return (
    <div className={`set-row ${s.r > 0 ? 'is-done' : ''} ${s.warmup ? 'is-warmup' : ''}`} role="row">
      <button type="button" className="set-label" aria-expanded={open} aria-label={`${t.setCol} ${label}: ${t.options}`} onClick={() => setOpen((v) => !v)}>
        {label}
      </button>
      <button type="button" className="set-prev" onClick={onPrev} disabled={!prev}>
        {prev ? `${prev.w > 0 ? fmtKg(prev.w) : t.bw} × ${fmtReps(prev)}` : '-'}
      </button>
      <Num value={s.w} hint={hint && hint.w > 0 ? fmtKg(hint.w) : ''} label={t.kg} onCommit={(w) => onChange({ w })} />
      <Num value={s.r} hint={hint ? fmtKg(hint.r) : ''} label={t.reps} onCommit={(r) => onChange({ r })} />
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

interface NumProps {
  value: number
  hint: string
  label: string
  onCommit: (v: number) => void
  inputRef?: React.Ref<HTMLInputElement>
}

function Num({ value, hint, label, onCommit, inputRef }: NumProps) {
  const [text, setText] = useState(value ? fmtKg(value) : '')
  // follow changes made elsewhere (tap on Previous, Same as last time)
  useEffect(() => {
    setText((cur) => ((parseFloat(cur) || 0) === value ? cur : value ? fmtKg(value) : ''))
  }, [value])
  return (
    <input
      ref={inputRef}
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

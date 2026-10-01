import { ArrowDown, ArrowUp, CaretRight, Database, PencilSimple, Plus, Trash } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db, newId, type DayType } from '../db'
import { useExercises } from '../exercises'
import { clearSample, hasSample, loadSample } from '../sample'
import { useI18n } from '../i18n'
import { back, go } from '../router'
import { ExercisePhoto } from '../components/ExercisePhoto'
import { LangSwitch } from '../components/LangSwitch'
import { ScreenHeader } from '../components/ScreenHeader'

async function moveDay(list: DayType[], i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 0 || j >= list.length) return
  await db.transaction('rw', db.dayTypes, async () => {
    await db.dayTypes.update(list[i].id, { order: list[j].order })
    await db.dayTypes.update(list[j].id, { order: list[i].order })
  })
}

export function Program() {
  const { t } = useI18n()
  const types = useLiveQuery(() => db.dayTypes.orderBy('order').toArray(), [])
  const [name, setName] = useState('')
  const sample = useLiveQuery(hasSample, [])

  const add = async () => {
    const n = name.trim()
    if (!n) return
    const id = newId('d')
    const order = (types?.reduce((m, x) => Math.max(m, x.order), -1) ?? -1) + 1
    await db.dayTypes.add({ id, name: n, order, exerciseIds: [] })
    setName('')
    go({ name: 'programDay', typeId: id })
  }

  return (
    <main className="screen">
      <ScreenHeader title={t.program} right={<LangSwitch />} />

      <ul className="prog-list">
        {(types ?? []).map((dt, i, list) => (
          <li key={dt.id} className="prog-row">
            <button type="button" className="prog-open" onClick={() => go({ name: 'programDay', typeId: dt.id })}>
              <span className="daytype-name">{dt.name}</span>
              <span className="muted">{t.exercisesCount(dt.exerciseIds.length)}</span>
              <CaretRight size={22} weight="bold" className="daytype-go" />
            </button>
            <button type="button" className="icon-btn" aria-label={t.moveUp} disabled={i === 0} onClick={() => moveDay(list, i, -1)}>
              <ArrowUp size={22} />
            </button>
            <button type="button" className="icon-btn" aria-label={t.moveDown} disabled={i === list.length - 1} onClick={() => moveDay(list, i, 1)}>
              <ArrowDown size={22} />
            </button>
          </li>
        ))}
      </ul>

      <form
        className="inline-form"
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        <label className="field-label" htmlFor="new-day">
          {t.newDay}
        </label>
        <div className="inline-row">
          <input id="new-day" className="text-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Chest, Arms, Upper..." />
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
              go({ name: 'data' })
            }}
          >
            <Database size={20} />
            {t.sampleLoad}
          </button>
        )}
      </section>
    </main>
  )
}

export function ProgramDay({ typeId }: { typeId: string }) {
  const { t } = useI18n()
  const lookup = useExercises()
  const dt = useLiveQuery(() => db.dayTypes.get(typeId), [typeId])
  const [renaming, setRenaming] = useState(false)

  if (!dt) return <main className="screen" />

  const setIds = (ids: string[]) => db.dayTypes.update(typeId, { exerciseIds: ids })
  const move = (i: number, dir: -1 | 1) => {
    const ids = [...dt.exerciseIds]
    const j = i + dir
    if (j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    setIds(ids)
  }

  return (
    <main className="screen">
      <ScreenHeader
        title={dt.name}
        onBack={() => back({ name: 'program' })}
        right={
          <button type="button" className="icon-btn" aria-label={t.rename} onClick={() => setRenaming((v) => !v)}>
            <PencilSimple size={24} />
          </button>
        }
      />

      {renaming && (
        <div className="inline-form">
          <label className="field-label" htmlFor="day-name">
            {t.dayName}
          </label>
          <input
            id="day-name"
            className="text-input"
            defaultValue={dt.name}
            autoFocus
            onBlur={(e) => {
              const n = e.target.value.trim()
              if (n && n !== dt.name) db.dayTypes.update(typeId, { name: n })
              setRenaming(false)
            }}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          />
        </div>
      )}

      <ul className="ex-list">
        {dt.exerciseIds.map((id, i) => {
          const ex = lookup(id)
          if (!ex) return null
          return (
            <li key={id} className={`prog-ex g-${ex.group}`}>
              <ExercisePhoto ex={ex} className="thumb" />
              <span className="ex-name">{ex.name}</span>
              <span className="prog-ex-actions">
                <button type="button" className="icon-btn small" aria-label={t.moveUp} disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp size={20} />
                </button>
                <button type="button" className="icon-btn small" aria-label={t.moveDown} disabled={i === dt.exerciseIds.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown size={20} />
                </button>
                <button type="button" className="icon-btn small" aria-label={t.remove} onClick={() => setIds(dt.exerciseIds.filter((x) => x !== id))}>
                  <Trash size={20} />
                </button>
              </span>
            </li>
          )
        })}
      </ul>

      <button type="button" className="btn-primary" onClick={() => go({ name: 'pick', target: { kind: 'type', id: typeId } })}>
        <Plus size={24} weight="bold" />
        {t.addExercise}
      </button>

      <button
        type="button"
        className="btn-danger-quiet"
        onClick={async () => {
          if (!confirm(t.deleteDayConfirm)) return
          await db.dayTypes.delete(typeId)
          go({ name: 'program' }, true)
        }}
      >
        <Trash size={20} />
        {t.deleteDay}
      </button>
    </main>
  )
}

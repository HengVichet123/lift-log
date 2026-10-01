import { CaretRight, Plus, Trash } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db, newId } from '../db'
import { useExercises } from '../exercises'
import { useI18n } from '../i18n'
import { go } from '../router'
import { clearSample, hasSample, loadSample } from '../sample'
import { ExercisePhoto } from '../components/ExercisePhoto'
import { HeaderTools } from '../components/HeaderTools'
import { ScreenHeader } from '../components/ScreenHeader'

/** Your routines (Push, Pull, Legs ...): tap one to change its exercises. */
export function Routines() {
  const { t } = useI18n()
  const lookup = useExercises()
  const types = useLiveQuery(() => db.dayTypes.orderBy('order').toArray(), [])
  const sample = useLiveQuery(hasSample, [])
  const [name, setName] = useState('')

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
      <ScreenHeader title={t.routines} right={<HeaderTools />} />

      <ul className="routine-list">
        {(types ?? []).map((dt) => {
          const exs = dt.exerciseIds.map(lookup).filter((e) => e !== undefined)
          return (
            <li key={dt.id}>
              <button type="button" className="routine" onClick={() => go({ name: 'routine', typeId: dt.id })}>
                <span className="routine-head">
                  <span className="routine-name">{dt.name}</span>
                  <CaretRight size={22} weight="bold" className="muted" />
                </span>
                <span className="routine-thumbs">
                  {exs.slice(0, 6).map((ex) => (
                    <ExercisePhoto key={ex.id} ex={ex} className="avatar" />
                  ))}
                </span>
                <span className="routine-list-names">{exs.length ? exs.map((e) => e.name).join(', ') : t.exercisesCount(0)}</span>
              </button>
            </li>
          )
        })}
      </ul>

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

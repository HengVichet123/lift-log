import { ArrowDown, ArrowUp, Plus, Trash } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useExercises } from '../exercises'
import { useI18n } from '../i18n'
import { back, go } from '../router'
import { ExercisePhoto } from '../components/ExercisePhoto'
import { ScreenHeader } from '../components/ScreenHeader'

export function Routine({ typeId }: { typeId: string }) {
  const { t } = useI18n()
  const lookup = useExercises()
  const dt = useLiveQuery(() => db.dayTypes.get(typeId), [typeId])
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
      <ScreenHeader title={t.edit} onBack={() => back({ name: 'workout' })} />

      <div className="inline-form">
        <label className="field-label" htmlFor="routine-name">
          {t.routineName}
        </label>
        <input
          id="routine-name"
          key={dt.name}
          className="text-input"
          defaultValue={dt.name}
          onBlur={(e) => {
            const n = e.target.value.trim()
            if (n && n !== dt.name) db.dayTypes.update(typeId, { name: n })
          }}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
      </div>

      <ul className="plain-list routine-edit">
        {dt.exerciseIds.map((id, i) => {
          const ex = lookup(id)
          if (!ex) return null
          return (
            <li key={id} className="re-row">
              <ExercisePhoto ex={ex} className="avatar" />
              <span className="ex-name">{ex.name}</span>
              <span className="re-actions">
                <button type="button" className="icon-btn small" aria-label={t.moveUp} disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp size={20} />
                </button>
                <button type="button" className="icon-btn small" aria-label={t.moveDown} disabled={i === dt.exerciseIds.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown size={20} />
                </button>
                <button type="button" className="icon-btn small danger" aria-label={t.remove} onClick={() => setIds(dt.exerciseIds.filter((x) => x !== id))}>
                  <Trash size={20} />
                </button>
              </span>
            </li>
          )
        })}
      </ul>

      <button type="button" className="btn-quiet wide" onClick={() => go({ name: 'pick', target: { kind: 'type', id: typeId } })}>
        <Plus size={20} weight="bold" />
        {t.addExercise}
      </button>

      <button
        type="button"
        className="btn-danger-quiet"
        onClick={async () => {
          if (!confirm(t.deleteRoutineConfirm)) return
          await db.dayTypes.delete(typeId)
          go({ name: 'workout' }, true)
        }}
      >
        <Trash size={20} />
        {t.deleteRoutine}
      </button>
    </main>
  )
}

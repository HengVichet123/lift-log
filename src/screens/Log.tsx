import { Check, Trash, Trophy } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { db, dayKey, parseDay, type WorkoutSet } from '../db'
import { defaultWeight, getExercise } from '../exercises'
import { useI18n } from '../i18n'
import { back } from '../router'
import { bestSet, byReps, fmtWeight } from '../stats'
import { ExercisePhoto } from '../components/ExercisePhoto'
import { ScreenHeader } from '../components/ScreenHeader'
import { SetChip } from '../components/SetChip'
import { Stepper } from '../components/Stepper'

export function Log({ id }: { id: string }) {
  const { t, date } = useI18n()
  const ex = getExercise(id)
  const today = dayKey()
  const all = useLiveQuery(() => db.sets.where('exerciseId').equals(id).sortBy('ts'), [id])

  const [weight, setWeight] = useState<number | null>(null)
  const [reps, setReps] = useState<number | null>(null)
  const [justBest, setJustBest] = useState(false)

  // start from the last set ever done, so a repeat set is one tap
  useEffect(() => {
    if (!all || !ex || weight !== null) return
    const last = all[all.length - 1]
    setWeight(last ? last.weight : defaultWeight(ex))
    setReps(last ? last.reps : 10)
  }, [all, ex, weight])

  if (!ex) {
    return (
      <main className="screen">
        <ScreenHeader title="?" onBack={() => back({ name: 'today' })} />
      </main>
    )
  }

  const todaySets = (all ?? []).filter((s) => s.day === today)
  const before = (all ?? []).filter((s) => s.day < today)
  const lastDay = before.length ? before[before.length - 1].day : null
  const lastSets = lastDay ? before.filter((s) => s.day === lastDay) : []

  async function save() {
    if (weight === null || reps === null || reps <= 0) return
    const prev = all ?? []
    const set: WorkoutSet = { exerciseId: id, day: today, ts: Date.now(), weight, reps }
    const prevBest = bestSet(prev)
    const isBest =
      prev.length > 0 &&
      !!prevBest &&
      (byReps([...prev, set]) ? reps > prevBest.reps : weight > prevBest.weight || (weight === prevBest.weight && reps > prevBest.reps))
    await db.sets.add(set)
    navigator.vibrate?.(isBest ? [30, 60, 30] : 25)
    setJustBest(isBest)
  }

  const dateText = (key: string) => date(parseDay(key), 'short')

  return (
    <main className="screen screen-log">
      <ScreenHeader title={<span className="title-ex">{ex.name}</span>} onBack={() => back({ name: 'today' })} />

      <div className={`log-photo g-${ex.group}`}>
        <ExercisePhoto ex={ex} moving />
        <span className="group-tag">{t.groups[ex.group]}</span>
      </div>

      <div className="last">
        <span className="last-label">{lastDay ? `${t.lastTime} · ${dateText(lastDay)}` : t.firstTime}</span>
        <span className="chips">
          {lastSets.map((s) => (
            <SetChip key={s.id} s={s} />
          ))}
        </span>
      </div>

      {weight !== null && reps !== null && (
        <div className="steppers">
          <Stepper label={t.kg} unit={t.kg} value={weight} step={2.5} format={fmtWeight} zeroText={t.body} onChange={setWeight} />
          <Stepper label={t.reps} unit={t.reps} value={reps} step={1} min={1} onChange={setReps} />
        </div>
      )}

      <button type="button" className="btn-primary btn-save" onClick={save}>
        <Check size={30} weight="bold" />
        {t.saveSet}
      </button>

      {justBest && (
        <p className="best-banner" role="status">
          <Trophy size={26} weight="fill" />
          {t.newBest}
        </p>
      )}

      {todaySets.length > 0 && (
        <section>
          <h2 className="section-title">{t.todaySets}</h2>
          <ol className="set-list">
            {todaySets.map((s, i) => (
              <li key={s.id} className="set-row">
                <span className="set-n">{i + 1}</span>
                <SetChip s={s} />
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={t.deleteSet}
                  onClick={() => {
                    if (s.id !== undefined) db.sets.delete(s.id)
                    setJustBest(false)
                  }}
                >
                  <Trash size={22} />
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  )
}

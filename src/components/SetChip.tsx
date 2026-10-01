import type { WorkoutSet } from '../db'
import { useI18n } from '../i18n'
import { fmtWeight } from '../stats'

export function SetChip({ s, best = false }: { s: WorkoutSet; best?: boolean }) {
  const { t } = useI18n()
  return (
    <span className={`chip ${best ? 'chip-best' : ''}`}>
      {s.weight > 0 ? (
        <>
          <b>{fmtWeight(s.weight)}</b>
          <span className="chip-x">×</span>
          <b>{s.reps}</b>
        </>
      ) : (
        <>
          <b>{s.reps}</b>
          <span className="chip-unit">{t.reps}</span>
        </>
      )}
    </span>
  )
}

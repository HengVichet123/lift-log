import type { SetEntry } from '../db'
import { fmtKg, groupSets } from '../format'
import { useI18n } from '../i18n'

/** Sets written the way they are in a notebook: "69 × 13-14, 11-12". */
export function SetLines({ sets, className = '' }: { sets: SetEntry[]; className?: string }) {
  const { t } = useI18n()
  return (
    <span className={`set-lines ${className}`}>
      {groupSets(sets).map((g, i) => (
        <span key={i} className={`set-line ${g.warmup ? 'is-warmup' : ''}`}>
          {g.warmup && <span className="w-tag">{t.warmupShort}</span>}
          <b>{g.w > 0 ? fmtKg(g.w) : t.bw}</b>
          <span className="x">×</span>
          {g.reps.join(', ')}
        </span>
      ))}
    </span>
  )
}

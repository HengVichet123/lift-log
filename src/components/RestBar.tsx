import { useEffect, useRef } from 'react'
import { fmtClock } from '../format'
import { useI18n } from '../i18n'
import { rest, useRest } from '../rest'
import { useTick } from '../router'

/** Countdown docked at the bottom of the workout after a set is ticked. */
export function RestBar() {
  const { t } = useI18n()
  const { endsAt, total } = useRest()
  const now = useTick(250)
  const buzzed = useRef<number | null>(null)
  const left = endsAt ? endsAt - now : 0

  useEffect(() => {
    if (endsAt && left <= 0 && buzzed.current !== endsAt) {
      buzzed.current = endsAt
      navigator.vibrate?.([200, 100, 200])
      rest.stop()
    }
  }, [endsAt, left])

  if (!endsAt || left <= 0) return null
  const pct = Math.min(100, (left / (total * 1000)) * 100)
  return (
    <div className="restbar" role="timer" aria-live="off">
      <div className="restbar-fill" style={{ transform: `scaleX(${pct / 100})` }} />
      <button type="button" className="rest-btn" onClick={() => rest.add(-15)}>
        −15
      </button>
      <span className="rest-time">
        <small>{t.rest}</small>
        {fmtClock(left)}
      </span>
      <button type="button" className="rest-btn" onClick={() => rest.add(15)}>
        +15
      </button>
      <button type="button" className="rest-btn skip" onClick={() => rest.stop()}>
        {t.skip}
      </button>
    </div>
  )
}

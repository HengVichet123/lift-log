import { Minus, Plus } from '@phosphor-icons/react'
import { useState } from 'react'

interface Props {
  value: number
  step: number
  min?: number
  unit: string
  label: string
  format?: (v: number) => string
  /** shown instead of the number when value is 0 (e.g. bodyweight) */
  zeroText?: string
  onChange: (v: number) => void
}

export function Stepper({ value, step, min = 0, unit, label, format = String, zeroText, onChange }: Props) {
  const [editing, setEditing] = useState(false)
  const set = (v: number) => onChange(Math.max(min, Math.round(v * 100) / 100))

  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" className="step-btn" aria-label={`${label} -${step}`} onClick={() => set(value - step)} disabled={value <= min}>
        <Minus size={30} weight="bold" />
      </button>
      <div className="step-value">
        {editing ? (
          <input
            className="step-input"
            type="number"
            inputMode="decimal"
            autoFocus
            defaultValue={value || ''}
            aria-label={label}
            onBlur={(e) => {
              const v = parseFloat(e.target.value)
              if (!Number.isNaN(v)) set(v)
              setEditing(false)
            }}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          />
        ) : (
          <button type="button" className="step-number" onClick={() => setEditing(true)} aria-label={`${label}: ${value}`}>
            {value === 0 && zeroText ? <span className="step-zero">{zeroText}</span> : format(value)}
          </button>
        )}
        <span className="step-unit">{unit}</span>
      </div>
      <button type="button" className="step-btn" aria-label={`${label} +${step}`} onClick={() => set(value + step)}>
        <Plus size={30} weight="bold" />
      </button>
    </div>
  )
}

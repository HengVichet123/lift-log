import { Barbell } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { photoUrl, type Exercise } from '../exercises'

interface Props {
  ex: Exercise
  /** Alternate start and end photos to show the movement. */
  moving?: boolean
  className?: string
}

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function ExercisePhoto({ ex, moving = false, className = '' }: Props) {
  const [frame, setFrame] = useState(0)
  const animate = moving && ex.frames > 1

  useEffect(() => {
    if (!animate || reduceMotion()) return
    const t = setInterval(() => setFrame((f) => 1 - f), 900)
    return () => clearInterval(t)
  }, [animate])

  if (ex.frames === 0) {
    // the user's own exercise: no photo, so show its body-part colour
    return (
      <div className={`photo photo-none g-${ex.group} ${className}`} role="img" aria-label={ex.name}>
        <Barbell size={32} weight="duotone" />
      </div>
    )
  }
  if (!animate) {
    return <img className={`photo ${className}`} src={photoUrl(ex, 0)} alt={ex.name} loading="lazy" decoding="async" />
  }
  // both frames stay mounted so the switch never flashes while loading
  return (
    <div className={`photo photo-stack ${className}`} role="img" aria-label={ex.name}>
      <img src={photoUrl(ex, 0)} alt="" />
      <img src={photoUrl(ex, 1)} alt="" className={frame === 1 ? 'on' : ''} />
    </div>
  )
}

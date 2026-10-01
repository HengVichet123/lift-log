import { Trash } from '@phosphor-icons/react'
import { useRef, useState, type ReactNode } from 'react'

const W = 96 // width of the revealed Delete button

interface Drag {
  x: number
  y: number
  base: number
  horizontal: boolean
}

/** Swipe left to reveal Delete (like a phone's mail app). Vertical scrolling still works. */
export function SwipeRow({ children, onDelete, label }: { children: ReactNode; onDelete: () => void; label: string }) {
  const [x, setX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const drag = useRef<Drag | null>(null)
  const moved = useRef(false)

  return (
    <div className="swipe">
      <button type="button" className="swipe-action" onClick={onDelete} tabIndex={x < 0 ? 0 : -1} aria-hidden={x === 0}>
        <Trash size={22} />
        <span>{label}</span>
      </button>
      <div
        className={`swipe-content ${dragging ? 'dragging' : ''}`}
        style={{ transform: `translateX(${x}px)` }}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, base: x, horizontal: false }
          moved.current = false
        }}
        onPointerMove={(e) => {
          const d = drag.current
          if (!d) return
          const dx = e.clientX - d.x
          const dy = e.clientY - d.y
          if (!d.horizontal) {
            if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
              drag.current = null // a scroll, not a swipe
              return
            }
            if (Math.abs(dx) < 8) return
            d.horizontal = true
            setDragging(true)
          }
          moved.current = true
          setX(Math.min(0, Math.max(-W * 1.3, d.base + dx)))
        }}
        onPointerUp={() => {
          if (drag.current?.horizontal) setX((v) => (v < -W / 2 ? -W : 0))
          drag.current = null
          setDragging(false)
        }}
        onPointerCancel={() => {
          drag.current = null
          setDragging(false)
          setX((v) => (v < -W / 2 ? -W : 0))
        }}
        onClickCapture={(e) => {
          // a swipe is not a tap; a tap on an open row just closes it
          if (moved.current || x !== 0) {
            e.stopPropagation()
            e.preventDefault()
            if (!moved.current) setX(0)
          }
          moved.current = false
        }}
      >
        {children}
      </div>
    </div>
  )
}

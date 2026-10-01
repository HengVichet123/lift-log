/** Tiny trend line of the heaviest set per workout. */
export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null
  const W = 96
  const H = 28
  let lo = Math.min(...values)
  let hi = Math.max(...values)
  if (lo === hi) {
    lo -= 1
    hi += 1
  }
  const pts = values.map((v, i) => `${((i * (W - 4)) / (values.length - 1) + 2).toFixed(1)},${(H - 3 - ((v - lo) / (hi - lo)) * (H - 6)).toFixed(1)}`)
  const [lx, ly] = pts[pts.length - 1].split(',')
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <polyline points={pts.join(' ')} />
      <circle cx={lx} cy={ly} r={3} />
    </svg>
  )
}

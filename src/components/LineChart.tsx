import { fmtKg } from '../format'

export interface Point {
  label: string
  value: number
}

/** One-series SVG line chart; values labelled at the first, last and best points. */
export function LineChart({ points, unit }: { points: Point[]; unit: string }) {
  const W = 340
  const H = 190
  const pad = { l: 14, r: 14, t: 28, b: 28 }
  const vals = points.map((p) => p.value)
  let lo = Math.min(...vals)
  let hi = Math.max(...vals)
  if (lo === hi) {
    lo -= 1
    hi += 1
  }
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(1, points.length - 1)
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b)
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const bestI = vals.lastIndexOf(Math.max(...vals))
  const labelled = new Set([0, points.length - 1, bestI])
  const anchor = (i: number) => (i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle')

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={points.map((p) => `${p.label}: ${fmtKg(p.value)} ${unit}`).join(', ')}>
      <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} className="chart-axis" />
      <path d={`${path} L${x(points.length - 1)},${H - pad.b} L${x(0)},${H - pad.b} Z`} className="chart-fill" />
      <path d={path} className="chart-line" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.value)} r={i === bestI ? 6 : 4} className={i === bestI ? 'chart-dot best' : 'chart-dot'} />
          {labelled.has(i) && (
            <text x={x(i)} y={y(p.value) - 12} className="chart-val" textAnchor={anchor(i)}>
              {fmtKg(p.value)}
            </text>
          )}
        </g>
      ))}
      <text x={pad.l} y={H - 8} className="chart-date">{points[0].label}</text>
      <text x={W - pad.r} y={H - 8} className="chart-date" textAnchor="end">{points[points.length - 1].label}</text>
    </svg>
  )
}

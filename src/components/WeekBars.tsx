/** Workouts per week for the last N weeks, newest on the right. */
export function WeekBars({ counts, labels }: { counts: number[]; labels: string[] }) {
  const W = 340
  const H = 120
  const max = Math.max(3, ...counts)
  const bw = W / counts.length
  return (
    <svg className="bars" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={counts.map((c, i) => `${labels[i]}: ${c}`).join(', ')}>
      {counts.map((c, i) => {
        const h = (c / max) * (H - 34)
        return (
          <g key={i}>
            <rect x={i * bw + bw * 0.18} y={H - 20 - h} width={bw * 0.64} height={Math.max(h, c ? 0 : 2)} rx={3} className={i === counts.length - 1 ? 'bar now' : 'bar'} />
            {c > 0 && (
              <text x={i * bw + bw / 2} y={H - 26 - h} textAnchor="middle" className="bar-val">
                {c}
              </text>
            )}
          </g>
        )
      })}
      <text x={0} y={H - 4} className="chart-date">{labels[0]}</text>
      <text x={W} y={H - 4} className="chart-date" textAnchor="end">{labels[labels.length - 1]}</text>
    </svg>
  )
}

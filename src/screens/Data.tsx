import { Note, Trophy } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef } from 'react'
import { db, doneSets, parseDay, type Entry } from '../db'
import { fmtKg, topSet } from '../format'
import { useExercises, type Exercise } from '../exercises'
import { useI18n } from '../i18n'
import { go } from '../router'
import { ExercisePhoto } from '../components/ExercisePhoto'
import { LangSwitch } from '../components/LangSwitch'
import { ScreenHeader } from '../components/ScreenHeader'
import { SetLines } from '../components/SetLines'
import { Sparkline } from '../components/Sparkline'

export function Data({ typeId }: { typeId?: string }) {
  const { t } = useI18n()
  const lookup = useExercises()
  const types = useLiveQuery(() => db.dayTypes.orderBy('order').toArray(), [])
  const current = typeId ?? types?.[0]?.id

  const rows = useLiveQuery(async () => {
    if (!current) return []
    const type = await db.dayTypes.get(current)
    const sessionIds = (await db.sessions.where('dayTypeId').equals(current).primaryKeys()) as number[]
    const entries = (await db.entries.where('sessionId').anyOf(sessionIds).toArray()).filter((e) => doneSets(e).length > 0 || e.note)
    entries.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.sessionId - b.sessionId))
    const ids = [...(type?.exerciseIds ?? [])]
    for (const e of entries) if (!ids.includes(e.exerciseId)) ids.push(e.exerciseId)
    return ids.map((id) => ({ id, entries: entries.filter((e) => e.exerciseId === id) }))
  }, [current])

  return (
    <main className="screen">
      <ScreenHeader title={t.data} right={<LangSwitch />} />

      <nav className="type-tabs" aria-label={t.program}>
        {(types ?? []).map((dt) => (
          <button type="button" key={dt.id} aria-pressed={dt.id === current} onClick={() => go({ name: 'data', typeId: dt.id }, true)}>
            {dt.name}
          </button>
        ))}
      </nav>

      {rows && rows.every((r) => r.entries.length === 0) && (
        <section className="empty">
          <p className="empty-title">{t.emptyData}</p>
          <p className="empty-hint">{t.emptyDataHint}</p>
        </section>
      )}

      <ul className="data-list">
        {(rows ?? []).map(({ id, entries }) => {
          const ex = lookup(id)
          return ex ? <DataCard key={id} ex={ex} entries={entries} /> : null
        })}
      </ul>
    </main>
  )
}

function DataCard({ ex, entries }: { ex: Exercise; entries: Entry[] }) {
  const { t, date } = useI18n()
  const strip = useRef<HTMLDivElement>(null)

  // open at the newest workout, like scrolling a spreadsheet to its last column
  useEffect(() => {
    const el = strip.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [entries.length])

  const tops = entries.map((e) => topSet(doneSets(e))).filter((s) => s !== undefined)
  const best = tops.reduce<(typeof tops)[number] | undefined>((b, s) => (!b || s.w > b.w || (s.w === b.w && s.r > b.r) ? s : b), undefined)

  return (
    <li className={`data-card g-${ex.group}`}>
      <button type="button" className="data-head" onClick={() => go({ name: 'exercise', id: ex.id })}>
        <ExercisePhoto ex={ex} className="data-photo" />
        <span className="data-title">
          <span className="ex-name">{ex.name}</span>
          {best ? (
            <span className="data-best">
              <Trophy size={18} weight="fill" className="trophy" aria-label={t.best} />
              <b>{best.w > 0 ? fmtKg(best.w) : t.bw}</b> × {fmtKg(best.r)}
            </span>
          ) : (
            <span className="muted">{t.noHistory}</span>
          )}
        </span>
        <Sparkline values={tops.map((s) => (s.w > 0 ? s.w : s.r))} />
      </button>

      {entries.length > 0 && (
        <div className="strip" ref={strip}>
          {entries.map((e) => (
            <div key={e.id} className="strip-col">
              <span className="strip-date">{date(parseDay(e.date), 'short')}</span>
              <SetLines sets={doneSets(e)} className="stacked" />
              {e.note && (
                <span className="strip-note">
                  <Note size={14} aria-hidden /> {e.note}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </li>
  )
}

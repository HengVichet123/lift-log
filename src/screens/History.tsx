import { Barbell, Clock, Trophy } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, finishedSessions, parseDay, workSets } from '../db'
import { useExercises } from '../exercises'
import { fmtDuration, fmtSet, fmtVolume, topSet, volume } from '../format'
import { useI18n } from '../i18n'
import { sessionRecords } from '../records'
import { go } from '../router'
import { HeaderTools } from '../components/HeaderTools'
import { ScreenHeader } from '../components/ScreenHeader'

export function History() {
  const { t, date } = useI18n()
  const lookup = useExercises()
  const items = useLiveQuery(async () => {
    const sessions = (await finishedSessions()).reverse()
    const types = new Map((await db.dayTypes.toArray()).map((d) => [d.id, d.name]))
    return Promise.all(
      sessions.map(async (s) => ({
        s,
        name: types.get(s.dayTypeId) ?? t.workout,
        entries: (await db.entries.where('sessionId').equals(s.id!).toArray()).sort((a, b) => a.order - b.order),
        prs: (await sessionRecords(s.id!)).length,
      })),
    )
  }, [t.workout])

  return (
    <main className="screen">
      <ScreenHeader title={t.history} right={<HeaderTools />} />
      {items && items.length === 0 && (
        <section className="empty">
          <p className="empty-title">{t.emptyHistory}</p>
          <p className="empty-hint">{t.emptyHistoryHint}</p>
        </section>
      )}
      <ul className="history-list">
        {(items ?? []).map(({ s, name, entries, prs }) => {
          const sets = entries.flatMap(workSets)
          return (
            <li key={s.id}>
              <button type="button" className="h-card" onClick={() => go({ name: 'summary', sessionId: s.id! })}>
                <span className="h-top">
                  <span className="h-name">{name}</span>
                  <span className="muted">{date(parseDay(s.date), 'medium')}</span>
                </span>
                <span className="h-stats">
                  <span>
                    <Clock size={16} /> {fmtDuration(s.finishedAt! - s.startedAt)}
                  </span>
                  <span>
                    <Barbell size={16} /> {fmtVolume(volume(sets))} {t.kg}
                  </span>
                  {prs > 0 && (
                    <span className="h-pr">
                      <Trophy size={16} weight="fill" /> {prs}
                    </span>
                  )}
                </span>
                <span className="h-table">
                  {entries.map((e) => {
                    const ex = lookup(e.exerciseId)
                    const best = topSet(workSets(e))
                    return ex ? (
                      <span key={e.id} className="h-row">
                        <span className="h-ex">
                          {e.sets.length} × {ex.name}
                        </span>
                        <span className="h-best">{best ? fmtSet(best, t.bw) : ''}</span>
                      </span>
                    ) : null
                  })}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </main>
  )
}

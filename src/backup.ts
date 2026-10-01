import { db, dayKey } from './db'

interface Backup {
  app: 'lift-log'
  version: number
  exportedAt: string
  dayTypes: unknown[]
  customExercises: unknown[]
  sessions: unknown[]
  entries: unknown[]
}

/** Everything the app stores, as one JSON file. */
export async function saveBackup(): Promise<'shared' | 'downloaded'> {
  const data: Backup = {
    app: 'lift-log',
    version: db.verno,
    exportedAt: new Date().toISOString(),
    dayTypes: await db.dayTypes.toArray(),
    customExercises: await db.customExercises.toArray(),
    sessions: await db.sessions.toArray(),
    entries: await db.entries.toArray(),
  }
  const name = `lift-log-backup-${dayKey()}.json`
  const file = new File([JSON.stringify(data)], name, { type: 'application/json' })

  // phones: the share sheet lets you save to Files / Drive / send it to yourself
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name })
      return 'shared'
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e
      // share failed for another reason: fall back to a download
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'downloaded'
}

/** Replace everything with the contents of a backup file. Returns the number of workouts restored. */
export async function restoreBackup(file: File): Promise<number> {
  const data = JSON.parse(await file.text()) as Partial<Backup>
  if (data.app !== 'lift-log' || !Array.isArray(data.sessions) || !Array.isArray(data.entries) || !Array.isArray(data.dayTypes)) {
    throw new Error('not a Lift Log backup')
  }
  await db.transaction('rw', db.dayTypes, db.customExercises, db.sessions, db.entries, async () => {
    await Promise.all([db.dayTypes.clear(), db.customExercises.clear(), db.sessions.clear(), db.entries.clear()])
    await db.dayTypes.bulkAdd(data.dayTypes as never[])
    await db.customExercises.bulkAdd((data.customExercises ?? []) as never[])
    await db.sessions.bulkAdd(data.sessions as never[])
    await db.entries.bulkAdd(data.entries as never[])
  })
  return data.sessions.length
}

/** Ask the browser not to clear the app's storage when space runs low. */
export function keepDataPermanently() {
  navigator.storage?.persist?.().catch(() => {})
}

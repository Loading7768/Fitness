import { db } from '../db/db'
import { backupFileSchema, type BackupFile } from './exportSchema'

/** Progress photos are intentionally excluded — large blobs + more sensitive, opt-in only via settings. */
export async function buildBackupPayload(): Promise<BackupFile> {
  const [exercises, sessions, sets, routines, bodyMetrics, settings] = await Promise.all([
    db.exercises.toArray(),
    db.sessions.toArray(),
    db.sets.toArray(),
    db.routines.toArray(),
    db.bodyMetrics.toArray(),
    db.settings.toArray(),
  ])
  return { version: 1, exportedAt: Date.now(), exercises, sessions, sets, routines, bodyMetrics, settings }
}

export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function parseBackupFile(text: string): BackupFile {
  const json = JSON.parse(text)
  return backupFileSchema.parse(json)
}

/** Replaces all local data with the contents of a validated backup file. */
export async function restoreFromBackup(data: BackupFile) {
  await db.transaction(
    'rw',
    [db.exercises, db.sessions, db.sets, db.routines, db.bodyMetrics, db.settings],
    async () => {
      await Promise.all([
        db.exercises.clear(),
        db.sessions.clear(),
        db.sets.clear(),
        db.routines.clear(),
        db.bodyMetrics.clear(),
        db.settings.clear(),
      ])
      await Promise.all([
        db.exercises.bulkAdd(data.exercises),
        db.sessions.bulkAdd(data.sessions),
        db.sets.bulkAdd(data.sets),
        db.routines.bulkAdd(data.routines),
        db.bodyMetrics.bulkAdd(data.bodyMetrics),
        db.settings.bulkAdd(data.settings),
      ])
    },
  )
}

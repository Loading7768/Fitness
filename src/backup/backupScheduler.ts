import { buildBackupPayload } from './backupData'
import { db } from '../db/db'
import {
  ensureBackupFolder,
  isBackupConfigured,
  pruneOldBackups,
  requestAccessToken,
  uploadBackup,
} from './googleDriveClient'

const DEBOUNCE_MS = 8000
const STALE_MS = 24 * 60 * 60 * 1000

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let statusListeners: ((status: BackupStatus) => void)[] = []

export type BackupStatus = 'idle' | 'backing-up' | 'done' | 'error' | 'needs-auth'

function notify(status: BackupStatus) {
  statusListeners.forEach((fn) => fn(status))
}

export function onBackupStatusChange(fn: (status: BackupStatus) => void) {
  statusListeners.push(fn)
  return () => {
    statusListeners = statusListeners.filter((f) => f !== fn)
  }
}

/** Call after any locally-saved change. Debounced so a burst of set-saves triggers one upload. */
export function scheduleBackup() {
  if (!isBackupConfigured()) return
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    performBackup(false).catch(() => {})
  }, DEBOUNCE_MS)
}

export async function performBackup(interactive: boolean): Promise<void> {
  if (!isBackupConfigured()) return
  notify('backing-up')
  try {
    const token = await requestAccessToken(interactive)
    const folderId = await ensureBackupFolder(token)
    const payload = await buildBackupPayload()
    const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    await uploadBackup(token, folderId, filename, JSON.stringify(payload))
    await pruneOldBackups(token, folderId, 5)
    const settings = await db.settings.get(1)
    if (settings) await db.settings.put({ ...settings, lastBackupAt: Date.now() })
    notify('done')
  } catch (err) {
    notify(interactive ? 'error' : 'needs-auth')
    throw err
  }
}

export async function checkAndBackupIfStale() {
  if (!isBackupConfigured()) return
  const settings = await db.settings.get(1)
  if (!settings?.lastBackupAt || Date.now() - settings.lastBackupAt > STALE_MS) {
    performBackup(false).catch(() => {
      // Silent — most likely needs interactive re-auth; user can trigger manually from Settings.
    })
  }
}

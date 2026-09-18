import { useEffect, useState } from 'react'
import { Button, Card } from '../components/ui'
import { db } from '../db/db'
import { parseBackupFile, restoreFromBackup } from './backupData'
import { performBackup } from './backupScheduler'
import {
  disconnect,
  downloadBackup,
  ensureBackupFolder,
  isBackupConfigured,
  isConnected,
  listBackups,
  requestAccessToken,
  type DriveFile,
} from './googleDriveClient'

export default function BackupSection() {
  const [connected, setConnected] = useState(isConnected())
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [lastBackupAt, setLastBackupAt] = useState<number | undefined>()
  const [restoreList, setRestoreList] = useState<DriveFile[] | null>(null)

  useEffect(() => {
    db.settings.get(1).then((s) => setLastBackupAt(s?.lastBackupAt))
  }, [])

  if (!isBackupConfigured()) {
    return (
      <Card className="mb-4">
        <h2 className="text-sm text-neutral-400 mb-2">雲端備份 (Google Drive)</h2>
        <p className="text-xs text-neutral-600">
          尚未設定 Google OAuth Client ID，此功能未啟用。請參考 README 設定 VITE_GOOGLE_CLIENT_ID。
        </p>
      </Card>
    )
  }

  async function connect() {
    setBusy(true)
    setMessage(null)
    try {
      await requestAccessToken(true)
      setConnected(true)
      await performBackup(true)
      const s = await db.settings.get(1)
      setLastBackupAt(s?.lastBackupAt)
      setMessage('已連結並完成備份')
    } catch {
      setMessage('連結失敗，請再試一次')
    } finally {
      setBusy(false)
    }
  }

  function handleDisconnect() {
    disconnect()
    setConnected(false)
    setMessage('已取消連結')
  }

  async function backupNow() {
    setBusy(true)
    setMessage(null)
    try {
      await performBackup(true)
      const s = await db.settings.get(1)
      setLastBackupAt(s?.lastBackupAt)
      setMessage('備份完成')
    } catch {
      setMessage('備份失敗')
    } finally {
      setBusy(false)
    }
  }

  async function openRestoreList() {
    setBusy(true)
    setMessage(null)
    try {
      const token = await requestAccessToken(true)
      const folderId = await ensureBackupFolder(token)
      const files = await listBackups(token, folderId)
      setRestoreList(files)
    } catch {
      setMessage('無法讀取備份清單')
    } finally {
      setBusy(false)
    }
  }

  async function restore(file: DriveFile) {
    if (!confirm(`還原「${file.name}」會覆蓋目前所有本機資料，確定嗎？`)) return
    setBusy(true)
    try {
      const token = await requestAccessToken(true)
      const text = await downloadBackup(token, file.id)
      const data = parseBackupFile(text)
      await restoreFromBackup(data)
      setMessage('還原成功')
      setRestoreList(null)
    } catch {
      setMessage('還原失敗，檔案可能已損毀')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="mb-4">
      <h2 className="text-sm text-neutral-400 mb-3">雲端備份 (Google Drive)</h2>

      <div className="flex items-center justify-between mb-3">
        <span className="text-neutral-200 text-sm">
          {connected ? '已連結 Google 帳號' : '尚未連結'}
        </span>
        {connected ? (
          <button onClick={handleDisconnect} className="text-xs text-neutral-500 underline">
            取消連結
          </button>
        ) : (
          <Button onClick={connect} disabled={busy}>
            連結 Google 帳號
          </Button>
        )}
      </div>

      <p className="text-xs text-neutral-600 mb-3">
        上次備份：{lastBackupAt ? new Date(lastBackupAt).toLocaleString() : '尚未備份'}
      </p>

      <div className="flex gap-2">
        <Button variant="secondary" onClick={backupNow} disabled={busy} className="flex-1">
          立即備份
        </Button>
        <Button variant="secondary" onClick={openRestoreList} disabled={busy} className="flex-1">
          從 Drive 還原
        </Button>
      </div>

      {message && <p className="text-xs text-neutral-500 mt-2">{message}</p>}

      {restoreList && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-end justify-center">
          <div className="w-full max-w-[480px] bg-neutral-950 rounded-t-2xl max-h-[70vh] flex flex-col p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-neutral-100">選擇要還原的備份</h3>
              <button onClick={() => setRestoreList(null)} className="text-neutral-500">
                關閉
              </button>
            </div>
            {restoreList.length === 0 && <p className="text-sm text-neutral-500">目前沒有備份檔案</p>}
            <div className="overflow-y-auto flex flex-col gap-2">
              {restoreList.map((f) => (
                <button
                  key={f.id}
                  onClick={() => restore(f)}
                  className="bg-neutral-900 rounded-xl p-3 text-left text-sm text-neutral-200"
                >
                  {f.name}
                  <div className="text-xs text-neutral-500">
                    {new Date(f.createdTime).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

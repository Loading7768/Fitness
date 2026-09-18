import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildBackupPayload, downloadJson, parseBackupFile, restoreFromBackup } from '../backup/backupData'
import BackupSection from '../backup/BackupSection'
import { Button, Card, PageHeader } from '../components/ui'
import { db, getSettings } from '../db/db'
import type { AppSettings } from '../db/types'

export default function Settings() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<string | null>(null)

  useEffect(() => {
    getSettings().then(setSettings)
  }, [])

  async function update(patch: Partial<AppSettings>) {
    if (!settings) return
    const next = { ...settings, ...patch }
    setSettings(next)
    await db.settings.put(next)
  }

  async function handleExport() {
    const payload = await buildBackupPayload()
    downloadJson(payload, `fitness-backup-${new Date().toISOString().slice(0, 10)}.json`)
  }

  async function handleImportFile(file: File) {
    setImportStatus(null)
    try {
      const text = await file.text()
      const data = parseBackupFile(text)
      if (!confirm('還原備份會覆蓋目前所有本機資料，確定要繼續嗎？')) return
      await restoreFromBackup(data)
      setImportStatus('還原成功')
    } catch {
      setImportStatus('檔案格式錯誤，無法匯入')
    }
  }

  async function clearAll() {
    if (!confirm('清除所有資料？此操作無法復原，建議先匯出備份。')) return
    if (!confirm('再次確認：真的要清除所有訓練紀錄、動作庫、範本與身體數據嗎？')) return
    await db.transaction('rw', db.tables, async () => {
      await Promise.all(db.tables.map((t) => t.clear()))
    })
    location.reload()
  }

  if (!settings) return null

  return (
    <div className="pb-10">
      <PageHeader title="設定" />

      <Card className="mb-4">
        <h2 className="text-sm text-neutral-400 mb-3">一般</h2>

        <div className="flex items-center justify-between mb-3">
          <span className="text-neutral-200">重量單位</span>
          <div className="flex gap-1">
            {(['kg', 'lb'] as const).map((u) => (
              <button
                key={u}
                onClick={() => update({ unit: u })}
                className={`px-3 py-1 rounded-lg text-sm ${
                  settings.unit === u ? 'bg-violet-600 text-white' : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-neutral-200">一週起始日</span>
          <div className="flex gap-1">
            <button
              onClick={() => update({ weekStartsOn: 1 })}
              className={`px-3 py-1 rounded-lg text-sm ${
                settings.weekStartsOn === 1 ? 'bg-violet-600 text-white' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              週一
            </button>
            <button
              onClick={() => update({ weekStartsOn: 0 })}
              className={`px-3 py-1 rounded-lg text-sm ${
                settings.weekStartsOn === 0 ? 'bg-violet-600 text-white' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              週日
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-neutral-200">每週訓練目標（次）</span>
          <input
            type="number"
            inputMode="numeric"
            value={settings.weeklyGoal}
            onChange={(e) => update({ weeklyGoal: Number(e.target.value) })}
            className="w-16 !py-1 text-center"
          />
        </div>
      </Card>

      <Card className="mb-4">
        <h2 className="text-sm text-neutral-400 mb-3">休息計時器</h2>
        <div className="flex items-center justify-between mb-3">
          <span className="text-neutral-200">預設秒數</span>
          <input
            type="number"
            inputMode="numeric"
            value={settings.restTimerDefaultSec}
            onChange={(e) => update({ restTimerDefaultSec: Number(e.target.value) })}
            className="w-16 !py-1 text-center"
          />
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-neutral-200">音效提示</span>
          <input
            type="checkbox"
            checked={settings.restTimerSoundOn}
            onChange={(e) => update({ restTimerSoundOn: e.target.checked })}
            className="w-5 h-5"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-neutral-200">震動提示</span>
          <input
            type="checkbox"
            checked={settings.restTimerVibrateOn}
            onChange={(e) => update({ restTimerVibrateOn: e.target.checked })}
            className="w-5 h-5"
          />
        </div>
      </Card>

      <Card className="mb-4">
        <h2 className="text-sm text-neutral-400 mb-3">動作庫</h2>
        <Button variant="secondary" onClick={() => navigate('/exercises')} className="w-full">
          管理動作庫
        </Button>
      </Card>

      <BackupSection />

      <Card className="mb-4">
        <h2 className="text-sm text-neutral-400 mb-3">資料備份（本機檔案）</h2>
        <div className="flex items-center justify-between mb-3">
          <span className="text-neutral-200 text-sm">進度照片納入備份</span>
          <input
            type="checkbox"
            checked={settings.includePhotosInBackup}
            onChange={(e) => update({ includePhotosInBackup: e.target.checked })}
            className="w-5 h-5"
          />
        </div>
        <Button variant="secondary" onClick={handleExport} className="w-full mb-2">
          匯出備份 (JSON)
        </Button>
        <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="w-full">
          匯入備份 (JSON)
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleImportFile(e.target.files[0])}
        />
        {importStatus && <p className="text-xs text-neutral-500 mt-2">{importStatus}</p>}
      </Card>

      <Card className="mb-4 border-red-900/50">
        <h2 className="text-sm text-neutral-400 mb-3">危險區域</h2>
        <Button variant="danger" onClick={clearAll} className="w-full">
          清除所有資料
        </Button>
      </Card>
    </div>
  )
}

import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { scheduleBackup } from '../backup/backupScheduler'
import { Button, Card, EmptyState, PageHeader } from '../components/ui'
import { db } from '../db/db'

export default function BodyMetrics() {
  const entries = useLiveQuery(() => db.bodyMetrics.orderBy('date').reverse().toArray(), [])
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')

  async function addEntry() {
    if (!weight && !bodyFat) return
    await db.bodyMetrics.add({
      date: Date.now(),
      weightKg: weight ? Number(weight) : undefined,
      bodyFatPct: bodyFat ? Number(bodyFat) : undefined,
    })
    setWeight('')
    setBodyFat('')
    scheduleBackup()
  }

  async function remove(id: number) {
    await db.bodyMetrics.delete(id)
  }

  const chartData = [...(entries ?? [])]
    .reverse()
    .filter((e) => e.weightKg != null)
    .map((e) => ({
      date: new Date(e.date).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }),
      weight: e.weightKg,
    }))

  return (
    <div className="pb-10">
      <PageHeader title="身體數據" />

      <Card className="mb-4">
        <div className="flex gap-2 mb-3">
          <label className="text-sm text-neutral-400 flex-1">
            體重 (kg)
            <input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full mt-1"
            />
          </label>
          <label className="text-sm text-neutral-400 flex-1">
            體脂率 (%)
            <input
              type="number"
              inputMode="decimal"
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
              className="w-full mt-1"
            />
          </label>
        </div>
        <Button onClick={addEntry} className="w-full">
          記錄今天
        </Button>
      </Card>

      {chartData.length > 1 && (
        <Card className="mb-4">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" stroke="#737373" fontSize={12} />
              <YAxis stroke="#737373" fontSize={12} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: '#171717', border: '1px solid #404040' }} />
              <Line type="monotone" dataKey="weight" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {entries && entries.length === 0 && <EmptyState text="還沒有身體數據紀錄" />}
      <div className="flex flex-col gap-2">
        {entries?.map((e) => (
          <Card key={e.id} className="flex items-center justify-between">
            <div>
              <div className="text-neutral-100">{new Date(e.date).toLocaleDateString()}</div>
              <div className="text-xs text-neutral-500">
                {e.weightKg != null && `${e.weightKg}kg`}
                {e.bodyFatPct != null && ` · ${e.bodyFatPct}%`}
              </div>
            </div>
            <button onClick={() => remove(e.id!)} className="text-neutral-500 text-sm">
              刪除
            </button>
          </Card>
        ))}
      </div>
    </div>
  )
}

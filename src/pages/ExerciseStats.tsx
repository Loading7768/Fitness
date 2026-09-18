import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { EmptyState, PageHeader } from '../components/ui'
import { db } from '../db/db'
import { getExerciseHistory, type ExercisePoint } from '../stats/statsHelpers'

type Metric = 'maxWeight' | 'estimated1RM' | 'volume'
const METRIC_LABEL: Record<Metric, string> = {
  maxWeight: '最大重量',
  estimated1RM: '估計1RM',
  volume: '訓練總量',
}

export default function ExerciseStats() {
  const { exerciseId } = useParams()
  const id = Number(exerciseId)
  const exercise = useLiveQuery(() => db.exercises.get(id), [id])
  const [points, setPoints] = useState<ExercisePoint[]>([])
  const [metric, setMetric] = useState<Metric>('estimated1RM')

  useEffect(() => {
    getExerciseHistory(id).then(setPoints)
  }, [id])

  const data = points.map((p) => ({
    date: new Date(p.date).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }),
    value: p[metric],
  }))

  const best = points.length ? Math.max(...points.map((p) => p[metric])) : 0

  return (
    <div>
      <PageHeader title={exercise?.name ?? ''} />

      <div className="flex gap-2 mb-4">
        {(Object.keys(METRIC_LABEL) as Metric[]).map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              metric === m ? 'bg-violet-600 text-white' : 'bg-neutral-800 text-neutral-300'
            }`}
          >
            {METRIC_LABEL[m]}
          </button>
        ))}
      </div>

      {data.length === 0 ? (
        <EmptyState text="還沒有這個動作的紀錄" />
      ) : (
        <>
          <p className="text-sm text-neutral-500 mb-2">
            歷史最佳 {METRIC_LABEL[metric]}：{Math.round(best)}
            {metric !== 'volume' ? 'kg' : ''}
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data}>
              <XAxis dataKey="date" stroke="#737373" fontSize={12} />
              <YAxis stroke="#737373" fontSize={12} />
              <Tooltip contentStyle={{ background: '#171717', border: '1px solid #404040' }} />
              <Line type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          {metric === 'estimated1RM' && (
            <p className="text-xs text-neutral-600 mt-2">估計1RM僅為公式估算（Epley），非實測值</p>
          )}
        </>
      )}
    </div>
  )
}

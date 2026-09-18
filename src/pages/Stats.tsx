import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, EmptyState, PageHeader } from '../components/ui'
import { CATEGORY_LABEL } from '../db/labels'
import type { Exercise, MuscleCategory } from '../db/types'
import { getTrainedExercises, getWeeklyVolumeByCategory } from '../stats/statsHelpers'

export default function Stats() {
  const navigate = useNavigate()
  const [weeklyVolume, setWeeklyVolume] = useState<Record<string, number>>({})
  const [trained, setTrained] = useState<{ exercise: Exercise; lastTrainedAt: number }[]>([])

  useEffect(() => {
    getWeeklyVolumeByCategory().then(setWeeklyVolume)
    getTrainedExercises().then(setTrained)
  }, [])

  const chartData = Object.entries(weeklyVolume).map(([category, volume]) => ({
    category: CATEGORY_LABEL[category as MuscleCategory],
    volume: Math.round(volume),
  }))

  return (
    <div>
      <PageHeader title="進步統計" />

      <Card className="mb-5">
        <h2 className="text-sm text-neutral-400 mb-2">本週各肌群訓練量</h2>
        {chartData.length === 0 ? (
          <EmptyState text="這週還沒有訓練紀錄" />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <XAxis dataKey="category" stroke="#737373" fontSize={12} />
              <YAxis stroke="#737373" fontSize={12} />
              <Tooltip contentStyle={{ background: '#171717', border: '1px solid #404040' }} />
              <Bar dataKey="volume" fill="#a78bfa" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <h2 className="text-sm text-neutral-400 mb-2">動作進步曲線</h2>
      {trained.length === 0 && <EmptyState text="還沒有任何動作的紀錄" />}
      <div className="flex flex-col gap-2">
        {trained.map(({ exercise }) => (
          <Card
            key={exercise.id}
            className="cursor-pointer"
            onClick={() => navigate(`/stats/${exercise.id}`)}
          >
            <span className="text-neutral-100">{exercise.name}</span>
          </Card>
        ))}
      </div>
    </div>
  )
}

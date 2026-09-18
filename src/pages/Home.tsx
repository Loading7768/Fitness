import { useLiveQuery } from 'dexie-react-hooks'
import { Scale } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, PageHeader } from '../components/ui'
import { db, getSettings } from '../db/db'
import { summarizeSession, type SessionSummary } from '../history/historyHelpers'

function startOfWeek(weekStartsOn: 0 | 1) {
  const now = new Date()
  const day = now.getDay()
  const diff = (day - weekStartsOn + 7) % 7
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(now.getDate() - diff)
  return start.getTime()
}

export default function Home() {
  const navigate = useNavigate()
  const [weeklyGoal, setWeeklyGoal] = useState(3)
  const [weekStartsOn, setWeekStartsOn] = useState<0 | 1>(1)
  const [lastSummary, setLastSummary] = useState<SessionSummary | null>(null)

  useEffect(() => {
    getSettings().then((s) => {
      setWeeklyGoal(s.weeklyGoal)
      setWeekStartsOn(s.weekStartsOn)
    })
  }, [])

  const inProgress = useLiveQuery(
    () => db.sessions.filter((s) => s.status === 'in_progress').first(),
    [],
  )

  const weekStart = startOfWeek(weekStartsOn)
  const weekCount = useLiveQuery(
    () =>
      db.sessions
        .filter((s) => s.status === 'completed' && s.date >= weekStart)
        .count(),
    [weekStart],
  )

  const todaysRoutines = useLiveQuery(async () => {
    const weekday = new Date().getDay()
    const all = await db.routines.toArray()
    return all.filter((r) => r.scheduledWeekdays?.includes(weekday))
  }, [])

  const lastSession = useLiveQuery(
    () =>
      db.sessions
        .filter((s) => s.status === 'completed')
        .reverse()
        .sortBy('date')
        .then((arr) => arr[0]),
    [],
  )

  useEffect(() => {
    if (lastSession) summarizeSession(lastSession).then(setLastSummary)
  }, [lastSession])

  return (
    <div>
      <PageHeader title="健身紀錄" />

      {inProgress ? (
        <Button onClick={() => navigate(`/workout/${inProgress.id}`)} className="w-full mb-4">
          繼續訓練
        </Button>
      ) : (
        <Button onClick={() => navigate('/workout')} className="w-full mb-4">
          開始訓練
        </Button>
      )}

      <Card className="mb-4">
        <p className="text-sm text-neutral-400 mb-1">本週訓練</p>
        <p className="text-2xl font-semibold text-neutral-100">
          {weekCount ?? 0} <span className="text-sm text-neutral-500">/ {weeklyGoal} 次</span>
        </p>
      </Card>

      {todaysRoutines && todaysRoutines.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-neutral-400 mb-2">今日建議</p>
          {todaysRoutines.map((r) => (
            <Card key={r.id} className="flex items-center justify-between mb-2">
              <span className="text-neutral-100">{r.name}</span>
              <Button
                variant="secondary"
                onClick={async () => {
                  const id = await db.sessions.add({ date: Date.now(), status: 'in_progress', routineId: r.id })
                  navigate(`/workout/${id}`)
                }}
              >
                開始
              </Button>
            </Card>
          ))}
        </div>
      )}

      {lastSummary && (
        <div className="mb-4">
          <p className="text-sm text-neutral-400 mb-2">最近一次訓練</p>
          <Card onClick={() => navigate(`/history/${lastSummary.session.id}`)} className="cursor-pointer">
            <div className="text-neutral-100">
              {new Date(lastSummary.session.date).toLocaleDateString()}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              {lastSummary.exerciseCount} 個動作 · {lastSummary.durationMin} 分鐘 · 總量{' '}
              {Math.round(lastSummary.totalVolume)}
            </div>
          </Card>
        </div>
      )}

      <button
        onClick={() => navigate('/body')}
        className="w-full flex items-center gap-2 justify-center border border-neutral-800 rounded-xl py-3 text-neutral-400"
      >
        <Scale size={16} /> 身體數據
      </button>
    </div>
  )
}

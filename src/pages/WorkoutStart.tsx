import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { Button, Card, EmptyState, PageHeader } from '../components/ui'
import { db } from '../db/db'

export default function WorkoutStart() {
  const navigate = useNavigate()

  const inProgress = useLiveQuery(
    () => db.sessions.filter((s) => s.status === 'in_progress').first(),
    [],
  )
  const routines = useLiveQuery(() => db.routines.toArray(), [])

  if (inProgress !== undefined && inProgress) {
    navigate(`/workout/${inProgress.id}`, { replace: true })
    return null
  }

  async function startBlank() {
    const id = await db.sessions.add({ date: Date.now(), status: 'in_progress' })
    navigate(`/workout/${id}`)
  }

  async function startFromRoutine(routineId: number) {
    const id = await db.sessions.add({
      date: Date.now(),
      status: 'in_progress',
      routineId,
    })
    navigate(`/workout/${id}`)
  }

  return (
    <div>
      <PageHeader title="開始訓練" />
      <Button onClick={startBlank} className="w-full mb-6">
        空白開始
      </Button>

      <h2 className="text-sm text-neutral-400 mb-2">或使用範本</h2>
      {routines && routines.length === 0 && <EmptyState text="還沒有訓練範本" />}
      <div className="flex flex-col gap-2">
        {routines?.map((r) => (
          <Card key={r.id} className="flex items-center justify-between">
            <div>
              <div className="text-neutral-100 font-medium">{r.name}</div>
              <div className="text-xs text-neutral-500">{r.exercises.length} 個動作</div>
            </div>
            <Button variant="secondary" onClick={() => startFromRoutine(r.id!)}>
              開始
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}

import { useLiveQuery } from 'dexie-react-hooks'
import { Copy, Trophy, Trash2 } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button, PageHeader } from '../components/ui'
import { db } from '../db/db'
import { groupSetsByBlock } from '../history/historyHelpers'
import type { NewPR } from '../workout/prHelpers'

export default function SessionDetail() {
  const { id } = useParams()
  const sessionId = Number(id)
  const navigate = useNavigate()
  const location = useLocation()
  const newPRs = (location.state as { newPRs?: NewPR[] } | null)?.newPRs ?? []

  const session = useLiveQuery(() => db.sessions.get(sessionId), [sessionId])
  const sets = useLiveQuery(() => db.sets.where('sessionId').equals(sessionId).toArray(), [sessionId])
  const exerciseMap = useLiveQuery(async () => {
    const all = await db.exercises.toArray()
    return new Map(all.map((e) => [e.id!, e]))
  }, [])

  if (!session || !sets || !exerciseMap) return null

  const blocks = groupSetsByBlock(sets)
  const durationMin = session.endTime ? Math.round((session.endTime - session.date) / 60000) : 0

  async function deleteSession() {
    if (!confirm('刪除這次訓練紀錄？這無法復原。')) return
    await db.sets.bulkDelete(sets!.map((s) => s.id!))
    await db.sessions.delete(sessionId)
    navigate('/history')
  }

  async function duplicateSession() {
    const newId = await db.sessions.add({
      date: Date.now(),
      status: 'in_progress',
      routineId: session!.routineId,
      label: session!.label,
    })
    for (const block of blocks) {
      for (const s of block.sets) {
        await db.sets.add({
          sessionId: newId,
          exerciseId: block.exerciseId,
          orderIndex: block.orderIndex,
          setNumber: s.setNumber,
          setType: s.setType,
          weight: s.weight,
          reps: s.reps,
          durationSec: s.durationSec,
          toFailure: false,
          completed: false,
        })
      }
    }
    navigate(`/workout/${newId}`)
  }

  return (
    <div className="pb-10">
      <PageHeader
        title={session.label ?? new Date(session.date).toLocaleDateString()}
        action={
          <div className="flex gap-2">
            <button onClick={duplicateSession} aria-label="複製成新訓練">
              <Copy size={20} className="text-neutral-400" />
            </button>
            <button onClick={deleteSession} aria-label="刪除">
              <Trash2 size={20} className="text-neutral-400" />
            </button>
          </div>
        }
      />

      <p className="text-sm text-neutral-500 mb-4">{durationMin} 分鐘</p>

      {newPRs.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-amber-400 font-medium">
            <Trophy size={18} /> 新紀錄！
          </div>
          {newPRs.map((pr) => (
            <p key={pr.exerciseId} className="text-sm text-neutral-200">
              {pr.exerciseName}：{pr.weight}kg × {pr.reps}
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {blocks.map((block) => {
          const exercise = exerciseMap.get(block.exerciseId)
          return (
            <div key={block.orderIndex} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
              <h3 className="font-medium text-neutral-100 mb-2">{exercise?.name ?? '未知動作'}</h3>
              <div className="flex flex-col gap-1">
                {block.sets
                  .filter((s) => s.completed)
                  .map((s) => (
                    <div key={s.id} className="text-sm text-neutral-300 flex gap-2">
                      <span className="text-neutral-500 w-4">{s.setNumber}</span>
                      {s.weight != null && <span>{s.weight}kg</span>}
                      {s.reps != null && <span>× {s.reps}</span>}
                      {s.durationSec != null && <span>{s.durationSec}秒</span>}
                      {s.setType === 'warmup' && <span className="text-amber-500 text-xs">熱身</span>}
                    </div>
                  ))}
              </div>
            </div>
          )
        })}
      </div>

      <Button variant="secondary" onClick={() => navigate('/history')} className="w-full mt-6">
        返回歷史紀錄
      </Button>
    </div>
  )
}

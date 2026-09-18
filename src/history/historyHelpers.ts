import { db } from '../db/db'
import type { WorkoutSession, WorkoutSet } from '../db/types'

export interface SessionSummary {
  session: WorkoutSession
  totalVolume: number
  durationMin: number
  exerciseCount: number
  categories: string[]
}

export async function summarizeSession(session: WorkoutSession): Promise<SessionSummary> {
  const sets = await db.sets.where('sessionId').equals(session.id!).toArray()
  const completed = sets.filter((s) => s.completed)
  const totalVolume = completed.reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0)
  const durationMin = session.endTime ? Math.round((session.endTime - session.date) / 60000) : 0
  const exerciseIds = [...new Set(sets.map((s) => s.exerciseId))]
  const exercises = await db.exercises.bulkGet(exerciseIds)
  const categories = [...new Set(exercises.filter(Boolean).map((e) => e!.category))]
  return { session, totalVolume, durationMin, exerciseCount: exerciseIds.length, categories }
}

export function groupSetsByBlock(sets: WorkoutSet[]) {
  const map = new Map<number, WorkoutSet[]>()
  for (const s of sets) {
    if (!map.has(s.orderIndex)) map.set(s.orderIndex, [])
    map.get(s.orderIndex)!.push(s)
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([orderIndex, blockSets]) => ({
      orderIndex,
      exerciseId: blockSets[0].exerciseId,
      sets: blockSets.sort((a, b) => a.setNumber - b.setNumber),
    }))
}

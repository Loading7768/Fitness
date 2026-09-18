import { db } from '../db/db'
import { estimate1RM } from '../workout/prHelpers'

export interface ExercisePoint {
  date: number
  maxWeight: number
  estimated1RM: number
  volume: number
}

export async function getExerciseHistory(exerciseId: number): Promise<ExercisePoint[]> {
  const sets = await db.sets
    .where('exerciseId')
    .equals(exerciseId)
    .filter((s) => s.completed && s.setType !== 'warmup' && s.weight != null && s.reps != null)
    .toArray()

  const sessionIds = [...new Set(sets.map((s) => s.sessionId))]
  const sessions = await db.sessions.bulkGet(sessionIds)
  const dateBySession = new Map(sessions.filter(Boolean).map((s) => [s!.id!, s!.date]))

  const bySession = new Map<number, typeof sets>()
  for (const s of sets) {
    if (!bySession.has(s.sessionId)) bySession.set(s.sessionId, [])
    bySession.get(s.sessionId)!.push(s)
  }

  const points: ExercisePoint[] = []
  for (const [sessionId, sessionSets] of bySession) {
    const date = dateBySession.get(sessionId)
    if (!date) continue
    const maxWeight = Math.max(...sessionSets.map((s) => s.weight!))
    const estimated1RM = Math.max(...sessionSets.map((s) => estimate1RM(s.weight!, s.reps!)))
    const volume = sessionSets.reduce((sum, s) => sum + s.weight! * s.reps!, 0)
    points.push({ date, maxWeight, estimated1RM: Math.round(estimated1RM), volume })
  }
  return points.sort((a, b) => a.date - b.date)
}

export async function getWeeklyVolumeByCategory(): Promise<Record<string, number>> {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const sets = await db.sets
    .filter((s) => s.completed && s.setType !== 'warmup' && s.weight != null && s.reps != null)
    .toArray()

  const sessionIds = [...new Set(sets.map((s) => s.sessionId))]
  const sessions = await db.sessions.bulkGet(sessionIds)
  const dateBySession = new Map(sessions.filter(Boolean).map((s) => [s!.id!, s!.date]))

  const recentSets = sets.filter((s) => (dateBySession.get(s.sessionId) ?? 0) >= weekAgo)
  const exerciseIds = [...new Set(recentSets.map((s) => s.exerciseId))]
  const exercises = await db.exercises.bulkGet(exerciseIds)
  const categoryByExercise = new Map(exercises.filter(Boolean).map((e) => [e!.id!, e!.category]))

  const totals: Record<string, number> = {}
  for (const s of recentSets) {
    const cat = categoryByExercise.get(s.exerciseId)
    if (!cat) continue
    totals[cat] = (totals[cat] ?? 0) + s.weight! * s.reps!
  }
  return totals
}

export async function getTrainedExercises() {
  const sets = await db.sets.filter((s) => s.completed).toArray()
  const lastCompletedBySet = new Map<number, number>()
  for (const s of sets) {
    if (!s.completedAt) continue
    const prev = lastCompletedBySet.get(s.exerciseId) ?? 0
    if (s.completedAt > prev) lastCompletedBySet.set(s.exerciseId, s.completedAt)
  }
  const exerciseIds = [...lastCompletedBySet.keys()]
  const exercises = await db.exercises.bulkGet(exerciseIds)
  return exercises
    .filter(Boolean)
    .map((e) => ({ exercise: e!, lastTrainedAt: lastCompletedBySet.get(e!.id!)! }))
    .sort((a, b) => b.lastTrainedAt - a.lastTrainedAt)
}

import { db } from '../db/db'
import type { WorkoutSet } from '../db/types'

/** Epley formula — an estimate, not a measured max. */
export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight
  return weight * (1 + reps / 30)
}

export async function getLastPerformance(
  exerciseId: number,
  excludeSessionId?: number,
): Promise<WorkoutSet | null> {
  const sets = await db.sets
    .where('exerciseId')
    .equals(exerciseId)
    .filter((s) => s.completed && s.sessionId !== excludeSessionId)
    .toArray()
  if (sets.length === 0) return null
  sets.sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
  return sets[0]
}

async function priorBestWeight(exerciseId: number, excludeSessionId: number): Promise<number> {
  const sets = await db.sets
    .where('exerciseId')
    .equals(exerciseId)
    .filter(
      (s) =>
        s.completed &&
        s.setType !== 'warmup' &&
        s.sessionId !== excludeSessionId &&
        s.weight != null,
    )
    .toArray()
  return sets.length ? Math.max(...sets.map((s) => s.weight!)) : 0
}

export interface NewPR {
  exerciseId: number
  exerciseName: string
  weight: number
  reps: number
}

/** Compares this session's working sets against all prior sessions to find new max-weight PRs. */
export async function computeNewPRs(sessionId: number): Promise<NewPR[]> {
  const sessionSets = await db.sets
    .where('sessionId')
    .equals(sessionId)
    .filter((s) => s.completed && s.setType !== 'warmup' && s.weight != null)
    .toArray()

  const byExercise = new Map<number, WorkoutSet[]>()
  for (const s of sessionSets) {
    if (!byExercise.has(s.exerciseId)) byExercise.set(s.exerciseId, [])
    byExercise.get(s.exerciseId)!.push(s)
  }

  const results: NewPR[] = []
  for (const [exerciseId, sets] of byExercise) {
    const bestInSession = sets.reduce((a, b) => (b.weight! > a.weight! ? b : a))
    const priorBest = await priorBestWeight(exerciseId, sessionId)
    if (bestInSession.weight! > priorBest) {
      const exercise = await db.exercises.get(exerciseId)
      results.push({
        exerciseId,
        exerciseName: exercise?.name ?? '未知動作',
        weight: bestInSession.weight!,
        reps: bestInSession.reps ?? 0,
      })
    }
  }
  return results
}

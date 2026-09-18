import Dexie, { type Table } from 'dexie'
import type {
  AppSettings,
  BodyMetric,
  Exercise,
  ProgressPhoto,
  Routine,
  WorkoutSession,
  WorkoutSet,
} from './types'

export class FitnessDB extends Dexie {
  exercises!: Table<Exercise, number>
  sessions!: Table<WorkoutSession, number>
  sets!: Table<WorkoutSet, number>
  routines!: Table<Routine, number>
  bodyMetrics!: Table<BodyMetric, number>
  photos!: Table<ProgressPhoto, number>
  settings!: Table<AppSettings, number>

  constructor() {
    super('fitness-tracker')
    this.version(1).stores({
      exercises: '++id, name, category, equipment, isArchived',
      sessions: '++id, date, status, routineId',
      sets: '++id, sessionId, exerciseId, orderIndex',
      routines: '++id, name',
      bodyMetrics: '++id, date',
      photos: '++id, date',
      settings: '++id',
    })
  }
}

export const db = new FitnessDB()

export async function getSettings(): Promise<AppSettings> {
  const existing = await db.settings.get(1)
  if (existing) return existing
  const defaults: AppSettings = {
    id: 1,
    unit: 'kg',
    weekStartsOn: 1,
    restTimerDefaultSec: 90,
    restTimerSoundOn: true,
    restTimerVibrateOn: true,
    includePhotosInBackup: false,
    weeklyGoal: 3,
  }
  await db.settings.put(defaults)
  return defaults
}

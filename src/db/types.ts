export type MuscleCategory =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'legs'
  | 'arms'
  | 'core'
  | 'cardio'
  | 'full_body'

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'bodyweight'
  | 'cable'
  | 'band'
  | 'kettlebell'
  | 'other'

/** Different exercises log differently: weight+reps, reps only (bodyweight), time-based, or weighted time-based. */
export type TrackingType = 'weight_reps' | 'reps_only' | 'time' | 'weight_time'

export interface Exercise {
  id?: number
  name: string
  category: MuscleCategory
  equipment: Equipment
  trackingType: TrackingType
  isCustom: boolean
  isArchived: boolean
  notes?: string
}

export type SetType = 'warmup' | 'working' | 'dropset'

export interface WorkoutSet {
  id?: number
  sessionId: number
  exerciseId: number
  orderIndex: number
  supersetGroupId?: string
  setType: SetType
  setNumber: number
  weight?: number
  reps?: number
  durationSec?: number
  rpe?: number
  restSec?: number
  toFailure: boolean
  completed: boolean
  notes?: string
  completedAt?: number
}

export type SessionStatus = 'in_progress' | 'completed'

export interface WorkoutSession {
  id?: number
  date: number
  endTime?: number
  label?: string
  routineId?: number
  bodyweightAtSession?: number
  notes?: string
  status: SessionStatus
}

export interface RoutineExercise {
  exerciseId: number
  targetSets: number
  targetRepsMin?: number
  targetRepsMax?: number
  targetWeight?: number
  supersetGroupId?: string
}

export interface Routine {
  id?: number
  name: string
  description?: string
  exercises: RoutineExercise[]
  /** 0 = Sunday ... 6 = Saturday */
  scheduledWeekdays?: number[]
}

export interface BodyMetric {
  id?: number
  date: number
  weightKg?: number
  bodyFatPct?: number
  measurements?: Record<string, number>
  /** Reference into the photos table. Excluded from Drive backup by default (size + privacy). */
  photoBlobId?: number
}

export interface ProgressPhoto {
  id?: number
  date: number
  blob: Blob
}

export interface AppSettings {
  id?: number
  unit: 'kg' | 'lb'
  weekStartsOn: 0 | 1
  restTimerDefaultSec: number
  restTimerSoundOn: boolean
  restTimerVibrateOn: boolean
  includePhotosInBackup: boolean
  weeklyGoal: number
  lastBackupAt?: number
}

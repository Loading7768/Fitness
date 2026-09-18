import { z } from 'zod'

const categorySchema = z.enum([
  'chest',
  'back',
  'shoulders',
  'legs',
  'arms',
  'core',
  'cardio',
  'full_body',
])
const equipmentSchema = z.enum([
  'barbell',
  'dumbbell',
  'machine',
  'bodyweight',
  'cable',
  'band',
  'kettlebell',
  'other',
])
const trackingTypeSchema = z.enum(['weight_reps', 'reps_only', 'time', 'weight_time'])
const setTypeSchema = z.enum(['warmup', 'working', 'dropset'])
const sessionStatusSchema = z.enum(['in_progress', 'completed'])

const exerciseSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  category: categorySchema,
  equipment: equipmentSchema,
  trackingType: trackingTypeSchema,
  isCustom: z.boolean(),
  isArchived: z.boolean(),
  notes: z.string().optional(),
})

const setSchema = z.object({
  id: z.number().optional(),
  sessionId: z.number(),
  exerciseId: z.number(),
  orderIndex: z.number(),
  supersetGroupId: z.string().optional(),
  setType: setTypeSchema,
  setNumber: z.number(),
  weight: z.number().optional(),
  reps: z.number().optional(),
  durationSec: z.number().optional(),
  rpe: z.number().optional(),
  restSec: z.number().optional(),
  toFailure: z.boolean(),
  completed: z.boolean(),
  notes: z.string().optional(),
  completedAt: z.number().optional(),
})

const sessionSchema = z.object({
  id: z.number().optional(),
  date: z.number(),
  endTime: z.number().optional(),
  label: z.string().optional(),
  routineId: z.number().optional(),
  bodyweightAtSession: z.number().optional(),
  notes: z.string().optional(),
  status: sessionStatusSchema,
})

const routineExerciseSchema = z.object({
  exerciseId: z.number(),
  targetSets: z.number(),
  targetRepsMin: z.number().optional(),
  targetRepsMax: z.number().optional(),
  targetWeight: z.number().optional(),
  supersetGroupId: z.string().optional(),
})

const routineSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  description: z.string().optional(),
  exercises: z.array(routineExerciseSchema),
  scheduledWeekdays: z.array(z.number()).optional(),
})

const bodyMetricSchema = z.object({
  id: z.number().optional(),
  date: z.number(),
  weightKg: z.number().optional(),
  bodyFatPct: z.number().optional(),
  measurements: z.record(z.string(), z.number()).optional(),
})

const settingsSchema = z.object({
  id: z.number().optional(),
  unit: z.enum(['kg', 'lb']),
  weekStartsOn: z.union([z.literal(0), z.literal(1)]),
  restTimerDefaultSec: z.number(),
  restTimerSoundOn: z.boolean(),
  restTimerVibrateOn: z.boolean(),
  includePhotosInBackup: z.boolean(),
  weeklyGoal: z.number(),
  lastBackupAt: z.number().optional(),
})

export const backupFileSchema = z.object({
  version: z.literal(1),
  exportedAt: z.number(),
  exercises: z.array(exerciseSchema),
  sessions: z.array(sessionSchema),
  sets: z.array(setSchema),
  routines: z.array(routineSchema),
  bodyMetrics: z.array(bodyMetricSchema),
  settings: z.array(settingsSchema),
})

export type BackupFile = z.infer<typeof backupFileSchema>

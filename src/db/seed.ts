import { db } from './db'
import type { Equipment, Exercise, MuscleCategory, TrackingType } from './types'

function ex(
  name: string,
  category: MuscleCategory,
  equipment: Equipment,
  trackingType: TrackingType = 'weight_reps',
): Omit<Exercise, 'id'> {
  return { name, category, equipment, trackingType, isCustom: false, isArchived: false }
}

const DEFAULT_EXERCISES: Omit<Exercise, 'id'>[] = [
  // Chest
  ex('槓鈴臥推', 'chest', 'barbell'),
  ex('啞鈴臥推', 'chest', 'dumbbell'),
  ex('上斜槓鈴臥推', 'chest', 'barbell'),
  ex('上斜啞鈴臥推', 'chest', 'dumbbell'),
  ex('雙槓撐體', 'chest', 'bodyweight', 'reps_only'),
  ex('繩索夾胸', 'chest', 'cable'),
  ex('蝴蝶機夾胸', 'chest', 'machine'),
  ex('伏地挺身', 'chest', 'bodyweight', 'reps_only'),
  // Back
  ex('硬舉', 'back', 'barbell'),
  ex('槓鈴划船', 'back', 'barbell'),
  ex('單臂啞鈴划船', 'back', 'dumbbell'),
  ex('滑輪下拉', 'back', 'cable'),
  ex('引體向上', 'back', 'bodyweight', 'reps_only'),
  ex('坐姿划船', 'back', 'machine'),
  ex('直臂下拉', 'back', 'cable'),
  ex('羅馬尼亞硬舉', 'back', 'barbell'),
  // Shoulders
  ex('站姿槓鈴推舉', 'shoulders', 'barbell'),
  ex('坐姿啞鈴肩推', 'shoulders', 'dumbbell'),
  ex('側平舉', 'shoulders', 'dumbbell'),
  ex('前平舉', 'shoulders', 'dumbbell'),
  ex('反向飛鳥', 'shoulders', 'dumbbell'),
  ex('面拉', 'shoulders', 'cable'),
  ex('聳肩', 'shoulders', 'barbell'),
  // Legs
  ex('深蹲', 'legs', 'barbell'),
  ex('腿推', 'legs', 'machine'),
  ex('保加利亞分腿蹲', 'legs', 'dumbbell'),
  ex('腿彎舉', 'legs', 'machine'),
  ex('腿伸展', 'legs', 'machine'),
  ex('臀推', 'legs', 'barbell'),
  ex('弓箭步', 'legs', 'dumbbell'),
  ex('小腿提舉', 'legs', 'machine'),
  ex('相撲硬舉', 'legs', 'barbell'),
  // Arms
  ex('槓鈴彎舉', 'arms', 'barbell'),
  ex('啞鈴彎舉', 'arms', 'dumbbell'),
  ex('錘式彎舉', 'arms', 'dumbbell'),
  ex('三頭下壓', 'arms', 'cable'),
  ex('窄握臥推', 'arms', 'barbell'),
  ex('法式彎舉', 'arms', 'barbell'),
  ex('牧師椅彎舉', 'arms', 'machine'),
  // Core
  ex('棒式', 'core', 'bodyweight', 'time'),
  ex('捲腹', 'core', 'bodyweight', 'reps_only'),
  ex('懸吊抬腿', 'core', 'bodyweight', 'reps_only'),
  ex('俄羅斯轉體', 'core', 'bodyweight', 'reps_only'),
  ex('負重側平板', 'core', 'other', 'weight_time'),
  // Cardio / full body
  ex('跑步機', 'cardio', 'other', 'time'),
  ex('划船機', 'cardio', 'other', 'time'),
  ex('壺鈴擺盪', 'full_body', 'kettlebell'),
  ex('波比跳', 'full_body', 'bodyweight', 'reps_only'),
]

export async function seedDefaultExercises() {
  const count = await db.exercises.count()
  if (count > 0) return
  await db.exercises.bulkAdd(DEFAULT_EXERCISES)
}

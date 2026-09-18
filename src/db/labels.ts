import type { Equipment, MuscleCategory, SetType, TrackingType } from './types'

export const CATEGORY_LABEL: Record<MuscleCategory, string> = {
  chest: '胸',
  back: '背',
  shoulders: '肩',
  legs: '腿',
  arms: '手臂',
  core: '核心',
  cardio: '有氧',
  full_body: '全身',
}

export const CATEGORY_COLOR: Record<MuscleCategory, string> = {
  chest: 'bg-rose-500',
  back: 'bg-blue-500',
  shoulders: 'bg-amber-500',
  legs: 'bg-emerald-500',
  arms: 'bg-violet-500',
  core: 'bg-cyan-500',
  cardio: 'bg-orange-500',
  full_body: 'bg-fuchsia-500',
}

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barbell: '槓鈴',
  dumbbell: '啞鈴',
  machine: '機械',
  bodyweight: '自身體重',
  cable: '滑輪',
  band: '彈力帶',
  kettlebell: '壺鈴',
  other: '其他',
}

export const TRACKING_TYPE_LABEL: Record<TrackingType, string> = {
  weight_reps: '重量+次數',
  reps_only: '只計次數',
  time: '計時',
  weight_time: '負重+計時',
}

export const SET_TYPE_LABEL: Record<SetType, string> = {
  warmup: '熱身',
  working: '正式組',
  dropset: '遞減組',
}

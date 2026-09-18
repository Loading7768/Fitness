import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, PageHeader } from '../components/ui'
import { db } from '../db/db'
import { CATEGORY_LABEL, EQUIPMENT_LABEL, TRACKING_TYPE_LABEL } from '../db/labels'
import type { Equipment, MuscleCategory, TrackingType } from '../db/types'

export default function ExerciseForm() {
  const { id } = useParams()
  const isNew = id === 'new' || id === undefined
  const exerciseId = isNew ? undefined : Number(id)
  const navigate = useNavigate()

  const existing = useLiveQuery(
    () => (exerciseId ? db.exercises.get(exerciseId) : undefined),
    [exerciseId],
  )

  const [name, setName] = useState('')
  const [category, setCategory] = useState<MuscleCategory>('chest')
  const [equipment, setEquipment] = useState<Equipment>('barbell')
  const [trackingType, setTrackingType] = useState<TrackingType>('weight_reps')
  const [notes, setNotes] = useState('')
  const [loaded, setLoaded] = useState(isNew)

  if (existing && !loaded) {
    setName(existing.name)
    setCategory(existing.category)
    setEquipment(existing.equipment)
    setTrackingType(existing.trackingType)
    setNotes(existing.notes ?? '')
    setLoaded(true)
  }

  async function save() {
    if (!name.trim()) return
    if (exerciseId) {
      await db.exercises.update(exerciseId, { name, category, equipment, trackingType, notes })
    } else {
      await db.exercises.add({
        name,
        category,
        equipment,
        trackingType,
        notes,
        isCustom: true,
        isArchived: false,
      })
    }
    navigate(-1)
  }

  async function archive() {
    if (!exerciseId) return
    if (!confirm('封存這個動作？歷史紀錄仍會保留，但動作庫不會再顯示。')) return
    await db.exercises.update(exerciseId, { isArchived: true })
    navigate(-1)
  }

  return (
    <div>
      <PageHeader title={isNew ? '新增動作' : '編輯動作'} />
      <div className="flex flex-col gap-3">
        <label className="text-sm text-neutral-400">
          名稱
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1" />
        </label>

        <label className="text-sm text-neutral-400">
          肌群
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as MuscleCategory)}
            className="w-full mt-1"
          >
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-neutral-400">
          器材
          <select
            value={equipment}
            onChange={(e) => setEquipment(e.target.value as Equipment)}
            className="w-full mt-1"
          >
            {Object.entries(EQUIPMENT_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-neutral-400">
          記錄方式
          <select
            value={trackingType}
            onChange={(e) => setTrackingType(e.target.value as TrackingType)}
            className="w-full mt-1"
          >
            {Object.entries(TRACKING_TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-neutral-400">
          備註（選填）
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full mt-1" rows={2} />
        </label>

        <Button onClick={save} className="mt-2">
          儲存
        </Button>
        {!isNew && (
          <Button variant="danger" onClick={archive}>
            封存動作
          </Button>
        )}
      </div>
    </div>
  )
}

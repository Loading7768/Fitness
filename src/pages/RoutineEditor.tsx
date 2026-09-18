import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { scheduleBackup } from '../backup/backupScheduler'
import { Button, PageHeader } from '../components/ui'
import { db } from '../db/db'
import type { Exercise, Routine, RoutineExercise } from '../db/types'
import ExercisePicker from '../workout/ExercisePicker'

const WEEKDAY_LABEL = ['日', '一', '二', '三', '四', '五', '六']

export default function RoutineEditor() {
  const { id } = useParams()
  const isNew = id === 'new' || id === undefined
  const routineId = isNew ? undefined : Number(id)
  const navigate = useNavigate()

  const existing = useLiveQuery(() => (routineId ? db.routines.get(routineId) : undefined), [routineId])
  const exerciseMap = useLiveQuery(async () => {
    const all = await db.exercises.toArray()
    return new Map(all.map((e) => [e.id!, e]))
  }, [])

  const [loaded, setLoaded] = useState(isNew)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [weekdays, setWeekdays] = useState<number[]>([])
  const [exercises, setExercises] = useState<RoutineExercise[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)

  if (existing && !loaded) {
    setName(existing.name)
    setDescription(existing.description ?? '')
    setWeekdays(existing.scheduledWeekdays ?? [])
    setExercises(existing.exercises)
    setLoaded(true)
  }

  if (!exerciseMap) return null

  function toggleWeekday(d: number) {
    setWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))
  }

  function addExercise(exercise: Exercise) {
    setExercises((prev) => [...prev, { exerciseId: exercise.id!, targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 }])
    setPickerOpen(false)
  }

  function updateExercise(index: number, patch: Partial<RoutineExercise>) {
    setExercises((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)))
  }

  function removeExercise(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index))
  }

  function move(index: number, dir: -1 | 1) {
    setExercises((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  async function save() {
    if (!name.trim() || exercises.length === 0) return
    const payload: Omit<Routine, 'id'> = {
      name,
      description,
      exercises,
      scheduledWeekdays: weekdays,
    }
    if (routineId) {
      await db.routines.update(routineId, payload)
    } else {
      await db.routines.add(payload)
    }
    scheduleBackup()
    navigate('/routines')
  }

  async function remove() {
    if (!routineId) return
    if (!confirm('刪除這個範本？不會影響已經記錄過的訓練歷史。')) return
    await db.routines.delete(routineId)
    navigate('/routines')
  }

  return (
    <div className="pb-10">
      <PageHeader title={isNew ? '新增範本' : '編輯範本'} />

      <label className="text-sm text-neutral-400 block mb-3">
        名稱
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1" />
      </label>

      <label className="text-sm text-neutral-400 block mb-3">
        說明（選填）
        <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full mt-1" />
      </label>

      <div className="mb-4">
        <p className="text-sm text-neutral-400 mb-1">排定星期（選填）</p>
        <div className="flex gap-2">
          {WEEKDAY_LABEL.map((label, d) => (
            <button
              key={d}
              onClick={() => toggleWeekday(d)}
              className={`w-9 h-9 rounded-full text-sm ${
                weekdays.includes(d) ? 'bg-violet-600 text-white' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-neutral-400 mb-2">動作</p>
      <div className="flex flex-col gap-2 mb-3">
        {exercises.map((re, i) => {
          const exercise = exerciseMap.get(re.exerciseId)
          return (
            <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-neutral-100 font-medium">{exercise?.name ?? '未知動作'}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => move(i, -1)} aria-label="上移">
                    <ArrowUp size={16} className="text-neutral-500" />
                  </button>
                  <button onClick={() => move(i, 1)} aria-label="下移">
                    <ArrowDown size={16} className="text-neutral-500" />
                  </button>
                  <button onClick={() => removeExercise(i)} aria-label="移除">
                    <Trash2 size={16} className="text-neutral-500" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <span>組數</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={re.targetSets}
                  onChange={(e) => updateExercise(i, { targetSets: Number(e.target.value) })}
                  className="w-14 !py-1"
                />
                <span>次數</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={re.targetRepsMin ?? ''}
                  onChange={(e) => updateExercise(i, { targetRepsMin: Number(e.target.value) })}
                  className="w-12 !py-1"
                />
                <span>~</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={re.targetRepsMax ?? ''}
                  onChange={(e) => updateExercise(i, { targetRepsMax: Number(e.target.value) })}
                  className="w-12 !py-1"
                />
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={() => setPickerOpen(true)}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-neutral-700 rounded-xl py-3 text-neutral-400 mb-6"
      >
        <Plus size={18} /> 新增動作
      </button>

      <Button onClick={save} className="w-full mb-2">
        儲存範本
      </Button>
      {!isNew && (
        <Button variant="danger" onClick={remove} className="w-full">
          刪除範本
        </Button>
      )}

      {pickerOpen && <ExercisePicker onPick={addExercise} onClose={() => setPickerOpen(false)} />}
    </div>
  )
}

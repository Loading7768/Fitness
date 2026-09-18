import { useLiveQuery } from 'dexie-react-hooks'
import { Check, Flame, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { scheduleBackup } from '../backup/backupScheduler'
import { Button } from '../components/ui'
import { db, getSettings } from '../db/db'
import type { AppSettings, Exercise, SetType, WorkoutSet } from '../db/types'
import ExercisePicker from '../workout/ExercisePicker'
import { computeNewPRs, getLastPerformance } from '../workout/prHelpers'
import RestTimer from '../workout/RestTimer'
import { useWakeLock } from '../workout/useWakeLock'

interface Block {
  orderIndex: number
  exerciseId: number
  sets: WorkoutSet[]
}

function fmtElapsed(startMs: number) {
  const s = Math.floor((Date.now() - startMs) / 1000)
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

export default function ActiveWorkout() {
  const { id } = useParams()
  const sessionId = Number(id)
  const navigate = useNavigate()

  useWakeLock(true)

  const [settings, setSettings] = useState<AppSettings | null>(null)
  useEffect(() => {
    getSettings().then(setSettings)
  }, [])

  const session = useLiveQuery(() => db.sessions.get(sessionId), [sessionId])
  const routine = useLiveQuery(
    () => (session?.routineId ? db.routines.get(session.routineId) : undefined),
    [session?.routineId],
  )
  const rawSets = useLiveQuery(() => db.sets.where('sessionId').equals(sessionId).toArray(), [sessionId])
  const exerciseMap = useLiveQuery(async () => {
    const all = await db.exercises.toArray()
    return new Map(all.map((e) => [e.id!, e]))
  }, [])

  const [pickerOpen, setPickerOpen] = useState(false)
  const [restSeconds, setRestSeconds] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const blocks: Block[] = useMemo(() => {
    if (!rawSets) return []
    const map = new Map<number, WorkoutSet[]>()
    for (const s of rawSets) {
      if (!map.has(s.orderIndex)) map.set(s.orderIndex, [])
      map.get(s.orderIndex)!.push(s)
    }
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([orderIndex, sets]) => ({
        orderIndex,
        exerciseId: sets[0].exerciseId,
        sets: sets.sort((a, b) => a.setNumber - b.setNumber),
      }))
  }, [rawSets])

  // First render from a routine: seed one block per routine exercise if nothing logged yet.
  const seededRef = useState({ done: false })[0]
  useEffect(() => {
    if (seededRef.done) return
    if (!routine || !rawSets) return
    if (rawSets.length > 0) {
      seededRef.done = true
      return
    }
    seededRef.done = true
    ;(async () => {
      for (let i = 0; i < routine.exercises.length; i++) {
        const re = routine.exercises[i]
        await db.sets.add({
          sessionId,
          exerciseId: re.exerciseId,
          orderIndex: i,
          setNumber: 1,
          setType: 'working',
          weight: re.targetWeight,
          reps: re.targetRepsMax,
          toFailure: false,
          completed: false,
        })
      }
    })()
  }, [routine, rawSets, sessionId, seededRef])

  if (!session || !settings || !exerciseMap) return null

  async function addExercise(exercise: Exercise) {
    const nextIndex = blocks.length ? Math.max(...blocks.map((b) => b.orderIndex)) + 1 : 0
    await db.sets.add({
      sessionId,
      exerciseId: exercise.id!,
      orderIndex: nextIndex,
      setNumber: 1,
      setType: 'working',
      toFailure: false,
      completed: false,
    })
    setPickerOpen(false)
  }

  async function addSet(block: Block) {
    const last = block.sets[block.sets.length - 1]
    await db.sets.add({
      sessionId,
      exerciseId: block.exerciseId,
      orderIndex: block.orderIndex,
      setNumber: block.sets.length + 1,
      setType: 'working',
      weight: last?.weight,
      reps: last?.reps,
      durationSec: last?.durationSec,
      toFailure: false,
      completed: false,
    })
  }

  async function completeSet(set: WorkoutSet) {
    await db.sets.update(set.id!, { completed: true, completedAt: Date.now() })
    if ('vibrate' in navigator) navigator.vibrate(80)
    setRestSeconds(settings?.restTimerDefaultSec ?? 90)
    scheduleBackup()
  }

  async function removeBlock(block: Block) {
    await db.sets.bulkDelete(block.sets.map((s) => s.id!))
  }

  async function finishWorkout() {
    await db.sessions.update(sessionId, { status: 'completed', endTime: Date.now() })
    const prs = await computeNewPRs(sessionId)
    scheduleBackup()
    navigate(`/history/${sessionId}`, { replace: true, state: { newPRs: prs } })
  }

  const totalSets = blocks.reduce((n, b) => n + b.sets.length, 0)
  const canFinish = totalSets > 0 && blocks.some((b) => b.sets.some((s) => s.completed))

  return (
    <div className="pb-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-100">
            {routine?.name ?? '訓練中'}
          </h1>
          <p className="text-sm text-neutral-500">已進行 {fmtElapsed(session.date)}</p>
        </div>
        <Button onClick={finishWorkout} disabled={!canFinish}>
          完成訓練
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {blocks.map((block) => (
          <ExerciseBlockCard
            key={block.orderIndex}
            block={block}
            exercise={exerciseMap.get(block.exerciseId)}
            sessionId={sessionId}
            unit={settings.unit}
            onAddSet={() => addSet(block)}
            onCompleteSet={completeSet}
            onRemoveBlock={() => removeBlock(block)}
          />
        ))}
      </div>

      <button
        onClick={() => setPickerOpen(true)}
        className="mt-4 w-full flex items-center justify-center gap-2 border-2 border-dashed border-neutral-700 rounded-xl py-3 text-neutral-400"
      >
        <Plus size={18} /> 新增動作
      </button>

      {pickerOpen && <ExercisePicker onPick={addExercise} onClose={() => setPickerOpen(false)} />}

      {restSeconds !== null && (
        <RestTimer
          key={restSeconds + Date.now()}
          seconds={restSeconds}
          soundOn={settings.restTimerSoundOn}
          vibrateOn={settings.restTimerVibrateOn}
          onDismiss={() => setRestSeconds(null)}
        />
      )}
      {/* keep `now` tick alive for elapsed-time display */}
      <span className="hidden">{now}</span>
    </div>
  )
}

function ExerciseBlockCard({
  block,
  exercise,
  sessionId,
  unit,
  onAddSet,
  onCompleteSet,
  onRemoveBlock,
}: {
  block: Block
  exercise: Exercise | undefined
  sessionId: number
  unit: 'kg' | 'lb'
  onAddSet: () => void
  onCompleteSet: (set: WorkoutSet) => void
  onRemoveBlock: () => void
}) {
  const [lastPerf, setLastPerf] = useState<WorkoutSet | null>(null)
  useEffect(() => {
    if (exercise?.id) getLastPerformance(exercise.id, sessionId).then(setLastPerf)
  }, [exercise?.id, sessionId])

  if (!exercise) return null
  const trackingType = exercise.trackingType

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-neutral-100">{exercise.name}</h3>
        <button onClick={onRemoveBlock} aria-label="移除動作">
          <Trash2 size={16} className="text-neutral-500" />
        </button>
      </div>
      {lastPerf && (
        <p className="text-xs text-neutral-500 mb-2">
          上次：{lastPerf.weight != null ? `${lastPerf.weight}${unit} × ` : ''}
          {lastPerf.reps ?? lastPerf.durationSec ? `${lastPerf.reps ?? lastPerf.durationSec}` : ''}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {block.sets.map((set) => (
          <SetRow key={set.id} set={set} trackingType={trackingType} unit={unit} onComplete={() => onCompleteSet(set)} />
        ))}
      </div>

      <button onClick={onAddSet} className="mt-2 text-sm text-violet-400 flex items-center gap-1">
        <Plus size={14} /> 加一組
      </button>
    </div>
  )
}

function Stepper({
  value,
  step,
  onChange,
  suffix,
}: {
  value: number | undefined
  step: number
  onChange: (v: number) => void
  suffix?: string
}) {
  return (
    <div className="flex items-center gap-1 bg-neutral-800 rounded-lg">
      <button
        onClick={() => onChange(Math.max(0, (value ?? 0) - step))}
        className="px-2.5 py-2 text-neutral-300"
      >
        −
      </button>
      <input
        type="number"
        inputMode="decimal"
        value={value ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="!bg-transparent !border-0 w-12 text-center px-0"
      />
      {suffix && <span className="text-xs text-neutral-500 pr-1">{suffix}</span>}
      <button onClick={() => onChange((value ?? 0) + step)} className="px-2.5 py-2 text-neutral-300">
        +
      </button>
    </div>
  )
}

function SetRow({
  set,
  trackingType,
  unit,
  onComplete,
}: {
  set: WorkoutSet
  trackingType: Exercise['trackingType']
  unit: 'kg' | 'lb'
  onComplete: () => void
}) {
  const weightStep = unit === 'kg' ? 2.5 : 5
  const [setType, setSetType] = useState<SetType>(set.setType)

  function patch(fields: Partial<WorkoutSet>) {
    db.sets.update(set.id!, fields)
  }

  return (
    <div className={`flex items-center gap-2 ${set.completed ? 'opacity-60' : ''}`}>
      <button
        onClick={() => {
          const next: SetType = setType === 'warmup' ? 'working' : 'warmup'
          setSetType(next)
          patch({ setType: next })
        }}
        className={`text-xs w-6 shrink-0 ${setType === 'warmup' ? 'text-amber-400' : 'text-neutral-600'}`}
        title="標記熱身組"
      >
        {set.setNumber}
      </button>

      {(trackingType === 'weight_reps' || trackingType === 'weight_time') && (
        <Stepper value={set.weight} step={weightStep} onChange={(v) => patch({ weight: v })} suffix={unit} />
      )}

      {(trackingType === 'weight_reps' || trackingType === 'reps_only') && (
        <Stepper value={set.reps} step={1} onChange={(v) => patch({ reps: v })} suffix="次" />
      )}

      {(trackingType === 'time' || trackingType === 'weight_time') && (
        <Stepper value={set.durationSec} step={10} onChange={(v) => patch({ durationSec: v })} suffix="秒" />
      )}

      <button
        onClick={() => (set.completed ? undefined : onComplete())}
        disabled={set.completed}
        className={`ml-auto p-2 rounded-lg ${
          set.completed ? 'bg-emerald-600/30 text-emerald-400' : 'bg-neutral-800 text-neutral-400'
        }`}
      >
        <Check size={16} />
      </button>
      {setType !== 'warmup' && set.toFailure && <Flame size={14} className="text-orange-400" />}
    </div>
  )
}

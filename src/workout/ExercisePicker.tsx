import { useLiveQuery } from 'dexie-react-hooks'
import { X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { db } from '../db/db'
import { CATEGORY_COLOR, CATEGORY_LABEL } from '../db/labels'
import type { Exercise } from '../db/types'

export default function ExercisePicker({
  onPick,
  onClose,
}: {
  onPick: (exercise: Exercise) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const exercises = useLiveQuery(() => db.exercises.filter((e) => !e.isArchived).toArray(), [])

  const filtered = useMemo(() => {
    if (!exercises) return []
    return exercises
      .filter((e) => e.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [exercises, query])

  return (
    <div className="fixed inset-0 z-40 bg-black/60 flex items-end justify-center">
      <div className="w-full max-w-[480px] bg-neutral-950 rounded-t-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 className="font-semibold text-neutral-100">選擇動作</h2>
          <button onClick={onClose} aria-label="關閉">
            <X size={22} className="text-neutral-400" />
          </button>
        </div>
        <div className="p-4 pb-2">
          <input
            autoFocus
            placeholder="搜尋動作..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="overflow-y-auto flex-1 px-4 pb-4 flex flex-col gap-2">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onPick(ex)}
              className="flex items-center gap-3 bg-neutral-900 rounded-xl p-3 text-left"
            >
              <span className={`w-2 h-8 rounded-full ${CATEGORY_COLOR[ex.category]}`} />
              <div className="text-neutral-100">{ex.name}</div>
              <div className="ml-auto text-xs text-neutral-500">{CATEGORY_LABEL[ex.category]}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

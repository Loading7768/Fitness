import { useLiveQuery } from 'dexie-react-hooks'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, EmptyState, PageHeader } from '../components/ui'
import { db } from '../db/db'
import { CATEGORY_COLOR, CATEGORY_LABEL, EQUIPMENT_LABEL } from '../db/labels'
import type { MuscleCategory } from '../db/types'

const CATEGORIES = Object.keys(CATEGORY_LABEL) as MuscleCategory[]

export default function Exercises() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<MuscleCategory | 'all'>('all')

  const exercises = useLiveQuery(
    () => db.exercises.filter((e) => !e.isArchived).toArray(),
    [],
  )

  const filtered = useMemo(() => {
    if (!exercises) return []
    return exercises
      .filter((e) => category === 'all' || e.category === category)
      .filter((e) => e.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [exercises, category, query])

  return (
    <div>
      <PageHeader
        title="動作庫"
        action={
          <Button onClick={() => navigate('/exercises/new')} className="!p-2">
            <Plus size={20} />
          </Button>
        }
      />

      <input
        placeholder="搜尋動作..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full mb-3"
      />

      <div className="flex gap-2 overflow-x-auto mb-4 -mx-4 px-4 pb-1">
        {(['all', ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
              category === c ? 'bg-violet-600 text-white' : 'bg-neutral-800 text-neutral-300'
            }`}
          >
            {c === 'all' ? '全部' : CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <EmptyState text="沒有符合的動作" />}

      <div className="flex flex-col gap-2">
        {filtered.map((ex) => (
          <button
            key={ex.id}
            onClick={() => navigate(`/exercises/${ex.id}`)}
            className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-left"
          >
            <span className={`w-2 h-8 rounded-full ${CATEGORY_COLOR[ex.category]}`} />
            <div className="flex-1">
              <div className="text-neutral-100 font-medium">{ex.name}</div>
              <div className="text-xs text-neutral-500">
                {CATEGORY_LABEL[ex.category]} · {EQUIPMENT_LABEL[ex.equipment]}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

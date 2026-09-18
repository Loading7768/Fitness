import { useLiveQuery } from 'dexie-react-hooks'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, EmptyState, PageHeader } from '../components/ui'
import { db } from '../db/db'

const WEEKDAY_LABEL = ['日', '一', '二', '三', '四', '五', '六']

export default function Routines() {
  const navigate = useNavigate()
  const routines = useLiveQuery(() => db.routines.toArray(), [])

  return (
    <div>
      <PageHeader
        title="訓練範本"
        action={
          <Button onClick={() => navigate('/routines/new')} className="!p-2">
            <Plus size={20} />
          </Button>
        }
      />

      {routines && routines.length === 0 && <EmptyState text="還沒有範本，建立一個常用菜單吧" />}

      <div className="flex flex-col gap-2">
        {routines?.map((r) => (
          <Card
            key={r.id}
            className="cursor-pointer"
            onClick={() => navigate(`/routines/${r.id}`)}
          >
            <div className="font-medium text-neutral-100">{r.name}</div>
            <div className="text-xs text-neutral-500 mt-1">
              {r.exercises.length} 個動作
              {r.scheduledWeekdays && r.scheduledWeekdays.length > 0 && (
                <> · 星期{r.scheduledWeekdays.map((d) => WEEKDAY_LABEL[d]).join('、')}</>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

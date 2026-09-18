import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, EmptyState, PageHeader } from '../components/ui'
import { db } from '../db/db'
import { CATEGORY_COLOR } from '../db/labels'
import type { MuscleCategory } from '../db/types'
import { summarizeSession, type SessionSummary } from '../history/historyHelpers'

function fmtDate(ms: number) {
  const d = new Date(ms)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function monthKey(ms: number) {
  const d = new Date(ms)
  return `${d.getFullYear()}年${d.getMonth() + 1}月`
}

export default function History() {
  const navigate = useNavigate()
  const sessions = useLiveQuery(
    () =>
      db.sessions
        .filter((s) => s.status === 'completed')
        .reverse()
        .sortBy('date'),
    [],
  )
  const [summaries, setSummaries] = useState<SessionSummary[]>([])

  useEffect(() => {
    if (!sessions) return
    Promise.all(sessions.map(summarizeSession)).then(setSummaries)
  }, [sessions])

  const grouped = summaries.reduce<Record<string, SessionSummary[]>>((acc, s) => {
    const key = monthKey(s.session.date)
    ;(acc[key] ??= []).push(s)
    return acc
  }, {})

  return (
    <div>
      <PageHeader title="歷史紀錄" />

      {summaries.length === 0 && <EmptyState text="還沒有已完成的訓練" />}

      {Object.entries(grouped).map(([month, items]) => (
        <div key={month} className="mb-5">
          <h2 className="text-sm text-neutral-500 mb-2">{month}</h2>
          <div className="flex flex-col gap-2">
            {items.map(({ session, totalVolume, durationMin, exerciseCount, categories }) => (
              <Card
                key={session.id}
                className="cursor-pointer"
                onClick={() => navigate(`/history/${session.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-100 font-medium">{fmtDate(session.date)}</span>
                    <span className="text-neutral-100">{session.label ?? '訓練'}</span>
                  </div>
                  <div className="flex gap-1">
                    {categories.map((c) => (
                      <span key={c} className={`w-2 h-2 rounded-full ${CATEGORY_COLOR[c as MuscleCategory]}`} />
                    ))}
                  </div>
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  {exerciseCount} 個動作 · {durationMin} 分鐘 · 總量 {Math.round(totalVolume)}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

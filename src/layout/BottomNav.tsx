import { Dumbbell, History, Home, LineChart, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: '首頁', icon: Home },
  { to: '/routines', label: '範本', icon: Dumbbell },
  { to: '/history', label: '歷史', icon: History },
  { to: '/stats', label: '統計', icon: LineChart },
  { to: '/settings', label: '設定', icon: Settings },
]

export default function BottomNav() {
  return (
    <nav className="sticky bottom-0 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-2.5 text-xs ${
              isActive ? 'text-violet-400' : 'text-neutral-500'
            }`
          }
        >
          <Icon size={22} strokeWidth={2} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

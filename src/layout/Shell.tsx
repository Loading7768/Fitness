import { useLocation } from 'react-router-dom'
import BottomNav from './BottomNav'

/** Active-workout screens hide the bottom nav for a distraction-free, full-focus logging view. */
function isFocusMode(pathname: string) {
  return pathname.startsWith('/workout/')
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const focusMode = isFocusMode(pathname)

  return (
    <div className="flex flex-col min-h-dvh">
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-6">{children}</main>
      {!focusMode && <BottomNav />}
    </div>
  )
}

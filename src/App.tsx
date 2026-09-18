import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { checkAndBackupIfStale } from './backup/backupScheduler'
import Shell from './layout/Shell'
import ActiveWorkout from './pages/ActiveWorkout'
import BodyMetrics from './pages/BodyMetrics'
import ExerciseForm from './pages/ExerciseForm'
import Exercises from './pages/Exercises'
import ExerciseStats from './pages/ExerciseStats'
import History from './pages/History'
import Home from './pages/Home'
import Routines from './pages/Routines'
import RoutineEditor from './pages/RoutineEditor'
import SessionDetail from './pages/SessionDetail'
import Settings from './pages/Settings'
import Stats from './pages/Stats'
import WorkoutStart from './pages/WorkoutStart'

export default function App() {
  useEffect(() => {
    checkAndBackupIfStale()
  }, [])

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/workout" element={<WorkoutStart />} />
        <Route path="/workout/:id" element={<ActiveWorkout />} />
        <Route path="/exercises" element={<Exercises />} />
        <Route path="/exercises/:id" element={<ExerciseForm />} />
        <Route path="/routines" element={<Routines />} />
        <Route path="/routines/:id" element={<RoutineEditor />} />
        <Route path="/history" element={<History />} />
        <Route path="/history/:id" element={<SessionDetail />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/stats/:exerciseId" element={<ExerciseStats />} />
        <Route path="/body" element={<BodyMetrics />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Shell>
  )
}

import { Minus, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

function beep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 880
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.stop(ctx.currentTime + 0.4)
  } catch {
    // Audio can fail if not allowed yet — ignore, vibration still fires.
  }
}

export default function RestTimer({
  seconds,
  soundOn,
  vibrateOn,
  onDismiss,
}: {
  seconds: number
  soundOn: boolean
  vibrateOn: boolean
  onDismiss: () => void
}) {
  const [endAt, setEndAt] = useState(() => Date.now() + seconds * 1000)
  const [remaining, setRemaining] = useState(seconds)
  const firedRef = useRef(false)

  useEffect(() => {
    const id = setInterval(() => {
      const rem = Math.max(0, Math.round((endAt - Date.now()) / 1000))
      setRemaining(rem)
      if (rem === 0 && !firedRef.current) {
        firedRef.current = true
        if (vibrateOn && 'vibrate' in navigator) navigator.vibrate([300, 100, 300])
        if (soundOn) beep()
      }
    }, 250)
    return () => clearInterval(id)
  }, [endAt, soundOn, vibrateOn])

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')

  return (
    <div className="fixed inset-x-0 bottom-16 mx-auto max-w-[480px] px-4 z-30">
      <div className="bg-violet-600 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
        <div className="text-3xl font-mono font-bold text-white tabular-nums w-20">
          {mm}:{ss}
        </div>
        <button
          onClick={() => setEndAt((e) => e - 15000)}
          className="p-2 bg-violet-700 rounded-lg text-white"
          aria-label="減少15秒"
        >
          <Minus size={18} />
        </button>
        <button
          onClick={() => setEndAt((e) => e + 30000)}
          className="p-2 bg-violet-700 rounded-lg text-white"
          aria-label="增加30秒"
        >
          <Plus size={18} />
        </button>
        <div className="flex-1" />
        <button onClick={onDismiss} className="p-2 text-white" aria-label="跳過休息">
          <X size={20} />
        </button>
      </div>
    </div>
  )
}

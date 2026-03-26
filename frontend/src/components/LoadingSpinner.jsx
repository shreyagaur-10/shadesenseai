import { useState, useEffect, useRef } from 'react'

const STAGES = [
  { threshold: 0, message: '🔍 Detecting face landmarks' },
  { threshold: 20, message: '🎨 Extracting skin tone' },
  { threshold: 40, message: '🧬 Analyzing undertone & skin health' },
  { threshold: 60, message: '💄 Matching products' },
  { threshold: 80, message: '✨ Generating your look' },
]

export default function LoadingSpinner() {
  const [progress, setProgress] = useState(0)
  const rafRef = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    startRef.current = performance.now()

    const animate = (now) => {
      const elapsed = now - startRef.current
      // Ease out — fast at first, slows toward 90%
      const raw = Math.min(90, (elapsed / 80) * (1 - elapsed / 20000))
      const value = Math.min(90, raw)
      setProgress(Math.max(0, Math.round(value)))
      if (value < 90) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const currentStage = [...STAGES].reverse().find((s) => progress >= s.threshold) || STAGES[0]

  return (
    <div className="mt-12 flex flex-col items-center justify-center animate-fade-in">
      {/* Spinning shade wheel */}
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-blush-light" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-gold animate-spin-slow" />
        <div className="absolute inset-2 rounded-full bg-cream flex items-center justify-center">
          <span className="text-2xl">💄</span>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-charcoal mb-2">Analyzing Your Skin...</h3>

      {/* Stage message */}
      <p className="text-sm text-charcoal-light mb-4 animate-pulse-soft">
        {currentStage.message}
      </p>

      {/* Progress bar */}
      <div className="w-64 max-w-full">
        <div className="flex justify-between text-xs text-charcoal-light mb-1">
          <span>Progress</span>
          <span className="font-semibold">{progress}%</span>
        </div>
        <div className="h-1.5 bg-blush-light/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blush via-rose to-gold rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

import { useEffect, useRef } from 'react'
import { createGlobeScene } from '../babylon/GlobeScene'
import type { PeriodData } from '../data/types'
import { useBabylonScene } from '../hooks/useBabylonScene'

interface GlobeProps {
  period: PeriodData
  className?: string
  immersive?: boolean
  selectedTexturePath?: string
}

export function Globe({
  period,
  className = '',
  immersive = false,
  selectedTexturePath,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sceneController = useBabylonScene(canvasRef, createGlobeScene)

  useEffect(() => {
    sceneController?.applyPeriod(period, selectedTexturePath)
  }, [period, selectedTexturePath, sceneController])

  return (
    <div
      className={[
        'relative overflow-hidden bg-black/20',
        immersive
          ? 'h-screen min-h-screen w-full'
          : 'min-h-[430px] rounded-[26px] border border-white/10 sm:min-h-[520px]',
        className,
      ].join(' ')}
    >
      <canvas
        ref={canvasRef}
        className={[
          'h-full w-full',
          immersive ? 'min-h-screen' : 'min-h-[430px] sm:min-h-[520px]',
        ].join(' ')}
      />

      {!immersive && (
        <div className="pointer-events-none absolute left-4 top-4 max-w-xs rounded-2xl border border-white/10 bg-black/35 px-4 py-3 backdrop-blur">
          <p className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
            Current globe texture
          </p>
          <p className="mt-2 text-sm text-stone-200">
            {period.visuals.notes ?? 'Placeholder globe texture loaded.'}
          </p>
        </div>
      )}
    </div>
  )
}
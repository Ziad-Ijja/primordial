import { useEffect, useState, type RefObject } from 'react'

export interface BabylonController {
  dispose: () => void
}

export function useBabylonScene<T extends BabylonController>(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  createController: (canvas: HTMLCanvasElement) => T,
) {
  const [controller, setController] = useState<T | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const instance = createController(canvas)
    setController(instance)

    return () => {
      instance.dispose()
    }
  }, [canvasRef, createController])

  return controller
}
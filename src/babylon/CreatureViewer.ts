import {
  ArcRotateCamera,
  Color3,
  Engine,
  HemisphericLight,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core'
import type { Species } from '../data/types'

export interface CreatureViewerController {
  setSpecies: (species: Species | null) => void
  dispose: () => void
}

export function createCreatureViewer(
  canvas: HTMLCanvasElement,
): CreatureViewerController {
  const engine = new Engine(canvas, true)
  const scene = new Scene(engine)
  const camera = new ArcRotateCamera(
    'creature-camera',
    Math.PI / 1.5,
    Math.PI / 2.3,
    5.6,
    new Vector3(0, 0, 0),
    scene,
  )
  camera.attachControl(canvas, true)

  const light = new HemisphericLight('creature-light', new Vector3(0, 1, 0), scene)
  light.intensity = 1

  const placeholder = MeshBuilder.CreateIcoSphere(
    'creature-placeholder',
    { radius: 1.2, subdivisions: 2 },
    scene,
  )
  const material = new StandardMaterial('creature-material', scene)
  material.diffuseColor = Color3.FromHexString('#9c6a33')
  material.emissiveColor = Color3.FromHexString('#3b2511')
  placeholder.material = material

  scene.onBeforeRenderObservable.add(() => {
    placeholder.rotation.y += engine.getDeltaTime() * 0.0004
  })

  engine.runRenderLoop(() => {
    scene.render()
  })

  const resize = () => {
    engine.resize()
  }

  window.addEventListener('resize', resize)

  return {
    setSpecies(species) {
      if (!species) {
        material.diffuseColor = Color3.FromHexString('#9c6a33')
        return
      }

      material.diffuseColor = Color3.FromHexString(
        species.type === 'flora' ? '#5e8f4c' : '#9c6a33',
      )
    },
    dispose() {
      window.removeEventListener('resize', resize)
      scene.dispose()
      engine.dispose()
    },
  }
}
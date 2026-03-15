import {
  ArcRotateCamera,
  Color3,
  Color4,
  Engine,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Texture,
  Vector3,
} from '@babylonjs/core'
import type { PeriodData } from '../data/types'

export interface GlobeSceneController {
  applyPeriod: (period: PeriodData, texturePathOverride?: string) => void
  dispose: () => void
}

function color4FromHex(hex: string) {
  const color = Color3.FromHexString(hex)
  return new Color4(color.r, color.g, color.b, 1)
}

export function createGlobeScene(canvas: HTMLCanvasElement): GlobeSceneController {
  const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true })
  const scene = new Scene(engine)
  scene.clearColor = color4FromHex('#000000')

  const camera = new ArcRotateCamera(
    'globe-camera',
    Math.PI / 1.7,
    Math.PI / 2.25,
    8.8,
    Vector3.Zero(),
    scene,
  )
  camera.lowerRadiusLimit = 5.4
  camera.upperRadiusLimit = 11.4
  camera.wheelPrecision = 28
  camera.attachControl(canvas, true)

  const light = new HemisphericLight('globe-light', new Vector3(0, 1, 0), scene)
  light.intensity = 0.8

  const globe = MeshBuilder.CreateSphere(
    'earth-globe',
    { diameter: 4.2, segments: 64 },
    scene,
  )
  const spaceDome = MeshBuilder.CreateSphere(
    'space-dome',
    { diameter: 120, segments: 48, sideOrientation: Mesh.BACKSIDE },
    scene,
  )
  const material = new StandardMaterial('earth-material', scene)
  const spaceMaterial = new StandardMaterial('space-material', scene)
  material.specularColor = new Color3(0.08, 0.08, 0.08)
  material.emissiveColor = new Color3(0.04, 0.05, 0.06)
  spaceMaterial.disableLighting = true
  spaceMaterial.backFaceCulling = false
  spaceMaterial.fogEnabled = false
  spaceMaterial.specularColor = Color3.Black()
  spaceMaterial.emissiveColor = Color3.White()
  globe.material = material
  spaceDome.material = spaceMaterial
  spaceDome.isPickable = false
  spaceDome.infiniteDistance = true

  let globeTexture: Texture | null = null
  let spaceTexture: Texture | null = null

  scene.onBeforeRenderObservable.add(() => {
    globe.rotation.y += engine.getDeltaTime() * 0.00008
  })

  engine.runRenderLoop(() => {
    scene.render()
  })

  const resize = () => {
    engine.resize()
  }

  window.addEventListener('resize', resize)

  return {
    applyPeriod(period, texturePathOverride) {
      scene.clearColor = color4FromHex('#000000')
      scene.fogMode = Scene.FOGMODE_EXP
      scene.fogColor = Color3.FromHexString(period.visuals.fogColor)
      scene.fogDensity = period.visuals.fogDensity
      light.intensity = period.visuals.ambientLight

      if (globeTexture) {
        globeTexture.dispose()
      }

      if (spaceTexture) {
        spaceTexture.dispose()
      }

      globeTexture = new Texture(
        texturePathOverride ?? period.visuals.globeTexture,
        scene,
        true,
        false,
      )
      spaceTexture = new Texture(period.visuals.spaceTexture, scene, true, false)
      spaceTexture.uScale = -1

      material.diffuseTexture = globeTexture
      material.ambientColor = Color3.FromHexString(period.visuals.fogColor).scale(0.35)
      material.emissiveColor = Color3.FromHexString(period.visuals.skyColor).scale(0.18)
      spaceMaterial.diffuseTexture = spaceTexture
      spaceMaterial.emissiveTexture = spaceTexture
    },
    dispose() {
      window.removeEventListener('resize', resize)
      if (globeTexture) {
        globeTexture.dispose()
      }
      if (spaceTexture) {
        spaceTexture.dispose()
      }
      scene.dispose()
      engine.dispose()
    },
  }
}
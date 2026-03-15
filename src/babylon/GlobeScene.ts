import {
  ArcRotateCamera,
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  GlowLayer,
  HemisphericLight,
  ImageProcessingConfiguration,
  Mesh,
  MeshBuilder,
  PBRMaterial,
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

function clampedAmbientIntensity(value: number) {
  return Math.max(0.05, Math.min(0.12, value))
}

export function createGlobeScene(canvas: HTMLCanvasElement): GlobeSceneController {
  const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true })
  const scene = new Scene(engine)
  scene.clearColor = color4FromHex('#000000')

  // Tonemapping — ACES léger, exposure réduite pour ne pas écraser les couleurs
  scene.imageProcessingConfiguration.toneMappingEnabled = true
  scene.imageProcessingConfiguration.toneMappingType =
    ImageProcessingConfiguration.TONEMAPPING_ACES
  scene.imageProcessingConfiguration.exposure = 1.25
  scene.imageProcessingConfiguration.contrast = 1.08

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

  // Soleil fixe — direction constante, ne suit PAS la caméra
  // Une direction fixe crée un vrai côté jour et un vrai côté nuit
  const sun = new DirectionalLight('sun-light', new Vector3(-1.2, -0.6, -0.8), scene)
  sun.intensity = 1.4
  sun.diffuse = new Color3(1.0, 0.97, 0.88) // légère teinte chaude solaire

  // Lumière ambiante — débouche le côté nuit et illumine les zones d'ombre
  const ambient = new HemisphericLight('ambient-light', new Vector3(0, 1, 0), scene)
  ambient.intensity = 0.18
  ambient.diffuse = new Color3(0.25, 0.30, 0.38)
  ambient.groundColor = new Color3(0.05, 0.05, 0.07)

  const spaceDome = MeshBuilder.CreateSphere(
    'space-dome',
    { diameter: 120, segments: 48, sideOrientation: Mesh.BACKSIDE },
    scene,
  )
  const globe = MeshBuilder.CreateSphere(
    'earth-globe',
    { diameter: 4.2, segments: 64 },
    scene,
  )
  const clouds = MeshBuilder.CreateSphere(
    'cloud-layer',
    { diameter: 4.28, segments: 64 },
    scene,
  )

  const material = new PBRMaterial('earth-material', scene)
  const spaceMaterial = new StandardMaterial('space-material', scene)
  const cloudMaterial = new StandardMaterial('cloud-material', scene)

  material.metallic = 0.0
  material.roughness = 0.88
  material.ambientColor = new Color3(0.02, 0.02, 0.02)
  material.directIntensity = 1.0
  material.environmentIntensity = 0.0
  material.backFaceCulling = true

  // la texture par cette valeur pour booster la luminosité sans toucher les JPG.
  // 1.0 = neutre, 1.3 = +30% de luminosité. Ajuster si trop clair ou trop sombre.
  material.albedoColor = new Color3(1.28, 1.28, 1.28)

  spaceMaterial.disableLighting = true
  spaceMaterial.backFaceCulling = false
  spaceMaterial.fogEnabled = false
  spaceMaterial.specularColor = Color3.Black()
  spaceMaterial.emissiveColor = Color3.White()

  const cloudTexture = new Texture(
    '/textures/clouds.jpg',
    scene,
    true,
    false,
    Texture.TRILINEAR_SAMPLINGMODE,
    undefined,
    () => {
      cloudMaterial.alpha = 0
      cloudMaterial.diffuseTexture = null
      cloudMaterial.opacityTexture = null
    },
  )
  cloudMaterial.diffuseTexture = cloudTexture
  cloudMaterial.opacityTexture = cloudTexture
  cloudMaterial.opacityTexture.getAlphaFromRGB = true
  cloudMaterial.alpha = 0.72
  cloudMaterial.backFaceCulling = true
  cloudMaterial.specularColor = Color3.Black()
  cloudMaterial.emissiveColor = new Color3(0.06, 0.06, 0.06)

  globe.material = material
  spaceDome.material = spaceMaterial
  clouds.material = cloudMaterial
  spaceDome.isPickable = false
  clouds.isPickable = false
  spaceDome.infiniteDistance = true

  let atmosphereColor = Color3.FromHexString('#7aabd4')
  const atmosphereGlow = new GlowLayer('atmosphere', scene)
  atmosphereGlow.intensity = 0.28
  atmosphereGlow.blurKernelSize = 24
  atmosphereGlow.addExcludedMesh(spaceDome)
  atmosphereGlow.addExcludedMesh(clouds)
  atmosphereGlow.customEmissiveColorSelector = (mesh, _subMesh, _material, result) => {
    if (mesh === globe) {
      result.set(atmosphereColor.r, atmosphereColor.g, atmosphereColor.b, 1)
      return
    }

    result.set(0, 0, 0, 0)
  }

  let globeTexture: Texture | null = null
  let spaceTexture: Texture | null = null
  let roughnessTexture: Texture | null = null

  scene.onBeforeRenderObservable.add(() => {
    globe.rotation.y += engine.getDeltaTime() * 0.00008
    clouds.rotation.y += engine.getDeltaTime() * 0.00012

    const forward = camera.target.subtract(camera.position).normalize()

    const worldUp = new Vector3(0, 1, 0)
    const right = Vector3.Cross(worldUp, forward).normalize()
    const up = Vector3.Cross(forward, right).normalize()

    const offsetUp    =  0.45   
    const offsetLeft  = -0.55  

    const sunDir = forward
      .add(up.scale(offsetUp))
      .add(right.scale(offsetLeft))
      .normalize()

    sun.direction = sunDir
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
      scene.fogMode = Scene.FOGMODE_NONE

      sun.intensity = period.visuals.sunLightIntensity
      ambient.intensity = clampedAmbientIntensity(period.visuals.ambientLight)
      ambient.diffuse = Color3.FromHexString(period.visuals.ambientDiffuseColor).scale(0.38)
      ambient.groundColor = Color3.FromHexString(period.visuals.ambientGroundColor).scale(0.35)
      atmosphereColor = Color3.FromHexString(period.visuals.atmosphereColor)
      atmosphereGlow.intensity = period.visuals.atmosphereGlowIntensity

      if (globeTexture) {
        globeTexture.dispose()
      }
      if (spaceTexture) {
        spaceTexture.dispose()
      }
      if (roughnessTexture) {
        roughnessTexture.dispose()
        roughnessTexture = null
      }

      globeTexture = new Texture(
        texturePathOverride ?? period.visuals.globeTexture,
        scene,
        true,
        false,
      )
      spaceTexture = new Texture(period.visuals.spaceTexture, scene, true, false)
      spaceTexture.uScale = -1

      material.albedoTexture = globeTexture
      material.metallic = 0.0
      material.roughness = 0.88
      material.ambientColor = new Color3(0.02, 0.02, 0.02)
      material.directIntensity = 1.0
      material.environmentIntensity = 0.0

      if (period.visuals.globeRoughnessTexture) {
        roughnessTexture = new Texture(
          period.visuals.globeRoughnessTexture,
          scene,
          true,
          false,
          Texture.TRILINEAR_SAMPLINGMODE,
          () => {
            if (!roughnessTexture) {
              return
            }

            material.metallicTexture = roughnessTexture
            material.useRoughnessFromMetallicTextureAlpha = false
            material.useRoughnessFromMetallicTextureGreen = true
            material.roughness = 1.0
          },
          () => {
            material.metallicTexture = null
            material.roughness = 0.88
            if (roughnessTexture) {
              roughnessTexture.dispose()
              roughnessTexture = null
            }
          },
        )
      } else {
        material.metallicTexture = null
        material.roughness = 0.88
      }

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
      if (roughnessTexture) {
        roughnessTexture.dispose()
      }
      cloudTexture.dispose()
      scene.dispose()
      engine.dispose()
    },
  }
}
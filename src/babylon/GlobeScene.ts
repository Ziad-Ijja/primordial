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
  Matrix,
} from '@babylonjs/core'
import type { PeriodData } from '../data/types'
import { findContinent } from '../systems/continentPicker'
import { ContinentHighlighter } from '../systems/continentHighlighter'
import { toLatLon } from '../geo/latlon'
import cambrianData from '../data/cambrian.continents.json'
import carboniferousData from '../data/carboniferous.continents.json'
import permianData from '../data/permian.continents.json'
import type { GeologicalPeriod } from '../types/geo.types'

const CONTINENTS_DATA: Record<string, GeologicalPeriod> = {
  cambrian: cambrianData as GeologicalPeriod,
  carboniferous: carboniferousData as GeologicalPeriod,
  permian: permianData as GeologicalPeriod,
}

export interface GlobeSceneController {
  applyPeriod: (period: PeriodData) => void
  setCloudsVisible: (visible: boolean) => void
  setRotationEnabled: (enabled: boolean) => void
  setGridVisible: (visible: boolean) => void
  dispose: () => void
}

function color4FromHex(hex: string) {
  const color = Color3.FromHexString(hex)
  return new Color4(color.r, color.g, color.b, 1)
}

// ---------------------------------------------------------------------------
// LIGHTING PHILOSOPHY — Google Earth style
//
//  The sun follows the camera with a large fixed angular offset (~53°), so
//  the terminator (day/night boundary) cuts clearly across the visible face
//  of the globe — exactly like Google Earth where ~1/3 of the visible
//  hemisphere is in shadow.
//
//  Offset computed each frame in camera-local space:
//    forward  = normalize(camera.target − camera.position)
//    right    = normalize(cross(worldUp, forward))
//    up       = normalize(cross(forward, right))
//    sunDir   = normalize(forward + UP_BIAS·up + RIGHT_BIAS·right)
//
//  SUN_UP_BIAS = +1.0 / SUN_RIGHT_BIAS = -0.9  →  sun upper-left,
//  shadow falls on the bottom-right (matches the Google Earth default view).
//  Combined angle: arctan(√(1²+0.9²)) ≈ 53° off the camera axis.
//
//  The HemisphericLight fill keeps the dark side readable — not pitch-black.
//  Per-period JSON values are final — no hidden multipliers.
// ---------------------------------------------------------------------------

// Angular offset of the sun relative to the camera look direction (camera-local space).
// Increase these to push the sun further off-axis → more dramatic shadows.
// Decrease them to flatten the lighting → brighter, safer look.
const SUN_UP_BIAS    = -1.00   // sun above camera line of sight
const SUN_RIGHT_BIAS =  0.90   // sun to the left → shadow on the right

export function createGlobeScene(canvas: HTMLCanvasElement): GlobeSceneController {
  const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true })
  const scene  = new Scene(engine)
  scene.clearColor = color4FromHex('#000000')

  // ------------------------------------------------------------------
  // Image processing — Google Earth: vibrant, sharp, not over-cooked
  // ------------------------------------------------------------------
  scene.imageProcessingConfiguration.toneMappingEnabled = true
  scene.imageProcessingConfiguration.toneMappingType    =
    ImageProcessingConfiguration.TONEMAPPING_ACES
  scene.imageProcessingConfiguration.exposure = 1.55   // Google Earth level brightness
  scene.imageProcessingConfiguration.contrast = 1.20   // stronger contrast for vivid colors

  // ------------------------------------------------------------------
  // Camera
  // ------------------------------------------------------------------
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
  camera.wheelPrecision   = 28
  camera.attachControl(canvas, true)

  // ------------------------------------------------------------------
  // Key light — Sun (camera-relative, offset upper-right)
  // ------------------------------------------------------------------
  const sun = new DirectionalLight('sun-light', new Vector3(0, -1, 0), scene)
  sun.intensity = 5.5                               // Google Earth noon sun — very strong key
  sun.diffuse   = new Color3(1.0, 0.98, 0.92)      // near-white with subtle warmth
  sun.specular  = Color3.Black()                    // no specular — kills the white hotspot on the pole

  // ------------------------------------------------------------------
  // Fill light — Sky ambient (Rayleigh-scatter sky blue)
  // ------------------------------------------------------------------
  const skyFill = new HemisphericLight('sky-fill', new Vector3(0, 1, 0), scene)
  skyFill.intensity   = 1.20                        // Google Earth: bright atmospheric fill
  skyFill.diffuse     = new Color3(0.35, 0.52, 0.85) // rich Rayleigh sky blue — saturated
  skyFill.groundColor = new Color3(0.08, 0.06, 0.05) // very dark warm, faint night-side warmth
  skyFill.specular    = Color3.Black()              // no specular from fill

  // ------------------------------------------------------------------
  // Geometry
  // ------------------------------------------------------------------
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
    { diameter: 4.33, segments: 64 },
    scene,
  )

  // ------------------------------------------------------------------
  // Grid System (Equator + Lat/Lon)
  // ------------------------------------------------------------------
  const gridMeshes: Mesh[] = []
  const drawGrid = () => {
    const radius = 2.102 // slightly above globe, below highlights
    const colorLat = new Color4(1, 1, 1, 0.15)
    const colorEq = new Color4(1, 0.8, 0, 0.5) // Equator in yellow
    const colorLon = new Color4(1, 1, 1, 0.1)

    // Latitudes (every 15 degrees)
    for (let lat = -75; lat <= 75; lat += 15) {
      const isEquator = lat === 0
      const points: Vector3[] = []
      const colors: Color4[] = []
      const latRad = (lat * Math.PI) / 180
      const y = radius * Math.sin(latRad)
      const r = radius * Math.cos(latRad)

      for (let lon = 0; lon <= 360; lon += 5) {
        const lonRad = (lon * Math.PI) / 180
        points.push(new Vector3(r * Math.cos(lonRad), y, r * Math.sin(lonRad)))
        colors.push(isEquator ? colorEq : colorLat)
      }

      const line = MeshBuilder.CreateLines(`lat_${lat}`, { points, colors }, scene)
      line.parent = globe
      line.isVisible = false
      line.isPickable = false
      gridMeshes.push(line)
    }

    // Longitudes (every 30 degrees)
    for (let lon = 0; lon < 360; lon += 30) {
      const points: Vector3[] = []
      const colors: Color4[] = []
      const lonRad = (lon * Math.PI) / 180

      for (let lat = -90; lat <= 90; lat += 5) {
        const latRad = (lat * Math.PI) / 180
        const r = radius * Math.cos(latRad)
        points.push(new Vector3(r * Math.cos(lonRad), radius * Math.sin(latRad), r * Math.sin(lonRad)))
        colors.push(colorLon)
      }

      const line = MeshBuilder.CreateLines(`lon_${lon}`, { points, colors }, scene)
      line.parent = globe
      line.isVisible = false
      line.isPickable = false
      gridMeshes.push(line)
    }
  }
  drawGrid()

  // ------------------------------------------------------------------
  // Continent Highlighting System
  // ------------------------------------------------------------------
  const highlighter = new ContinentHighlighter(scene, globe)
  let currentGeoPeriod: GeologicalPeriod | null = null

  // ------------------------------------------------------------------
  // Interactions: Continent picking on pointer events
  // ------------------------------------------------------------------
  scene.onPointerMove = () => {
    const pick = scene.pick(scene.pointerX, scene.pointerY, (mesh) => mesh === globe)

    if (!pick?.hit || !pick.pickedPoint) {
      highlighter.highlight(null)
      return
    }

    // Convert global picked point into globe's local space when it rotates
    const invMat = Matrix.Invert(globe.getWorldMatrix())
    const localPoint = Vector3.TransformCoordinates(pick.pickedPoint, invMat)

    if (currentGeoPeriod) {
      const continent = findContinent(localPoint, currentGeoPeriod)
      highlighter.highlight(continent)
    }
  }

  scene.onPointerDown = (_evt, pick) => {
    if (!pick?.hit || !pick.pickedPoint || pick.pickedMesh !== globe) return

    const invMat = Matrix.Invert(globe.getWorldMatrix())
    const localPoint = Vector3.TransformCoordinates(pick.pickedPoint, invMat)

    if (currentGeoPeriod) {
      const { lat, lon } = toLatLon(localPoint)
      const continent = findContinent(localPoint, currentGeoPeriod)
      const continentName = continent ? continent.name : "Ocean"

      console.log("============== CONTINENT DEBUG ==============")
      console.log(`1. Global Pick : X: ${pick.pickedPoint.x.toFixed(2)}, Y: ${pick.pickedPoint.y.toFixed(2)}, Z: ${pick.pickedPoint.z.toFixed(2)}`)
      console.log(`2. Local Pick  : X: ${localPoint.x.toFixed(2)}, Y: ${localPoint.y.toFixed(2)}, Z: ${localPoint.z.toFixed(2)}`)
      console.log(`3. Geo Coords  : Lat: ${lat.toFixed(2)}°, Lon: ${lon.toFixed(2)}°`)
      console.log(`4. Detected    : ${continentName}`)
      console.log("=============================================")
    }
  }

  // ------------------------------------------------------------------
  // Materials
  // ------------------------------------------------------------------
  const material      = new PBRMaterial('earth-material', scene)
  const spaceMaterial = new StandardMaterial('space-material', scene)
  const cloudMaterial = new StandardMaterial('cloud-material', scene)

  // Globe — clean PBR, no hacks
  material.metallic            = 0.0
  material.roughness           = 0.78    // slightly smoother than before for more satellite-like feel
  material.albedoColor         = new Color3(1.0, 1.0, 1.0)
  material.ambientColor        = new Color3(0.0, 0.0, 0.0) // let the HemisphericLight handle fill
  material.directIntensity     = 1.4   // brighter lit face
  material.environmentIntensity = 0.0
  material.specularIntensity   = 0.0    // fully diffuse — no specular hotspot
  material.backFaceCulling     = true

  // Space dome
  spaceMaterial.disableLighting = true
  spaceMaterial.backFaceCulling = false
  spaceMaterial.fogEnabled      = false
  spaceMaterial.specularColor   = Color3.Black()
  spaceMaterial.emissiveColor   = Color3.White()

  // Clouds
  const cloudTexture = new Texture(
    '/textures/clouds.jpg',
    scene,
    true,
    false,
    Texture.TRILINEAR_SAMPLINGMODE,
    undefined,
    () => {
      cloudMaterial.alpha          = 0
      cloudMaterial.diffuseTexture = null
      cloudMaterial.opacityTexture = null
    },
  )
  cloudMaterial.diffuseTexture               = cloudTexture
  cloudMaterial.opacityTexture               = cloudTexture
  cloudMaterial.opacityTexture.getAlphaFromRGB = true
  cloudMaterial.alpha         = 0.72
  cloudMaterial.backFaceCulling = true
  cloudMaterial.specularColor = Color3.Black()
  cloudMaterial.emissiveColor = new Color3(0.18, 0.18, 0.18) // brighter whites on clouds

  globe.material    = material
  spaceDome.material = spaceMaterial
  clouds.material   = cloudMaterial

  spaceDome.isPickable = false
  clouds.isPickable    = false
  spaceDome.infiniteDistance = true

  // ------------------------------------------------------------------
  // Atmosphere glow (limb effect)
  // ------------------------------------------------------------------
  let atmosphereColor = Color3.FromHexString('#7aabd4')

  const atmosphereGlow = new GlowLayer('atmosphere', scene)
  atmosphereGlow.intensity      = 0.30
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

  // ------------------------------------------------------------------
  // Per-frame rotation — globe & clouds only, NO sun recalculation
  // ------------------------------------------------------------------
  let globeTexture:     Texture | null = null
  let spaceTexture:     Texture | null = null
  let roughnessTexture: Texture | null = null

  let isRotationEnabled = true

  scene.onBeforeRenderObservable.add(() => {
    if (isRotationEnabled) {
      globe.rotation.y  += engine.getDeltaTime() * 0.00004
      clouds.rotation.y += engine.getDeltaTime() * 0.00006
      clouds.rotation.x += engine.getDeltaTime() * 0.000001
    }

    // Sun follows the camera with a fixed angular offset in camera-local space.
    // This keeps the visible face always lit while producing oblique shadows
    // from mountains and terrain — the Google Earth look.
    const forward = camera.target.subtract(camera.position).normalize()

    // Stable up vector: cross(worldUp, forward) gives camera-local right,
    // then cross(forward, right) gives camera-local up — no gimbal lock issues
    // at typical globe-viewing angles.
    const worldUp = Vector3.Up()
    const right   = Vector3.Cross(worldUp, forward).normalize()
    const up      = Vector3.Cross(forward, right).normalize()

    sun.direction = forward
      .add(up.scale(SUN_UP_BIAS))
      .add(right.scale(SUN_RIGHT_BIAS))
      .normalize()
  })

  engine.runRenderLoop(() => scene.render())
  const resize = () => engine.resize()
  window.addEventListener('resize', resize)

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------
  return {
    applyPeriod(period) {
      scene.clearColor = color4FromHex('#000000')
      scene.fogMode    = Scene.FOGMODE_NONE

      // Update geological continent data dynamically
      if (CONTINENTS_DATA[period.id]) {
        currentGeoPeriod = CONTINENTS_DATA[period.id]
        highlighter.init(currentGeoPeriod)
      } else {
        currentGeoPeriod = null
        highlighter.highlight(null)
      }

      // Direct assignment — JSON values are already final, no hidden multipliers
      sun.intensity    = period.visuals.sunLightIntensity
      sun.diffuse      = Color3.FromHexString(period.visuals.sunDiffuseColor ?? '#fff8e0')

      skyFill.intensity   = period.visuals.ambientLight
      skyFill.diffuse     = Color3.FromHexString(period.visuals.ambientDiffuseColor)
      skyFill.groundColor = Color3.FromHexString(period.visuals.ambientGroundColor)

      atmosphereColor          = Color3.FromHexString(period.visuals.atmosphereColor)
      atmosphereGlow.intensity = period.visuals.atmosphereGlowIntensity

      // Texture swap
      if (globeTexture)     { globeTexture.dispose()     }
      if (spaceTexture)     { spaceTexture.dispose()     }
      if (roughnessTexture) { roughnessTexture.dispose() ; roughnessTexture = null }

      globeTexture = new Texture(period.visuals.globeTexture, scene, true, false)
      spaceTexture = new Texture(period.visuals.spaceTexture, scene, true, false)
      spaceTexture.uScale = -1

      // Reset material to clean state
      material.albedoTexture    = globeTexture
      material.albedoColor      = new Color3(1.0, 1.0, 1.0)
      material.metallic         = 0.0
      material.roughness        = 0.78
      material.ambientColor     = new Color3(0.0, 0.0, 0.0)
      material.directIntensity  = 1.0
      material.environmentIntensity = 0.0
      material.specularIntensity = 0.0

      if (period.visuals.globeRoughnessTexture) {
        roughnessTexture = new Texture(
          period.visuals.globeRoughnessTexture,
          scene,
          true,
          false,
          Texture.TRILINEAR_SAMPLINGMODE,
          () => {
            if (!roughnessTexture) return
            material.metallicTexture                     = roughnessTexture
            material.useRoughnessFromMetallicTextureAlpha = false
            material.useRoughnessFromMetallicTextureGreen = true
            material.roughness = 0.75
          },
          () => {
            material.metallicTexture = null
            material.roughness = 0.78
            if (roughnessTexture) { roughnessTexture.dispose() ; roughnessTexture = null }
          },
        )
      } else {
        material.metallicTexture = null
        material.roughness = 0.78
      }

      spaceMaterial.diffuseTexture  = spaceTexture
      spaceMaterial.emissiveTexture = spaceTexture
    },

    setCloudsVisible(visible) {
      clouds.setEnabled(visible)
    },

    setRotationEnabled(enabled) {
      isRotationEnabled = enabled
    },

    setGridVisible(visible) {
      gridMeshes.forEach((mesh) => {
        mesh.isVisible = visible
      })
    },

    dispose() {
      window.removeEventListener('resize', resize)
      if (globeTexture)     globeTexture.dispose()
      if (spaceTexture)     spaceTexture.dispose()
      if (roughnessTexture) roughnessTexture.dispose()
      cloudTexture.dispose()
      scene.dispose()
      engine.dispose()
    },
  }
}
export type DataState = 'placeholder' | 'sourced'

export interface AtmosphericData {
  o2Percent: number | null
  co2Ppm: number | null
  avgTempCelsius: number | null
  pressureAtm: number | null
  seaLevelMeters: number | null
}

export interface PeriodVisuals {
  skyColor: string
  fogColor: string
  fogDensity: number
  spaceTexture: string
  globeTexture: string
  texturePresets?: TexturePreset[]
  ambientLight: number
  notes?: string
}

export interface TexturePreset {
  id: string
  label: string
  texturePath: string
  source?: string
}

export type ReconstructionConfidence = 'low' | 'medium' | 'high'
export type SpeciesKind = 'fauna' | 'flora'

export interface Species {
  id: string
  name: string
  taxonomy: string
  period: string
  type: SpeciesKind
  length_cm: number | null
  diet: string | null
  habitat: string | null
  description: string
  discoveredYear: number | null
  fossilLocations: string[]
  reconstructionConfidence: ReconstructionConfidence
  modelPath: string | null
  animations: string[]
  defaultAnimation: string | null
}

export interface PeriodData {
  id: string
  name: string
  dateRange: string
  description: string
  dataState: DataState
  atmosphere: AtmosphericData
  visuals: PeriodVisuals
  species: Species[]
}
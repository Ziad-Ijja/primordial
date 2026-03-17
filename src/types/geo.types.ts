export type LatLon = {
  lat: number
  lon: number
}

export type Continent = {
  name: string
  polygon?: LatLon[]
  polygons?: LatLon[][]
}

export type GeologicalPeriod = {
  name: string
  continents: Continent[]
}

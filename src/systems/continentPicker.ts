import { Vector3 } from "@babylonjs/core"
import { toLatLon } from "../geo/latlon"
import { pointInPolygon } from "../geo/pointInPolygon"
import type { GeologicalPeriod, Continent } from "../types/geo.types"

export function findContinent(point3D: Vector3, period: GeologicalPeriod): Continent | null {
  const { lat, lon } = toLatLon(point3D)

  for (const continent of period.continents) {
    if (continent.polygon) {
      if (pointInPolygon({ lat, lon }, continent.polygon)) {
        return continent
      }
    }
    
    if (continent.polygons) {
      for (const poly of continent.polygons) {
        if (pointInPolygon({ lat, lon }, poly)) {
          return continent
        }
      }
    }
  }

  return null
}

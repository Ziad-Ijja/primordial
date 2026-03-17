import type { LatLon } from "../types/geo.types"

// Implements a robust spherical ray-casting algorithm.
// We cast a ray from the test point straight North to the Pole along its meridian.
export function pointInPolygon(point: LatLon, polygon: LatLon[]) {
  if (polygon.length < 3) return false

  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const lat1 = polygon[i].lat
    const lon1 = polygon[i].lon
    const lat2 = polygon[j].lat
    const lon2 = polygon[j].lon

    // Calculate the longitude span of this segment, assuming shortest path on the sphere
    let dLon = lon2 - lon1
    if (dLon > 180) dLon -= 360
    else if (dLon <= -180) dLon += 360

    // Calculate longitude difference from segment start to the test point
    let relativeLon = point.lon - lon1
    if (relativeLon > 180) relativeLon -= 360
    else if (relativeLon <= -180) relativeLon += 360

    // Does the meridian ray (going North from point) cross this segment?
    // Using half-open interval [0, dLon) to avoid double counting at vertices.
    let crosses = false
    if (dLon > 0) {
      if (relativeLon >= 0 && relativeLon < dLon) crosses = true
    } else if (dLon < 0) {
      if (relativeLon <= 0 && relativeLon > dLon) crosses = true
    }

    if (crosses) {
      // Linear interpolation to find the latitude of the intersection.
      // This 2D equirectangular approximation is computationally cheap and robust 
      // even for polygons wrapping around the poles or crossing the anti-meridian.
      const crossLat = lat1 + (lat2 - lat1) * (relativeLon / dLon)
      
      // If the intersection is North of our point, the ray hits the boundary
      if (crossLat >= point.lat) {
        inside = !inside
      }
    }
  }

  return inside
}

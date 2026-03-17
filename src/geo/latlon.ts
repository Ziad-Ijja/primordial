import { Vector3 } from "@babylonjs/core"

export function toLatLon(point: Vector3) {
  const p = point.normalizeToNew()

  const lat = Math.asin(p.y) * (180 / Math.PI)
  const lon = Math.atan2(p.z, p.x) * (180 / Math.PI)

  return { lat, lon }
}

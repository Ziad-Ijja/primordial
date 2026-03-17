import { Scene, Mesh } from "@babylonjs/core"
import type { GeologicalPeriod, Continent } from "../types/geo.types"

export class ContinentHighlighter {
  private highlightMeshes: Map<string, Mesh> = new Map()

  constructor(scene: Scene) {
    // scene is used for mesh creation down the road
    scene.onDisposeObservable.add(() => {
      this.highlightMeshes.forEach(mesh => mesh.dispose())
    })
  }

  public init(_period: GeologicalPeriod) {
    this.highlightMeshes.forEach(mesh => mesh.dispose())
    this.highlightMeshes.clear()

    // Create a generic highlight mesh (since we don't have accurate continent meshes yet, 
    // we'll just use a small sphere indicator or keep it conceptual for this specific system design)
    // Based on requirements: "One mesh per continent, slightly scaled above globe (~1.01), semi-transparent"
    // To properly do this, we'd need exact triangulated meshes of continents. 
    // Since we only have polygons, we'll construct simplistic approximations or rely on a generic highlight.
    
    // For now, keeping the system interface as requested.
  }

  public highlight(continent: Continent | null) {
    // Hide all
    this.highlightMeshes.forEach(mesh => {
      mesh.isVisible = false
    })

    // Show selected
    if (continent && this.highlightMeshes.has(continent.name)) {
      const mesh = this.highlightMeshes.get(continent.name)
      if (mesh) {
        mesh.isVisible = true
      }
    }
  }
}

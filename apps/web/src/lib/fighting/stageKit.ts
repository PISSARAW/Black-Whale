import type * as Three from 'three'

/** What the fight scene lends a stage builder, so both dispose together. */
export interface SceneryKit {
  THREE: typeof Three
  /** A cached flat material, the same one the fighters are drawn with. */
  glow: (colour: number, opacity: number) => Three.MeshBasicMaterial
  /** Registers a geometry for disposal with the scene. */
  geometry: <T extends Three.BufferGeometry>(made: T) => T
}

export interface SceneryFog {
  colour: number
  near: number
  far: number
}

export interface FightScenery {
  root: Three.Group
  fog: SceneryFog
  /** How far the camera has to see for this stage's backdrop. */
  cameraFar: number
  /** Whether the stage needs material-level clipping planes switched on. */
  clipped: boolean
  /** Releases what the kit did not register. */
  dispose: () => void
}

interface BoxOptions {
  size: readonly [number, number, number]
  at: readonly [number, number, number]
  colour: number
  opacity?: number
}

/** A flat-shaded box, the unit most authored scenery is made of. */
export function sceneryBox(kit: SceneryKit, options: BoxOptions): Three.Mesh {
  const { THREE, glow, geometry } = kit
  const mesh = new THREE.Mesh(
    geometry(new THREE.BoxGeometry(options.size[0], options.size[1], options.size[2])),
    glow(options.colour, options.opacity ?? 1),
  )
  mesh.position.set(options.at[0], options.at[1], options.at[2])
  return mesh
}

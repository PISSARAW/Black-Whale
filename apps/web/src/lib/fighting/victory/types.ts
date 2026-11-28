import type { Material, Mesh, Object3D, PerspectiveCamera, Scene, Vector3 } from 'three'
import type { FightComfort } from '../fightComfort'
import type { FightSide, FightState } from '../types'
import type { VictoryFrame } from './playback'

export interface VictoryActor {
  root: Object3D
  head: Object3D
  height: number
  width: number
}
export interface VictoryContext {
  scene: Scene
  scenery: Object3D
  camera: PerspectiveCamera
  state: FightState
  frame: VictoryFrame
  age: number
  hero: VictoryActor
  victim: VictoryActor
  centre: number
  gap: number
  comfort: FightComfort
  futurePerspective?: 'perceived' | 'real'
  save: (node: Object3D) => void
  material: (mesh: Mesh, material: Material | Material[]) => void
  defer: (restore: () => void) => void
  add: (root: Object3D) => void
}
export interface VictoryDriver {
  update: (context: VictoryContext) => void
  dispose: () => void
}
export interface VictoryEffect {
  root: Object3D
  update: (context: VictoryContext) => void
  dispose: () => void
}
export type VictoryModels = Record<FightSide, Object3D>
export interface VictoryShot {
  emission: number
  impact: number | null
  id: number
  nativeFrame: number
}
export interface GunPose {
  hero: Object3D
  victim: Object3D
  target: Vector3
  hands: Object3D[]
  muzzles: Vector3[]
  directions: Vector3[]
}

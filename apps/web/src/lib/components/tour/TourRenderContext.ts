import type * as THREE from 'three'
import type { Vec2 } from '$lib/tour/types'

export interface TourRenderContext {
  delta: number
  clock: number
  blinded: boolean
  sealedExposure: number
  comfortExposure: number
  hourViewExposure: number
  hourViewGrade: any
  calmWalk: boolean
  shownNen: any
  gyoMode: boolean
  currentTierId: string
  picker: THREE.Raycaster
  reticle: THREE.Vector2
  camera: THREE.PerspectiveCamera
  intersectables: THREE.Object3D[]
  focusDistanceState: { focusDistance: number }
  pointer: Vec2
  yaw: number
  pitch: number
  eyeHeight: number
  ground: number
  authoredEyeHeight: number | null
}

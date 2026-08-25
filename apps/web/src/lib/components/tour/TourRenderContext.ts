import type * as THREE from 'three'
import type { Vec2 } from '$lib/tour/types'

export interface TourRenderContext {
  delta: number
  clock: number
  blinded: boolean
  sealedExposure: number
  comfortExposure: number
  hourViewExposure: number
  hourViewGrade: { contrast: number; saturation: number; vignette: number }
  calmWalk: boolean
  shownNen: import('@black-whale/nen-engine').NenTechniqueState | null
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

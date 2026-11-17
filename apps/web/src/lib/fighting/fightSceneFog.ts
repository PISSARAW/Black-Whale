import { Fog, FogExp2, type PerspectiveCamera, type Scene } from 'three'
import type { FightScenery } from './stageKit'

/** Camera pullback on narrow screens must not bury the combatants in stage fog. */
export function updateFightCameraFog(
  scene: Scene,
  camera: PerspectiveCamera,
  scenery: FightScenery,
) {
  const far = Math.max(100, scenery.cameraFar, camera.position.z + 30)
  if (camera.far !== far) {
    camera.far = far
    camera.updateProjectionMatrix()
  }
  if (scene.fog instanceof Fog && scenery.fog.kind === 'linear') {
    const setback = Math.max(0, camera.position.z - 9.2)
    scene.fog.near = scenery.fog.near + setback
    scene.fog.far = scenery.fog.far + setback
  }
  if (scene.fog instanceof FogExp2 && scenery.fog.kind === 'exp2')
    scene.fog.density = scenery.fog.density * Math.min(1, 9.2 / camera.position.z)
}

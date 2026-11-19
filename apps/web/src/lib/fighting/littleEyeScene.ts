import type { EffectSceneOptions } from './fighterEffectScene'
import type { FightState } from './types'

/** A travelling emitted ball is visibly distinct from a captured living animal. */
export function createLittleEyeScene(options: EffectSceneOptions) {
  const { THREE, scene } = options
  const geometry = new THREE.SphereGeometry(0.1, 12, 8)
  const material = new THREE.MeshBasicMaterial({ color: 0xb0e5ff, transparent: true, opacity: 0.8 })
  const balls = new Map<string, import('three').Mesh>()
  return {
    sync(state: FightState) {
      const shots = state.battlefield?.littleEyeShots ?? []
      for (const shot of shots) {
        let ball = balls.get(shot.id)
        if (!ball) {
          ball = new THREE.Mesh(geometry, material)
          balls.set(shot.id, ball)
          scene.add(ball)
        }
        ball.position.set(options.worldX(shot.x), options.worldY(shot.y), 0.4)
      }
      for (const [id, ball] of balls) {
        if (shots.some((shot) => shot.id === id)) continue
        scene.remove(ball)
        balls.delete(id)
      }
    },
    dispose() {
      for (const ball of balls.values()) scene.remove(ball)
      balls.clear()
      geometry.dispose()
      material.dispose()
    },
  }
}

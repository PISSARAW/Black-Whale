import { createVisitHatsuModel, type VisitHatsuModel } from './visitHatsuModel'
import type { ProjectileSceneOptions } from './projectileScene'
import type { FightProjectile } from './types'

/** Reuse the visit's planet, cloud bands and Great Spot inside the actual combat volume. */
export function createJupiterScene(options: ProjectileSceneOptions) {
  const planets = new Map<number, VisitHatsuModel>()
  return {
    sync(shots: readonly FightProjectile[], seconds: number) {
      const active = new Set<number>()
      for (const shot of shots.filter((projectile) => projectile.jupiter)) {
        active.add(shot.id)
        let model = planets.get(shot.id)
        if (!model) {
          model = createVisitHatsuModel(options.THREE, { model: 'jupiter' })
          model.root.name = `bonolenov-jupiter:${shot.id}`
          planets.set(shot.id, model)
          options.scene.add(model.root)
        }
        model.fit({
          width: Math.abs(options.worldX(shot.width) - options.worldX(0)),
          height: Math.abs(options.worldY(shot.height) - options.worldY(0)),
        })
        model.root.position.set(options.worldX(shot.x), options.worldY(shot.y), 0)
        model.root.rotation.y = seconds * 0.8
      }
      for (const [id, model] of planets) {
        if (active.has(id)) continue
        model.dispose()
        planets.delete(id)
      }
    },
    dispose() {
      planets.forEach((model) => model.dispose())
      planets.clear()
    },
  }
}

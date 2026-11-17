import { Mesh, Vector3 } from 'three'
import type { Material, ShaderMaterial } from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import { victoryArmour } from './armour'
import { createFatalitySun, solarDissolve } from './sun'
import { createChrolloSpectacleBlast } from './blast'
import { disposeVictoryObject, ease } from './resources'
import { turnVictoryHero } from './pose'
import { victoryActorShot, victoryPortrait, victoryWide } from './camera'

function scorchVictim(context: VictoryContext, cache: Map<Material, ShaderMaterial>) {
  if (context.age < 285) return
  context.victim.root.traverse((node) => {
    if (!(node instanceof Mesh)) return
    const burned = (material: Material) => {
      const shader = cache.get(material) ?? solarDissolve(material)
      cache.set(material, shader)
      shader.uniforms.progress.value = ease((context.age - 285) / 125)
      return shader
    }
    context.material(
      node,
      Array.isArray(node.material) ? node.material.map(burned) : burned(node.material),
    )
  })
}
export function createFeitanVictory(): VictoryDriver {
  const sun = createFatalitySun(),
    blast = createChrolloSpectacleBlast()
  const burned = new Map<Material, ShaderMaterial>()
  return {
    update(context) {
      context.hero.root.rotation.y = -0.12
      turnVictoryHero(context)
      victoryArmour(context)
      scorchVictim(context, burned)
      if (context.age >= 420) context.victim.root.visible = false
      sun.sync({
        hero: context.hero.root.position,
        victim: context.victim.root.position,
        height: context.victim.height,
        age: context.age,
        sunHeight: Math.max(2.8, context.hero.height + 1.4),
      })
      blast.sync(
        new Vector3(context.victim.root.position.x, context.victim.height * 0.6, 0.08),
        context.age - 120,
      )
      blast.group.scale.set(0.5, 0.65, 0.5)
      blast.group.visible = context.age >= 300 && context.age < 420
      context.add(sun.root)
      context.add(blast.group)
      if (context.age < 90 || context.age >= 420) victoryPortrait(context)
      else if (context.age < 180) victoryActorShot(context, context.hero)
      else if (context.age >= 270 && context.age < 330) victoryActorShot(context, context.victim)
      else victoryWide(context, Math.max(4, context.hero.height + 2.6))
    },
    dispose() {
      disposeVictoryObject(sun.root)
      disposeVictoryObject(blast.group)
      burned.forEach((material) => material.dispose())
      burned.clear()
    },
  }
}

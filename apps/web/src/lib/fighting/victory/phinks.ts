import { Mesh, Quaternion, Vector3 } from 'three'
import type { Material, ShaderMaterial } from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import { createPhinksEffects, fractureMaterial } from './phinksEffects'
import { createCinematicImpact } from './impact'
import { createCinematicCrater } from './crater'
import {
  crouchToVictoryTarget,
  localToHead,
  reachVictoryHand,
  turnVictoryHero,
  victimTorso,
} from './pose'
import { disposeVictoryObject, ease } from './resources'
import { victoryActorShot, victoryPortrait, victoryShot, victoryWide } from './camera'

function phinksArm(context: VictoryContext, turns: number) {
  const { age, hero, victim } = context
  const strike = ease((age - 246) / 24),
    settle = ease((age - 350) / 70)
  hero.root.position.x += context.gap * 0.35 * strike
  crouchToVictoryTarget(context, strike * (1 - settle))
  turnVictoryHero(context)
  const shoulder = hero.root.getObjectByName('shoulder-right')!
  // Circumduction uses shoulder swing and abduction together; repeatedly
  // subtracting full turns from flexion drove the arm through its own torso.
  const winding = turns * Math.PI * 2
  shoulder.rotation.set(
    -1.1 + Math.cos(winding) * 1.6,
    Math.sin(winding) * 0.35,
    0.85 + Math.sin(winding) * 0.65,
  )
  hero.root.getObjectByName('elbow-right')!.rotation.x = -0.16
  hero.root.updateWorldMatrix(true, true)
  if (age >= 210) {
    const target = victimTorso(context).add(new Vector3(-victim.width * 0.55, 0.05, 0))
    const hand = localToHead(hero, new Vector3(0.24, -0.35, -0.22)).lerp(target, strike)
    hand.lerp(localToHead(hero, new Vector3(0.24, -0.6, 0.07)), settle)
    const carried = hero.root.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
    reachVictoryHand(context, { side: 'right', target: carried.lerp(hand, ease((age - 210) / 18)) })
  }
  reachVictoryHand(context, {
    side: 'left',
    target: localToHead(hero, new Vector3(-0.24, -0.4 - settle * 0.2, 0.18)),
  })
  if (age >= 270) victim.root.position.x += ease((age - 270) / 65) * 0.5
  if (age >= 350) victim.root.visible = false
  hero.root.updateWorldMatrix(true, true)
  victim.root.updateWorldMatrix(true, true)
  return shoulder
}
function fractureVictoryVictim(context: VictoryContext, materials: Map<Material, ShaderMaterial>) {
  if (context.age < 270) return
  context.victim.root.traverse((node) => {
    if (!(node instanceof Mesh)) return
    const next = (source: Material) => {
      const shader = materials.get(source) ?? fractureMaterial(source)
      materials.set(source, shader)
      shader.uniforms.age.value = context.age
      return shader
    }
    context.material(
      node,
      Array.isArray(node.material) ? node.material.map(next) : next(node.material),
    )
  })
}
export function createPhinksVictory(): VictoryDriver {
  const effects = createPhinksEffects(),
    impact = createCinematicImpact(),
    crater = createCinematicCrater()
  const materials = new Map<Material, ShaderMaterial>()
  return {
    update(context) {
      const turns = Math.max(0, Math.min(6, (context.age - 36) / 32)),
        shoulder = phinksArm(context, turns)
      fractureVictoryVictim(context, materials)
      const fist = context.hero.root.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
      effects.sync({
        age: context.age,
        fist,
        shoulder: shoulder.getWorldPosition(new Vector3()),
        rotation: context.hero.root.getWorldQuaternion(new Quaternion()),
        turns,
        target: context.victim.root.position,
        height: context.victim.height,
      })
      const shift = context.victim.root.position.x - 0.48
      impact.sync({
        age: context.age - 30,
        fist,
        target: victimTorso(context),
        camera: context.camera,
      })
      impact.root.visible = context.age >= 270 && context.age < 420
      crater.sync(context.age - 30)
      crater.root.position.x = shift
      context.add(effects.root)
      context.add(impact.root)
      context.add(crater.root)
      if (context.age >= 420) victoryPortrait(context)
      else if (context.age < 228) victoryActorShot(context, context.hero)
      else if (context.age < 260)
        victoryShot(context, {
          target: fist,
          offset: new Vector3(0.15, 0.1, 1.4),
          width: 0.8,
          height: 0.7,
        })
      else victoryWide(context)
    },
    dispose() {
      ;[effects.root, impact.root, crater.root].forEach(disposeVictoryObject)
      materials.forEach((m) => m.dispose())
      materials.clear()
    },
  }
}

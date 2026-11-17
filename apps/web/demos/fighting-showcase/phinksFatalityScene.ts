import { Mesh, PerspectiveCamera, Quaternion, Scene } from 'three'
import type { Material, ShaderMaterial } from 'three'
import type { FightState } from '../../src/lib/fighting/types'
import { stagePhinks } from './phinksFatalityPose'
import { phinksCamera } from './phinksFatalityCamera'
import { createPhinksEffects, fractureMaterial } from './phinksFatalityEffects'
import { createCinematicImpact } from './cinematicImpactEffects'
import { createCinematicCrater } from './cinematicCrater'
import { fatalityLighting } from './kurapikaFatalityLighting'

export function capturePhinksFatality(read: () => { age: number; state: FightState }) {
  const effects = createPhinksEffects(),
    impact = createCinematicImpact(),
    crater = createCinematicCrater()
  const materials = new WeakMap<Material, ShaderMaterial>()
  let renders = 0,
    restore: (() => void) | undefined
  let audit: Record<string, unknown> = {}
  Scene.prototype.onBeforeRender = function (_renderer, scene, camera) {
    if (!(camera instanceof PerspectiveCamera) || !scene.getObjectByName('fight-collision-boxes'))
      return
    restore?.()
    const { age, state } = read(),
      position = camera.position.clone(),
      rotation = camera.quaternion.clone(),
      up = camera.up.clone()
    const pose = stagePhinks(scene, age),
      lighting = fatalityLighting(scene, pose)
    const resets: Array<() => void> = []
    if (age >= 270)
      pose.victim.traverse((node) => {
        if (!(node instanceof Mesh)) return
        const original = node.material
        const shader = (material: Material) => {
          const next = materials.get(material) ?? fractureMaterial(material)
          materials.set(material, next)
          next.uniforms.age.value = age
          return next
        }
        node.material = Array.isArray(original) ? original.map(shader) : shader(original)
        resets.push(() => {
          node.material = original
        })
      })
    const shot = phinksCamera(camera, { ...pose, age })
    effects.sync({ ...pose, age, rotation: pose.hero.getWorldQuaternion(new Quaternion()) })
    impact.sync({ age: age - 30, fist: pose.fist, camera })
    crater.sync(age - 30)
    // The Cyclotron owns its moving aura; retain only the shared blast after contact.
    impact.root.visible = age >= 270 && age < 420
    scene.add(effects.root, impact.root, crater.root)
    for (const root of [effects.root, impact.root, crater.root]) root.updateMatrixWorld(true)
    audit = {
      age,
      shot,
      turns: pose.turns,
      handError: pose.handError,
      fist: pose.fist.toArray(),
      nativeTurns: state.player.hatsuEffects.cyclotronTurns,
      winner: state.winner,
      victimHealth: state.opponent.health,
      nativePunchTurns: state.player.attack?.cyclotronTurns ?? 0,
      victimFragmented: age >= 350,
    }
    restore = () => {
      scene.remove(effects.root, impact.root, crater.root)
      resets.reverse().forEach((r) => r())
      lighting()
      pose.restore()
      camera.position.copy(position)
      camera.quaternion.copy(rotation)
      camera.up.copy(up)
      camera.updateMatrixWorld(true)
    }
  }
  Scene.prototype.onAfterRender = function (_renderer, scene) {
    if (!scene.getObjectByName('fight-collision-boxes')) return
    restore?.()
    restore = undefined
    renders++
  }
  return { ready: () => renders > 3, audit: () => audit }
}

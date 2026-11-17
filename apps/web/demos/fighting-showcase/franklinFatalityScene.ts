import { PerspectiveCamera, Scene } from 'three'
import type { FightState } from '../../src/lib/fighting/types'
import type { createFranklinFatalityFilm } from './franklinFatalityFilm'
import { stageFranklin } from './franklinFatalityPose'
import { franklinCamera } from './franklinFatalityCamera'
import { createFranklinBarrageEffects } from './franklinFatalityEffects'
import { createFranklinSmoke } from './franklinFatalitySmoke'
import { createFatalityDust } from './kurapikaFatalityDust'
import { fatalityLighting } from './kurapikaFatalityLighting'

export function captureFranklinFatality(options: {
  shots: ReturnType<typeof createFranklinFatalityFilm>['shots']
  read: () => { age: number; state: FightState }
}) {
  const bullets = createFranklinBarrageEffects(options.shots),
    smoke = createFranklinSmoke(),
    dust = createFatalityDust()
  let renders = 0,
    restore: (() => void) | undefined
  let audit: Record<string, unknown> = {}
  Scene.prototype.onBeforeRender = function (_renderer, scene, camera) {
    if (!(camera instanceof PerspectiveCamera) || !scene.getObjectByName('fight-collision-boxes'))
      return
    restore?.()
    const { age, state } = options.read(),
      position = camera.position.clone(),
      rotation = camera.quaternion.clone(),
      up = camera.up.clone()
    const shock = Math.max(
      0,
      ...options.shots.map((s) =>
        s.impact !== null && age >= s.impact ? Math.exp(-(age - s.impact) / 3.5) : 0,
      ),
    )
    const pose = stageFranklin(scene, age, shock),
      lighting = fatalityLighting(scene, pose)
    const resets: Array<() => void> = []
    for (const child of scene.children)
      if (child.name.startsWith('fight-projectile:')) {
        const visible = child.visible
        child.visible = false
        resets.push(() => {
          child.visible = visible
        })
      }
    const shot = franklinCamera(camera, { pose, age })
    const barrage = bullets.sync({ pose, age })
    smoke.sync({ ...pose, camera, age })
    dust.sync(pose.victim, age - 55)
    scene.add(bullets.root, smoke.root, dust.root)
    for (const root of [bullets.root, smoke.root, dust.root]) root.updateMatrixWorld(true)
    audit = {
      age,
      shot,
      handError: pose.handError,
      muzzleCount: pose.muzzles.length,
      muzzles: pose.muzzles.map((p) => p.toArray()),
      barrelAxis: pose.directions[7].toArray(),
      cameraPosition: camera.position.toArray(),
      fall: pose.fall,
      victimHealth: state.opponent.health,
      winner: state.winner,
      ...barrage,
    }
    restore = () => {
      scene.remove(bullets.root, smoke.root, dust.root)
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

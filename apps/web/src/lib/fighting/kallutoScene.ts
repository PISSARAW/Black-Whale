import { createFineControlClock } from './fineControlPresentation'
import { fineControlEase, fineControlReduced } from './fineControlAnchors'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightProjectile, FightSide, FightState } from './types'
import type { FineControlFrame } from './fineControlPresentation'

/** Existing physical projectiles become small paper clusters, never extra hits or explosions. */
export function createKallutoPaperScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene, worldX, worldY } = options
  const clock = createFineControlClock()
  const geometry = new THREE.BoxGeometry(0.05, 0.08, 0.012)
  const material = new THREE.MeshBasicMaterial({ color: 0xf4e9e5 })
  const group = new THREE.Group()
  group.name = 'kalluto-paper'
  const pieces = new Map<number, import('three').Mesh[]>()
  const originals = new Map<number, import('three').Object3D>()
  scene.add(group)
  function show(shot: FightProjectile) {
    let held = pieces.get(shot.id)
    if (!held) {
      held = Array.from(
        { length: shot.kallutoPaper === 'serpent' ? 16 : 6 },
        () => new THREE.Mesh(geometry, material),
      )
      group.add(...held)
      pieces.set(shot.id, held)
    }
    const reduced = fineControlReduced(options)
    const seconds = shot.age / 60
    const gather = 0.55 + 0.45 * fineControlEase(shot.age / 18)
    held.forEach((mesh, trail) => {
      const length = shot.kallutoPaper === 'serpent' ? 0.035 : 0.018
      const wave = reduced ? 0 : Math.sin(seconds * 12 - trail * 0.5)
      mesh.position.set(
        worldX(shot.x) - Math.sign(shot.velocityX) * trail * length,
        worldY(shot.y) + wave * (trail + 1) * 0.009 * gather,
        0.35 + (trail % 3) * 0.006,
      )
      mesh.rotation.z = reduced ? trail * 0.35 : seconds * 7 + trail
      mesh.scale.setScalar(reduced ? 1 : gather)
    })
    // The physical cluster replaces only this live projectile's generic card mesh.
    const generic = originals.get(shot.id) ?? scene.getObjectByName(`fight-projectile:${shot.id}`)
    if (generic) {
      generic.visible = false
      originals.set(shot.id, generic)
    }
  }
  return {
    sync(state) {
      const frames = clock(state)
      group.userData.events = frames
      const shots = state.projectiles.filter((shot) => Boolean(shot.kallutoPaper))
      const active = new Set(shots.map((shot) => shot.id))
      for (const [id, held] of pieces)
        if (!active.has(id)) {
          group.remove(...held)
          pieces.delete(id)
          originals.delete(id)
        }
      shots.forEach(show)
      for (const side of ['player', 'opponent'] as const)
        posePaper(options, { state, side, frame: frames[side] })
    },
    dispose() {
      group.removeFromParent()
      pieces.clear()
      originals.clear()
      geometry.dispose()
      material.dispose()
    },
  }
}
function posePaper(
  options: EffectSceneOptions,
  c: { state: FightState; side: FightSide; frame: FineControlFrame },
) {
  const reduced = fineControlReduced(options)
  const fan = options.figureOf?.(c.side)?.getObjectByName('kalluto-paper-fan')
  if (fan)
    fan.rotation.z =
      reduced || c.frame.paperLaunch === null
        ? 0
        : Math.sin((Math.PI * c.frame.paperLaunch) / 18) * 0.22
  posePlanted(options, c)
}
function posePlanted(
  options: EffectSceneOptions,
  c: { state: FightState; side: FightSide; frame: FineControlFrame },
) {
  if (!c.frame.paperZone) return
  const reduced = fineControlReduced(options)
  const other = c.side === 'player' ? 'opponent' : 'player'
  const scrap = options
    .figureOf?.(other)
    ?.getObjectByName(`kalluto-paper:${c.side}:${c.frame.paperZone}`)
  if (scrap)
    scrap.rotation.z =
      0.35 +
      (reduced || c.frame.paperPlant === null
        ? 0
        : Math.sin((Math.PI * c.frame.paperPlant) / 18) * 0.3)
}

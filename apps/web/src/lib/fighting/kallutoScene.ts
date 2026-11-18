import { createFineControlClock } from './fineControlPresentation'
import { fineControlReduced } from './fineControlAnchors'
import {
  PAPER_STREAM_PIECES,
  PAPER_SCATTER_PIECES,
  paperRibbonFragment,
  paperRibbonDirection,
} from './kallutoPaperRibbon'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightProjectile, FightSide, FightState } from './types'
import type { FineControlFrame } from './fineControlPresentation'

/** Existing physical projectiles become small paper clusters, never extra hits or explosions. */
export function createKallutoPaperScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene, worldX, worldY } = options
  const clock = createFineControlClock()
  const geometry = new THREE.CircleGeometry(0.045, 3)
  const material = new THREE.MeshBasicMaterial({ color: 0xf4e9e5, side: THREE.DoubleSide })
  const group = new THREE.Group()
  group.name = 'kalluto-paper'
  const pieces = new Map<number, import('three').Mesh[]>()
  const originals = new Map<number, import('three').Object3D>()
  scene.add(group)
  function show(state: FightState, shot: FightProjectile) {
    let held = pieces.get(shot.id)
    if (!held) {
      held = Array.from(
        { length: shot.kallutoPaper === 'serpent' ? PAPER_STREAM_PIECES : PAPER_SCATTER_PIECES },
        () => new THREE.Mesh(geometry, material),
      )
      group.add(...held)
      pieces.set(shot.id, held)
    }
    const reduced = fineControlReduced(options)
    const direction = paperRibbonDirection(state, shot)
    held.forEach((mesh, trail) => {
      const piece = paperRibbonFragment({ shot, index: trail, reduced, direction })
      mesh.position.set(worldX(shot.x) + piece.x, worldY(shot.y) + piece.y, 0.35 + piece.z)
      mesh.rotation.set(reduced ? 0 : Math.sin(shot.age * 0.12 + trail) * 0.65, 0, piece.rotation)
      mesh.scale.setScalar(piece.scale)
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
      shots.forEach((shot) => show(state, shot))
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
  if (fan) {
    fan.rotation.y = -c.state[c.side].facing * 0.65
    const flutter =
      reduced || c.frame.paperLaunch === null
        ? 0
        : Math.sin((Math.PI * c.frame.paperLaunch) / 18) * 0.22
    fan.rotation.z = Math.PI + flutter
  }
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

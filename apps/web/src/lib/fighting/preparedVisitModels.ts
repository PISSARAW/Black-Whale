import { createVisitHatsuModel, disposeMountedVisitHatsu } from './visitHatsuModel'
import { BIRD_TETHER, BIRD_WINGS } from '$lib/tour/apparitionBasicView'
import { gyoSight } from './nenPerception'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { PreparedEntity } from './preparationTypes'
import type { FightState } from './types'
import type { Group, Line, BufferGeometry } from 'three'

export { disposeMountedVisitHatsu as disposePreparedVisitModels }

export function buildPreparedVisitModel(options: EffectSceneOptions, entry: PreparedEntity) {
  if (entry.kind !== 'flute' && entry.kind !== 'bird') return null
  const model = createVisitHatsuModel(options.THREE, {
    model: entry.kind === 'flute' ? 'melody-flute' : 'controlled-bird',
    anchor: 'floor', figureOwned: true,
  })
  model.fit(entry.kind === 'flute' ? { width: 0.65 } : { width: 0.5, depth: 0.45 })
  model.root.position.y = entry.kind === 'flute' ? 0.06 : 0.03
  if (entry.kind === 'bird') model.root.rotation.y = entry.owner === 'opponent' ? Math.PI / 2 : -Math.PI / 2
  const root = new options.THREE.Group()
  root.name = `prepared:${entry.id}`
  root.add(model.root)
  return root
}

export function syncPreparedVisitModel(options: EffectSceneOptions, context: {
  root: Group; entry: PreparedEntity; state: FightState; seconds: number
}) {
  const { root, entry, state, seconds } = context
  if (entry.kind !== 'bird') return
  const bird = root.getObjectByName('visit-hatsu:controlled-bird')!
  const previous = bird.userData.lastX ?? entry.x
  if (Math.abs(entry.x - previous) > 0.001) bird.rotation.y = entry.x > previous ? -Math.PI / 2 : Math.PI / 2
  bird.userData.lastX = entry.x
  const wings = bird.getObjectByName(BIRD_WINGS)!
  wings.children.forEach((wing, index) => {
    wing.rotation.z = (index === 0 ? -1 : 1) * Math.sin(seconds * 12) * (entry.controller ? 0.6 : 0.12)
  })
  syncBirdTether(options, { root, bird, entry, state })
}

function syncBirdTether(options: EffectSceneOptions, context: {
  root: Group; bird: import('three').Object3D; entry: PreparedEntity; state: FightState
}) {
  const { root, bird, entry, state } = context
  const tether = bird.getObjectByName(BIRD_TETHER) as Line<BufferGeometry>
  const controller = entry.controller
  tether.visible = controller?.source === 'cluck' && gyoSight(state.player)
  if (!controller || !tether.visible) return
  const owner = state[controller.side]
  const point = new options.THREE.Vector3(options.worldX(owner.x), options.worldY(owner.y) + 1.1, 0.3)
  const hand = options.figureOf?.(controller.side)?.getObjectByName('hand-right')
  hand?.getWorldPosition(point)
  root.updateWorldMatrix(true, true)
  tether.parent!.worldToLocal(point)
  const positions = tether.geometry.attributes.position
  positions.setXYZ(0, 0, 0, 0)
  positions.setXYZ(1, point.x, point.y, point.z)
  positions.needsUpdate = true
}

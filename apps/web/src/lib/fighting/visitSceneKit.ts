import { hatsuSourceFor } from './hatsu'
import { createVisitHatsuModel, type VisitHatsuModel } from './visitHatsuModel'
import { chrolloHasActivePage } from './chrolloBook'
import { voluntaryNenAvailable } from './nenAccess'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { ArcadeFighter, FighterId, FightSide, FightState } from './types'
import type { Object3D } from 'three'

type Definition = Parameters<typeof createVisitHatsuModel>[1] & {
  fit?: { width?: number; height?: number; depth?: number }
}

/** Scene ownership survives rig rebuilds and releases every model when the duel closes. */
export function createVisitScenePool(options: EffectSceneOptions) {
  const models = new Map<string, VisitHatsuModel>()
  return {
    get(key: string, definition: Definition) {
      let model = models.get(key)
      if (!model) {
        model = createVisitHatsuModel(options.THREE, definition)
        if (definition.fit) model.fit(definition.fit)
        model.root.name = key
        models.set(key, model)
        options.scene.add(model.root)
      }
      model.root.visible = true
      return model
    },
    hide() {
      models.forEach((model) => {
        model.root.visible = false
      })
    },
    dispose() {
      models.forEach((model) => model.dispose())
      models.clear()
    },
  }
}

export function ownsVisitHatsu(fighter: ArcadeFighter, source: FighterId): boolean {
  if (!voluntaryNenAvailable(fighter)) return false
  if (fighter.id === source) return true
  if (fighter.id === 'chrollo' && source !== 'chrollo') return chrolloHasActivePage(fighter, source)
  const held = fighter.kurapika?.held
  return Boolean(held?.used && held.source === source)
}

export function freeVisitHand(fighter: ArcadeFighter): 'left' | 'right' {
  return fighter.chrolloBook?.open ? 'left' : 'right'
}

export function visitAttackSource(fighter: ArcadeFighter): FighterId | null {
  if (!fighter.attack || !voluntaryNenAvailable(fighter)) return null
  const borrowed = fighter.kurapika?.held
  if (borrowed?.used) return borrowed.source
  return fighter.attack.hatsuSource ?? hatsuSourceFor(fighter, fighter.attack.moveId)
}

/** Read the posed skeleton, with a deterministic fallback for previews without a rig. */
export function placeVisitHand(
  options: EffectSceneOptions,
  placement: {
    state: FightState
    side: FightSide
    root: Object3D
    hand?: 'left' | 'right'
    wrist?: boolean
  },
) {
  const { state, side, root } = placement
  const fighter = state[side]
  const figure = options.figureOf?.(side)
  const hand = figure?.getObjectByName(`hand-${placement.hand ?? 'right'}`)
  root.position.set(
    options.worldX(fighter.x) + fighter.facing * 0.35,
    options.worldY(fighter.y) + 1.05,
    0.3,
  )
  root.rotation.set(0, fighter.facing * 0.5, 0)
  if (hand) hand.getWorldPosition(root.position)
  const orientation = placement.wrist ? hand : figure
  if (orientation) orientation.getWorldQuaternion(root.quaternion)
}

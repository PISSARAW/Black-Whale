import { fightWorldY } from '../fightCoordinates'
import { FIGHT_MODEL_POSES } from '../sceneMotion'
import { disposeMountedVisitHatsu } from '../visitHatsuModel'
import type { ProjectionSceneOptions } from '../hanzoProjectionScene'
import type { FighterPose, FightSide, FightState } from '../types'
import { KAMEO_CATALOGUE } from './catalogue'
import type { KameoId, KameoSlot } from './types'

type Model = ReturnType<ProjectionSceneOptions['buildFighter']>

/** Scale of the body while it appears and goes, so a call reads as an arrival. */
export function kameoPresence(slot: KameoSlot): number {
  const timing = KAMEO_CATALOGUE[slot.fighter.id as KameoId].timing
  if (slot.phase === 'entering') return 0.4 + 0.6 * Math.min(1, slot.phaseFrames / timing.enter)
  if (slot.phase === 'leaving') return Math.max(0, 1 - slot.phaseFrames / timing.leave)
  return 1
}

/** What the scene draws for one slot, or null when the kameo is off stage. */
export function kameoFigure(state: FightState, slot: KameoSlot) {
  const fallen = slot.phase === 'eliminated'
  if (fallen && slot.eliminatedRound !== state.roundNumber) return null
  if (slot.phase === 'reserve') return null
  return { scale: fallen ? 1 : kameoPresence(slot), pose: kameoPose(slot) }
}

function kameoPose(slot: KameoSlot): FighterPose | 'fallen' {
  if (slot.phase === 'eliminated' || slot.fighter.health <= 0) return 'fallen'
  if (slot.phase === 'acting' && slot.fighter.hitStun === 0) return 'special'
  return slot.fighter.pose
}

/** Draws each camp's kameo body beside the duel, with the visit likeness of its character. */
export function createKameoScene(options: ProjectionSceneOptions) {
  const held = new Map<FightSide, { model: Model; id: string }>()
  function modelFor(side: FightSide, slot: KameoSlot): Model {
    const current = held.get(side)
    if (current?.id === slot.fighter.id) return current.model
    if (current) remove(current.model)
    const model = options.buildFighter(slot.fighter)
    model.root.name = `kameo:${side}`
    options.scene.add(model.root)
    held.set(side, { model, id: slot.fighter.id })
    return model
  }
  function remove(model: Model) {
    disposeMountedVisitHatsu(model.root)
    options.scene.remove(model.root)
  }
  return {
    sync(state: FightState, seconds: number) {
      held.forEach(({ model }) => (model.root.visible = false))
      for (const side of ['player', 'opponent'] as const) {
        const slot = state.kameos?.[side]
        const figure = slot && kameoFigure(state, slot)
        if (!slot || !figure) continue
        const model = modelFor(side, slot)
        model.root.visible = figure.scale > 0
        model.root.scale.setScalar(figure.scale)
        model.root.position.set(options.worldX(slot.fighter.x), fightWorldY(slot.fighter.y), 0.2)
        model.root.rotation.y = slot.fighter.facing * 1.25
        const pose = figure.pose === 'fallen' ? 'fallen' : FIGHT_MODEL_POSES[figure.pose]
        model.animate(seconds, pose)
      }
    },
    dispose() {
      held.forEach(({ model }) => remove(model))
      held.clear()
    },
  }
}

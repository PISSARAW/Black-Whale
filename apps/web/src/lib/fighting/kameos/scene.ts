import { fightWorldY } from '../fightCoordinates'
import { fightFigureKey } from '../fighterFigure'
import { FIGHT_MODEL_POSES } from '../sceneMotion'
import { disposeMountedVisitHatsu } from '../visitHatsuModel'
import type { ProjectionSceneOptions } from '../hanzoProjectionScene'
import type { FighterId, FighterPose, FightSide, FightState } from '../types'
import { KAMEO_CATALOGUE } from './catalogue'
import type { KameoId, KameoSlot } from './types'
import { tubeppaAnimation } from './tubeppaMotion'
import { marayamAnimation } from './marayamMotion'
import { zhangLeiAnimation } from './zhangLeiMotion'
import { morenaAnimation } from './morenaMotion'
import { luzurusAnimation } from './luzurusMotion'
import { salesaleAnimation } from './salesaleMotion'
import type { HumanPose } from '$lib/tour/humanAnimation'

type Model = ReturnType<ProjectionSceneOptions['buildFighter']>
const ANIMATIONS: Partial<Record<FighterId, typeof tubeppaAnimation>> = {
  tubeppa: tubeppaAnimation,
  marayam: marayamAnimation,
  zhanglei: zhangLeiAnimation,
  morena: morenaAnimation,
  luzurus: luzurusAnimation,
  salesale: salesaleAnimation,
}
interface HeldModel {
  model: Model
  key: string
  fallFrame?: number
  lastFrame?: number
}

function animateKameo(
  held: HeldModel,
  slot: KameoSlot,
  context: {
    frame: number
    seconds: number
    pose: HumanPose
  },
) {
  const animation = ANIMATIONS[slot.fighter.id]
  if (!animation) {
    held.model.animate(context.seconds, context.pose)
    return
  }
  const dead = slot.phase === 'eliminated' || slot.fighter.health <= 0
  if (context.frame < (held.lastFrame ?? 0)) held.fallFrame = undefined
  held.lastFrame = context.frame
  if (!dead) held.fallFrame = undefined
  if (dead) held.fallFrame ??= context.frame
  const fallen = Math.min(1, (context.frame - (held.fallFrame ?? context.frame)) / 42)
  held.model.animate(context.seconds, 'idle', animation(slot, context.seconds, fallen))
}

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
  const held = new Map<FightSide, HeldModel>()
  function modelFor(side: FightSide, slot: KameoSlot): Model {
    const current = held.get(side)
    const key = fightFigureKey(slot.fighter)
    if (current?.key === key) return current.model
    if (current) remove(current.model)
    const model = options.buildFighter(slot.fighter)
    model.root.name = `kameo:${side}`
    options.scene.add(model.root)
    held.set(side, { ...current, model, key })
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
        animateKameo(held.get(side)!, slot, { frame: state.frame, seconds, pose })
      }
    },
    dispose() {
      held.forEach(({ model }) => remove(model))
      held.clear()
    },
  }
}

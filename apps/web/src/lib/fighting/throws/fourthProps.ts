import { Vector3 } from 'three'
import { createVisitHatsuModel } from '../visitHatsuModel'
import { biohazardAuthority, biohazardNen } from '../biohazard'
import { crossGameNenActive } from '../crossGame'
import { threadVisible } from '../fineControlAnchors'
import { throwPerformance } from './catalogue'
import type { EffectSceneOptions } from '../fighterEffectScene'
import type { ThrowCinematicFrame } from '../throwCinematic'
import type { FightState } from '../types'

/** Cards and cuffs illustrate the grip without granting warnings, cages or a restraint. */
export function createThrowFourthProps(options: EffectSceneOptions) {
  const cuffs = createVisitHatsuModel(options.THREE, { model: 'biohazard-cuffs' })
  const card = createVisitHatsuModel(options.THREE, { model: 'cross-game-card', stage: 1 })
  cuffs.fit({ width: 0.26 })
  card.fit({ height: 0.23, width: 0.16 })
  cuffs.root.name = 'throw-signature:cuffs'
  card.root.name = 'throw-signature:referee'
  options.scene.add(cuffs.root, card.root)
  const hide = () => {
    cuffs.root.visible = card.root.visible = false
  }
  hide()
  return {
    hide,
    sync(state: FightState, frame: ThrowCinematicFrame) {
      const effect = throwPerformance(frame.performance)?.effect
      if (effect === 'cuffs') {
        if (carriedCuffs(state, frame)) mountProp(options, frame, { root: cuffs.root, right: true })
        if (frame.powered) poseExistingPigeon(options, state, frame)
      }
      if (effect !== 'referee' || !crossGameNenActive(state[frame.attacker])) return
      if (!threadVisible(options, state, frame.attacker)) return
      mountProp(options, frame, { root: card.root, right: false })
      turnEarnedCard(state, frame, card.root)
    },
    dispose() {
      cuffs.dispose()
      card.dispose()
    },
  }
}

function carriedCuffs(state: FightState, frame: ThrowCinematicFrame) {
  const actor = state[frame.attacker]
  return (
    !actor.weaponsConfiscated &&
    actor.biohazard?.objects.some((object) => object.phase === 'carried')
  )
}

function mountProp(
  options: EffectSceneOptions,
  frame: ThrowCinematicFrame,
  prop: { root: import('three').Object3D; right: boolean },
) {
  const { root, right } = prop
  const hand = options
    .figureOf?.(frame.attacker)
    ?.getObjectByName(right ? 'hand-right' : 'hand-left')
  if (!hand || frame.age / frame.duration > 0.72) return
  root.visible = true
  hand.getWorldPosition(root.position)
  hand.getWorldQuaternion(root.quaternion)
  root.rotateX(right ? Math.PI / 2 : -0.3)
  root.position.z += 0.025
}

function poseExistingPigeon(
  options: EffectSceneOptions,
  state: FightState,
  frame: ThrowCinematicFrame,
) {
  const actor = state[frame.attacker]
  if (!pigeonAvailable(actor)) return
  const item = actor.biohazard?.objects.find(
    (object) =>
      ['flying', 'returning'].includes(object.phase) &&
      object.life > 0 &&
      Math.abs(object.x - state[frame.victim].x) < 18,
  )
  if (!item) return
  const root = options.scene.getObjectByName(`biohazard:${frame.attacker}:${item.id}`)
  const hand = options.figureOf?.(frame.victim)?.getObjectByName('hand-right')
  if (!root?.visible || !hand || frame.age / frame.duration > 0.65) return
  root.position.copy(hand.getWorldPosition(new Vector3()))
  root.position.y += 0.12
}

function turnEarnedCard(
  state: FightState,
  frame: ThrowCinematicFrame,
  card: import('three').Object3D,
) {
  // The reverse face is reserved for an already earned confinement.
  const condition = state[frame.victim].crossGame
  if (condition?.owner === frame.attacker && condition.phase === 'restrained') card.rotateY(Math.PI)
}

function pigeonAvailable(actor: FightState['player']) {
  return biohazardAuthority(actor) && biohazardNen(actor) && !actor.weaponsConfiscated
}

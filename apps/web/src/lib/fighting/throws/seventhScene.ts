import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { comboMasterMonitoring } from '../comboMasterAvailability'
import { secretWindowVisibleTo } from '../secretWindow'
import { voluntaryNenAvailable } from '../nenAccess'
import { chainAbilitySealed } from '../kurapika'
import { entitiesFor } from '../preparationWorld'
import { moonlightPartiesVisible } from '../moonlightParties'
import type { EffectSceneOptions } from '../fighterEffectScene'
import type { ThrowCinematicFrame } from '../throwCinematic'
import type { FightState } from '../types'

/** Witness existing preparation; never summon, sign, reveal or move an ability for a throw. */
export function createThrowSeventhScene(options: EffectSceneOptions) {
  const markers = ['analyst', 'aviary', 'agreement', 'spy'].map((effect) => {
    const marker = new options.THREE.Object3D()
    marker.name = `throw-signature:${effect}`
    options.scene.add(marker)
    return marker
  })
  const hide = () =>
    markers.forEach((marker) => {
      marker.visible = false
    })
  hide()
  return {
    hide,
    sync(state: FightState, frame: ThrowCinematicFrame) {
      const props = [
        existingConsole(options, state, frame),
        controlledBird(options, state, frame),
        actualAgreement(options, state, frame),
        privateOwl(options, state, frame),
      ]
      props.forEach((prop, index) => {
        if (!prop || !visible(prop)) return
        markers[index].visible = true
        prop.getWorldPosition(markers[index].position)
      })
    },
    dispose() {
      markers.forEach((marker) => marker.removeFromParent())
    },
  }
}
function visible(node: import('three').Object3D): boolean {
  return node.visible && (!node.parent || visible(node.parent))
}
function existingConsole(
  options: EffectSceneOptions,
  state: FightState,
  frame: ThrowCinematicFrame,
) {
  if (!frame.performance?.startsWith('furykov')) return
  if (
    frame.attacker !== (options.viewer?.() ?? 'player') ||
    !comboMasterMonitoring(state[frame.attacker])
  )
    return
  return consoleAtHand(options, frame)
}
function controlledBird(
  options: EffectSceneOptions,
  state: FightState,
  frame: ThrowCinematicFrame,
) {
  if (!frame.performance?.startsWith('cluck')) return
  const actor = state[frame.attacker]
  if (!voluntaryNenAvailable(actor) || chainAbilitySealed(actor, 'cluck:birdManipulation')) return
  const bird = entitiesFor(state, frame.attacker, 'bird').find(
    (entry) =>
      entry.controller?.side === frame.attacker &&
      entry.controller.source === 'cluck' &&
      Math.abs(entry.x - actor.x) < 15,
  )
  return bird ? options.scene.getObjectByName(`prepared:${bird.id}`) : undefined
}
function actualAgreement(
  options: EffectSceneOptions,
  state: FightState,
  frame: ThrowCinematicFrame,
) {
  if (!frame.performance?.startsWith('longhi')) return
  const moonlight = state.moonlight
  if (!moonlight) return
  const agreement = moonlight.offer ?? moonlight.active
  if (
    !agreement ||
    agreement.issuer !== frame.attacker ||
    !moonlightPartiesVisible(state, agreement)
  )
    return
  return options.scene.getObjectByName(
    `moonlight-contract:${moonlight.active ? 'signed' : 'offer'}`,
  )
}
function privateOwl(options: EffectSceneOptions, state: FightState, frame: ThrowCinematicFrame) {
  if (!frame.performance?.startsWith('musse')) return
  if (!secretWindowVisibleTo(state, frame.attacker, options.viewer?.() ?? 'player')) return
  return owlOnBody(options, state, frame)
}

function consoleAtHand(options: EffectSceneOptions, frame: ThrowCinematicFrame) {
  const console = options.scene.getObjectByName(`combo-master:${frame.attacker}`)
  const hand = options.figureOf?.(frame.attacker)?.getObjectByName('hand-left')
  if (!console || !hand) return
  hand.getWorldPosition(console.position)
  // Keep the real monitor beside the shoulder so it does not cover the gripping hands.
  console.position.x -= frame.facing * 0.42
  console.position.y -= 0.08
  console.position.z += 0.15
  console.rotation.y += frame.facing * 0.35
  return console
}
function owlOnBody(options: EffectSceneOptions, state: FightState, frame: ThrowCinematicFrame) {
  const feed = state[frame.attacker].secretWindow!
  const side = feed.mode === 'listening' ? frame.attacker : feed.target
  const figure = options.figureOf?.(side)
  const human = figure && humanAnimationRig(figure)
  const owl = options.scene.getObjectByName(`secret-window-${frame.attacker}`)
  if (!owl || !human) return
  human.head.getWorldPosition(owl.position)
  owl.position.x -= 0.2
  owl.position.y -= 0.18
  owl.position.z += 0.25
  return owl
}

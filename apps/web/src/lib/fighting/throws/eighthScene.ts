import { padailleNenActive } from '../padailleWeapon'
import { sweetHomeAvailable } from '../sweetHomeContacts'
import { lsdfCanPersist } from '../lsdf'
import { DOOR_FRAMES } from '../voconteDoors'
import { entitiesFor, liveEntity } from '../preparationWorld'
import type { EffectSceneOptions } from '../fighterEffectScene'
import type { ThrowCinematicFrame } from '../throwCinematic'
import type { FightState } from '../types'

/** Existing anatomy and preparation only: no tool, wound transfer, teleport or guard attack is created. */
export function createThrowEighthScene(options: EffectSceneOptions) {
  const markers = ['artisan', 'scout', 'relay', 'gatekeeper', 'bailiff'].map((effect) => {
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
        actualTool(options, state, frame),
        littleEyeAnimal(options, state, frame),
        selectedRecipient(options, state, frame),
        physicalDoor(options, state, frame),
        declaredGuards(options, state, frame),
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
function actualTool(options: EffectSceneOptions, state: FightState, frame: ThrowCinematicFrame) {
  if (!frame.performance?.startsWith('padaille')) return
  const actor = state[frame.attacker]
  if (!actor.padailleTool || !padailleNenActive(actor)) return
  return options
    .figureOf?.(frame.attacker)
    ?.getObjectByName(`padaille-${actor.padailleTool}-right-hand`)
}
function littleEyeAnimal(
  options: EffectSceneOptions,
  state: FightState,
  frame: ThrowCinematicFrame,
) {
  if (!frame.performance?.startsWith('sayird')) return
  const animal = entitiesFor(state, frame.attacker, 'animal').find(
    (entry) =>
      entry.material === 'real' &&
      entry.controller?.side === frame.attacker &&
      entry.controller.source === 'sayird' &&
      Math.abs(entry.x - state[frame.attacker].x) < 18,
  )
  return animal ? options.scene.getObjectByName(`prepared:${animal.id}`) : undefined
}
function selectedRecipient(
  options: EffectSceneOptions,
  state: FightState,
  frame: ThrowCinematicFrame,
) {
  if (!frame.performance?.startsWith('terebellum') || !sweetHomeAvailable(state, frame.attacker))
    return
  const id = state[frame.attacker].sweetHomeObject
  const object = state.battlefield?.entities.find(
    (entry) =>
      entry.id === id && entry.kind === 'crate' && entry.material === 'real' && liveEntity(entry),
  )
  return object ? options.scene.getObjectByName(`prepared:${object.id}`) : undefined
}
function physicalDoor(options: EffectSceneOptions, state: FightState, frame: ThrowCinematicFrame) {
  if (!frame.performance?.startsWith('voconte')) return
  const door = DOOR_FRAMES.find((entry) => Math.abs(entry.x - state[frame.attacker].x) < 12)
  return door ? options.scene.getObjectByName(`voconte:frame:${door.id}`) : undefined
}
function declaredGuards(
  options: EffectSceneOptions,
  state: FightState,
  frame: ThrowCinematicFrame,
) {
  if (!frame.performance?.startsWith('yokotani')) return
  if (!state.lsdf?.[frame.attacker] || !lsdfCanPersist(state, frame.attacker)) return
  return options.scene.getObjectByName(`lsdf:${frame.attacker}`)
}

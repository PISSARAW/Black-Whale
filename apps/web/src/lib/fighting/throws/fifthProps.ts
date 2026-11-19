import { Vector3 } from 'three'
import { hasBashoPoem } from '../bashoPoem'
import { predatorNenAvailable } from '../predator'
import { threadVisible } from '../fineControlAnchors'
import type { EffectSceneOptions } from '../fighterEffectScene'
import type { ThrowCinematicFrame } from '../throwCinematic'
import type { FightState } from '../types'

/** Borrow existing props; a living Camilla never gains a cat and Predator keeps hunting Nen. */
export function createThrowFifthProps(options: EffectSceneOptions) {
  const markers = ['hunter', 'poet', 'royal'].map((effect) => {
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
        existingPredator(options, state, frame),
        writtenPoem(options, state, frame),
        royalPistol(options, state, frame),
      ]
      props.forEach((prop, index) => {
        if (!prop?.visible) return
        markers[index].visible = true
        prop.getWorldPosition(markers[index].position)
      })
    },
    dispose() {
      markers.forEach((marker) => marker.removeFromParent())
    },
  }
}

function existingPredator(
  options: EffectSceneOptions,
  state: FightState,
  frame: ThrowCinematicFrame,
) {
  if (!frame.performance?.startsWith('rihan')) return
  const actor = state[frame.attacker]
  if (!actor.predator?.hunt || !predatorNenAvailable(actor)) return
  if (!threadVisible(options, state, frame.attacker)) return
  return options.scene.getObjectByName(`predator:${frame.attacker}`)
}

function writtenPoem(options: EffectSceneOptions, state: FightState, frame: ThrowCinematicFrame) {
  if (!frame.performance?.startsWith('basho')) return
  const actor = state[frame.attacker]
  if (!readyPoem(actor)) return
  const paper = options.scene.getObjectByName(`basho-poem:${frame.attacker}`)
  const hand = options.figureOf?.(frame.attacker)?.getObjectByName('hand-left')
  if (!paper?.visible || !hand) return
  hand.getWorldPosition(paper.position)
  hand.getWorldQuaternion(paper.quaternion)
  paper.rotateX(-0.4)
  return paper
}

function readyPoem(actor: FightState['player']) {
  return actor.bashoPoem?.ready && hasBashoPoem(actor)
}

function royalPistol(options: EffectSceneOptions, state: FightState, frame: ThrowCinematicFrame) {
  if (frame.performance !== 'camilla-dismissal' || state[frame.attacker].weaponsConfiscated) return
  if (frame.age / frame.duration > 0.7) return
  const guns = options.scene.children.filter((node) => node.name === 'camilla-pistol')
  const gun = guns[frame.attacker === 'player' ? 0 : 1]
  const hand = options.figureOf?.(frame.attacker)?.getObjectByName('hand-right')
  if (!gun || !hand) return
  gun.visible = true
  gun.scale.setScalar(1)
  hand.getWorldPosition(gun.position)
  hand.getWorldQuaternion(gun.quaternion)
  gun.rotateY(Math.PI)
  gun.position.add(new Vector3(0, -0.04, 0))
  return gun
}

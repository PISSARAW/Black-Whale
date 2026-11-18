import { createThrowBindings } from './bindings'
import { alignThrowGrip, alignThrowPuppet } from './contacts'
import { createThrowFuture } from './futureScene'
import { createThrowEquipment } from './equipment'
import { createThrowTextiles } from './textiles'
import { createThrowFourthScene } from './fourthScene'
import { createThrowThirdDetails } from './thirdDetails'
import { signatureNenAvailable } from './selection'
import { throwPerformance } from './catalogue'
import { fighterDefinition } from '../roster'
import type { EffectSceneOptions, FighterEffectScene } from '../fighterEffectScene'
import type { ThrowCinematicFrame } from '../throwCinematic'
import type { FightState } from '../types'

/** Scene-owned resources follow the one shared throw clock, including pause, KO and replay seeks. */
export function createThrowSignatureScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const bindings = createThrowBindings(options)
  const future = createThrowFuture(options)
  const equipment = createThrowEquipment(options)
  const textiles = createThrowTextiles(options)
  const details = createThrowThirdDetails(options)
  const fourth = createThrowFourthScene(options)
  const geometry = new THREE.RingGeometry(0.32, 0.36, 48)
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const aura = new THREE.Mesh(geometry, material)
  aura.name = 'throw-signature:super-aura'
  aura.rotation.x = -Math.PI / 2
  aura.visible = false
  scene.add(aura)
  return {
    sync(state) {
      bindings.hide()
      future.hide()
      equipment.reset()
      textiles.hide()
      details.hide()
      fourth.hide()
      aura.visible = false
      const frame = options.throwFrame?.()
      if (!frame?.active) return
      const performance = throwPerformance(frame.performance)
      if (physicalGrip(performance)) alignThrowGrip(options, frame)
      alignThrowPuppet(options, state, frame)
      bindings.sync(state, frame)
      future.sync(frame)
      poseBook(options, state, frame)
      equipment.sync(state, frame)
      textiles.sync(state, frame)
      details.sync(state, frame)
      fourth.sync(state, frame)
      if (!frame.powered || options.comfort?.().flashes === false) return
      const actor = options.figureOf?.(frame.attacker)
      if (!actor) return
      aura.visible = true
      actor.getWorldPosition(aura.position)
      const t = frame.age / frame.duration
      aura.position.y += 0.08 + Math.sin(Math.PI * t) * 0.15
      aura.scale.setScalar(1 + t * 1.2)
      material.color.set(fighterDefinition(state[frame.attacker].id).accent)
      material.opacity = Math.sin(Math.PI * t) * 0.45
    },
    dispose() {
      bindings.dispose()
      future.dispose()
      equipment.dispose()
      textiles.dispose()
      details.dispose()
      fourth.dispose()
      aura.removeFromParent()
      geometry.dispose()
      material.dispose()
    },
  }
}

function physicalGrip(performance: ReturnType<typeof throwPerformance>) {
  if (!performance || ['prop', 'scissors'].includes(performance.grip ?? '')) return false
  return !['chain', 'gum'].includes(performance.effect)
}

function poseBook(options: EffectSceneOptions, state: FightState, frame: ThrowCinematicFrame) {
  if (!frame.performance?.startsWith('chrollo') || !signatureNenAvailable(state, frame.attacker))
    return
  const figure = options.figureOf?.(frame.attacker)
  const book = figure?.getObjectByName('chrollo-open-book')
  const closed = figure?.getObjectByName('chrollo-closed-book')
  if (book) book.visible = true
  if (closed) closed.visible = false
}

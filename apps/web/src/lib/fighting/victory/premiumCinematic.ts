import { Group, PointLight, Vector3 } from 'three'
import type { VictoryContext } from './types'
import { victoryShot } from './camera'
import { premiumImpactPhase, type PremiumImpactTiming } from './premiumCinematicTiming'

interface SignatureShot {
  start: number
  end: number
  width: number
  height: number
}

interface PremiumCinematicBeat extends PremiumImpactTiming {
  focus: Vector3
  strength?: number
  signature?: SignatureShot
}

function applyAnticipation(context: VictoryContext, anticipation: number, strength: number) {
  context.hero.root.position.x -= anticipation * 0.055 * strength
  context.hero.root.rotation.z += anticipation * 0.025 * strength
}

function applyReaction(context: VictoryContext, recoil: number, strength: number) {
  context.victim.root.position.x += recoil * 0.16 * strength
  context.victim.root.position.y += recoil * 0.025 * strength
  context.victim.root.rotation.z -= recoil * 0.16 * strength
  context.victim.head.rotation.z -= recoil * 0.11 * strength
}

function applySignatureShot(context: VictoryContext, beat: PremiumCinematicBeat) {
  const shot = beat.signature
  if (!shot || context.comfort.camera === 0) return false
  if (context.age < shot.start || context.age >= shot.end) return false
  victoryShot(context, {
    target: beat.focus,
    offset: new Vector3(0.18, 0.08, 2.2),
    width: shot.width,
    height: shot.height,
  })
  return true
}

function applyCameraImpulse(context: VictoryContext, recoil: number, strength: number) {
  const amount = recoil * strength * context.comfort.shake
  if (!amount) return 0
  const x = Math.sin(context.age * 2.39996) * 0.035 * amount
  const y = Math.cos(context.age * 1.73205) * 0.024 * amount
  context.camera.position.x += x
  context.camera.position.y += y
  context.camera.updateMatrixWorld(true)
  return Math.hypot(x, y)
}

export function createPremiumCinematic() {
  const root = new Group()
  const key = new PointLight(0xffc98a, 0, 7, 1.5)
  root.name = 'premium-cinematic-light'
  root.add(key)
  return {
    apply(context: VictoryContext, beat: PremiumCinematicBeat) {
      const phase = premiumImpactPhase(context.age, beat)
      const strength = beat.strength ?? 1
      applyAnticipation(context, phase.anticipation, strength)
      applyReaction(context, phase.recoil, strength)
      context.hero.root.updateWorldMatrix(true, true)
      context.victim.root.updateWorldMatrix(true, true)
      const signature = applySignatureShot(context, beat)
      const cameraImpulse = applyCameraImpulse(context, phase.recoil, strength)
      root.position.copy(beat.focus)
      key.intensity = context.comfort.flashes
        ? (phase.contact * 0.55 + phase.recoil * 0.15) * strength
        : phase.recoil * 0.18 * strength
      key.visible = key.intensity > 0
      context.add(root)
      context.scene.userData.premiumCinematic = {
        stage: phase.stage,
        anticipation: phase.anticipation,
        contact: phase.contact,
        recoil: phase.recoil,
        settle: phase.settle,
        signature,
        cameraImpulse,
        light: key.intensity,
      }
    },
    dispose() {
      root.removeFromParent()
      key.dispose()
    },
  }
}

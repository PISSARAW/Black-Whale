import { blinkyAvailable, blinkyCommand } from './blinky'
import { attackPhase } from './frameData'
import { blinkyStrikeArc } from './shizukuStrikeMotion'
import type { ArcadeFighter } from './types'
import type { Object3D, Quaternion } from 'three'
import type { HumanFigure, HumanFigureBuild } from '$lib/tour/humanFigure'
import { createVisitHatsuModel, type VisitHatsuModel } from './visitHatsuModel'

const MODELS = new WeakMap<Object3D, { visual: VisitHatsuModel; orientation: Quaternion }>()

/** Same eye stalks, toothed nozzle and tongue as the visit, held by the duel's wrist. */
export function addBlinky(options: {
  THREE: HumanFigureBuild['THREE']
  glow: HumanFigureBuild['glow']
  model: HumanFigure
}): void {
  const visual = createVisitHatsuModel(options.THREE, {
    model: 'blinky',
    figureOwned: true,
    joints: ['tongue', 'open-mouth'],
  })
  visual.fit({ height: 0.82, width: 0.55 })
  visual.root.name = 'shizuku-blinky'
  visual.root.position.set(0, -0.25, 0.08)
  options.model.root.getObjectByName('hand-right')?.add(visual.root)
  MODELS.set(options.model.turns, { visual, orientation: new options.THREE.Quaternion() })
}

/** Wrist poses carry the tool; suction adds a small tongue movement in its active frames. */
export function animateBlinky(figure: Object3D, fighter: ArcadeFighter, seconds: number): void {
  const held = MODELS.get(figure)
  if (!held) return
  const model = held.visual
  model.root.visible = blinkyAvailable(fighter)
  const sucking = Boolean(blinkyCommand(fighter)) && attackPhase(fighter) === 'active'
  // Utility commands aim upright; physical strikes carry the tool through its authored arc.
  model.root.parent!.getWorldQuaternion(model.root.quaternion).invert()
  model.root.quaternion.multiply(figure.getWorldQuaternion(held.orientation))
  const arc = blinkyStrikeArc(fighter)
  if (arc) {
    model.root.rotateX(arc[0])
    model.root.rotateZ(arc[2])
  }
  model.root.rotateZ(sucking ? Math.sin(seconds * 22) * 0.025 : 0)
  model.root.position.set(0, -0.25, 0.08).applyQuaternion(model.root.quaternion)
  const tongue = model.joints.get('tongue')!
  tongue.rotation.x = sucking ? Math.sin(seconds * 18) * 0.07 : 0
}

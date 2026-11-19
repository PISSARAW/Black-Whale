import { createKurapikaChainModel } from '../kurapikaChainModel'
import { createBungeeStrand } from '../bungeeStrandScene'
import { chainFinger } from '../kurapikaChainAnchors'
import { hisokaHand, hisokaChest } from '../hisokaEffectAnchors'
import { kurapikaNenVisible } from '../kurapikaAccentScene'
import { signatureNenAvailable } from './selection'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import type { EffectSceneOptions } from '../fighterEffectScene'
import type { FightState } from '../types'
import type { ThrowCinematicFrame } from '../throwCinematic'

export function createThrowBindings(options: EffectSceneOptions) {
  const chain = createKurapikaChainModel(options.THREE)
  chain.root.name = 'throw-signature:chain'
  options.scene.add(chain.root)
  const gum = createBungeeStrand(options, 'throw-signature:gum')
  const hide = () => {
    chain.root.visible = false
    gum.root.visible = false
  }
  hide()
  return {
    hide,
    sync(state: FightState, frame: ThrowCinematicFrame) {
      hide()
      if (frame.age / frame.duration >= 0.82) return
      if (!signatureNenAvailable(state, frame.attacker)) return
      if (!kurapikaNenVisible(options, state, frame.attacker)) return
      if (frame.performance?.startsWith('kurapika')) {
        chain.root.visible = true
        chain.hide()
        const old = options.scene.getObjectByName(`kurapika-chains:${frame.attacker}`)
        if (old) old.visible = false
        const from = chainFinger(options, { state, side: frame.attacker, stage: 0 })
        const points = chainPoints(options, { state, frame, from })
        chain.draw({ stage: 0, points, direction: points.at(-1)!.clone().sub(points.at(-2)!) })
      }
      if (frame.performance?.startsWith('hisoka')) {
        const from = hisokaHand(options, state, frame.attacker)
        const to = hisokaChest(options, state, frame.victim)
        const t = frame.age / frame.duration
        const points = Array.from({ length: 25 }, (_, index) => {
          const u = index / 24,
            point = from.clone().lerp(to, u)
          point.y -= Math.sin(Math.PI * u) * (t < 0.3 ? 0.16 : 0.025)
          return point
        })
        gum.sync({ points, hidden: false, frames: null })
      }
    },
    dispose() {
      chain.dispose()
      gum.dispose()
    },
  }
}

function chainPoints(
  options: EffectSceneOptions,
  context: {
    state: FightState
    frame: ThrowCinematicFrame
    from: import('three').Vector3
  },
) {
  const { from } = context
  const centre = bindingTarget(options, context)
  const points = [from, from.clone().lerp(centre, 0.5)]
  for (let i = 0; i <= 16; i++) {
    const angle = (i / 16) * Math.PI * 2
    points.push(
      centre
        .clone()
        .add(new options.THREE.Vector3(Math.cos(angle) * 0.11, Math.sin(angle) * 0.11, 0.02)),
    )
  }
  return points
}

function bindingTarget(
  options: EffectSceneOptions,
  context: { state: FightState; frame: ThrowCinematicFrame },
) {
  const { frame, state } = context
  const figure = options.figureOf?.(frame.victim)
  const human = figure && humanAnimationRig(figure)
  const ankle = frame.performance === 'kurapika-last-link'
  const node = ankle ? human?.knees[0].children[1] : figure?.getObjectByName('hand-left')
  return (
    node?.getWorldPosition(new options.THREE.Vector3()) ?? hisokaChest(options, state, frame.victim)
  )
}

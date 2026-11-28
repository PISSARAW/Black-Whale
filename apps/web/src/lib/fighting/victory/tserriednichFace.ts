import type { VictoryActor, VictoryContext } from './types'
import { ease } from './resources'
import { FUTURE_EYES_OPEN, FUTURE_SHOT, FUTURE_VERDICT } from './tserriednichTiming'

function expression(
  context: VictoryContext,
  actor: VictoryActor,
  { eyelid, brow, mouth }: { eyelid: number; brow: number; mouth: number },
) {
  for (const side of ['left', 'right']) {
    const eye = actor.head.getObjectByName(`face-eye-${side}`)
    const eyebrow = actor.head.getObjectByName(`face-brow-${side}`)
    if (eye) {
      context.save(eye)
      eye.scale.y *= eyelid
    }
    if (eyebrow) {
      const y = eyebrow.position.y
      const height = eyebrow.scale.y
      context.defer(() => {
        eyebrow.position.y = y
        eyebrow.scale.y = height
      })
      eyebrow.position.y = y + brow * 0.022
      eyebrow.scale.y = height * (1 + brow * 0.19)
    }
  }
  const lips = actor.head.getObjectByName('face-mouth')
  if (lips) {
    const height = lips.scale.y
    context.defer(() => {
      lips.scale.y = height
    })
    lips.scale.y = height * mouth
  }
}

export function revealFutureEyes(context: VictoryContext, perceived: boolean) {
  const time = context.frame.elapsed
  const close = ease((time - 0.13) / 0.24)
  const open = perceived ? 0 : ease((time - FUTURE_EYES_OPEN) / 0.14)
  const resolve = ease((time - FUTURE_VERDICT) / 0.42)
  expression(context, context.hero, {
    eyelid: 1 - close * (1 - open) * 0.96 - resolve * 0.12,
    brow: -0.7 * close * (1 - open) - 0.25 * resolve,
    mouth: 1 - close * (1 - open) * 0.22 - resolve * 0.15,
  })

  const recognition = ease((time - 7.21) / 0.29)
  const retreat = ease((time - FUTURE_SHOT) / 0.19)
  const surprise = recognition * (1 - retreat)
  if (recognition > 0) {
    expression(context, context.victim, {
      eyelid: 1 + surprise * 0.24 - retreat * 0.52,
      brow: surprise * 0.89,
      mouth: 1 + surprise * 0.42,
    })
  }
}

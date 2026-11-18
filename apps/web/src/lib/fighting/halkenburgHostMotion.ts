import { canMove } from './fightActorState'
import { poseFighter } from './fightActorPose'
import { steerFighter } from './fighterMovement'
import { EMPTY_INPUT, type ArcadeFighter } from './types'

export function halkenburgBodyControl(body: ArcadeFighter): ArcadeFighter | null {
  if (body.halkenburgSleeping) return poseFighter(body)
  if (body.halkenburgSoul) return poseFighter(steerHalkenburgHost(body))
  if (body.halkenburgPassenger)
    return poseFighter(steerHalkenburgBody(body, body.halkenburgPassenger.motion))
  return null
}

/** The occupied body moves physically; its original owner's input does not steer it. */
export function steerHalkenburgHost(body: ArcadeFighter): ArcadeFighter {
  return steerHalkenburgBody(body, body.halkenburgSoul!.motion)
}

function steerHalkenburgBody(
  body: ArcadeFighter,
  motion?: 'left' | 'right' | 'stay',
): ArcadeFighter {
  const input = {
    ...EMPTY_INPUT,
    left: motion === 'left',
    right: motion === 'right',
  }
  const physical = { ...body, halkenburgSoul: undefined, halkenburgPassenger: undefined }
  const moved = steerFighter(physical, { input, mobile: canMove(physical), jumpable: false })
  return {
    ...moved,
    halkenburgSoul: body.halkenburgSoul,
    halkenburgPassenger: body.halkenburgPassenger,
  }
}

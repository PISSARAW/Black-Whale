import { canMove } from './fightActorState'
import { poseFighter } from './fightActorPose'
import { steerFighter } from './fighterMovement'
import { EMPTY_INPUT, type ArcadeFighter } from './types'

export function halkenburgBodyControl(body: ArcadeFighter): ArcadeFighter | null {
  if (body.halkenburgSoul) return poseFighter(steerHalkenburgHost(body))
  return body.halkenburgSleeping ? poseFighter(body) : null
}

/** The occupied body moves physically; its original owner's input does not steer it. */
export function steerHalkenburgHost(body: ArcadeFighter): ArcadeFighter {
  const soul = body.halkenburgSoul!
  const input = {
    ...EMPTY_INPUT,
    left: soul.motion === 'left',
    right: soul.motion === 'right',
  }
  const physical = { ...body, halkenburgSoul: undefined }
  const moved = steerFighter(physical, { input, mobile: canMove(physical), jumpable: false })
  return { ...moved, halkenburgSoul: soul }
}

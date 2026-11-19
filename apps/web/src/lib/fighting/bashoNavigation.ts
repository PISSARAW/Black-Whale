import { hasBashoPoem } from './bashoPoem'
import { canMove } from './fightActorState'
import { freeDeviceHand } from './deviceHands'
import { steerFighter } from './fighterMovement'
import { perceivedOpponentGap } from './opponentAwareness'
import { EMPTY_INPUT, type ArcadeFighter, type FightState, type FightInput } from './types'

export function bashoWritingNavigation(
  state: FightState,
  actor: ArcadeFighter,
): ArcadeFighter | null {
  const view = { ...state, opponent: actor }
  if (!canMove(actor) || actor.writingKit || !hasBashoPoem(actor)) return null
  if (perceivedOpponentGap(view) < 16 || !freeDeviceHand(view, 'opponent')) return null
  const kit = state.battlefield?.entities.find(
    (e) => e.present && e.owner === 'opponent' && e.writingKit,
  )
  if (!kit || Math.abs(kit.x - actor.x) > 18 || Math.abs(kit.x - actor.x) <= 4) return null
  const direction = Math.sign(kit.x - actor.x)
  const input = { ...EMPTY_INPUT, left: direction < 0, right: direction > 0 }
  return walkNormally(actor, input)
}

function walkNormally(actor: ArcadeFighter, input: FightInput): ArcadeFighter {
  const tracked = actor.motion
    ? { ...actor, motion: { ...actor.motion, tapWindow: 0, tapDirection: 0 as const } }
    : actor
  return steerFighter({ ...tracked, blocking: false }, { input, mobile: true, jumpable: false })
}

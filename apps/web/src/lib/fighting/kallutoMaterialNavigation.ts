import { needsPaperStock, usablePaperStock } from './kallutoMaterialAi'
import { paperKitInReach } from './kallutoMaterialActions'
import { canMove } from './fightActorState'
import { freeDeviceHand } from './deviceHands'
import { steerFighter } from './fighterMovement'
import { perceivedOpponentGap } from './opponentAwareness'
import { EMPTY_INPUT, type ArcadeFighter, type FightState } from './types'

export function paperKitNavigation(state: FightState, actor: ArcadeFighter): ArcadeFighter | null {
  const view = { ...state, opponent: actor }
  if (!canMove(actor) || !needsPaperStock(actor) || !freeDeviceHand(view, 'opponent')) return null
  if (perceivedOpponentGap(view) < 16) return null
  const supply = state.battlefield?.entities.find(
    (entry) =>
      entry.present &&
      entry.health > 0 &&
      usablePaperStock(entry.paperKit) &&
      Math.abs(entry.x - actor.x) <= 18,
  )
  if (!supply || paperKitInReach(view, 'opponent', supply)) return null
  const direction = Math.sign(supply.x - actor.x)
  const motion = actor.motion
    ? { ...actor.motion, tapWindow: 0, tapDirection: 0 as const }
    : undefined
  return steerFighter(
    { ...actor, motion, blocking: false },
    {
      input: { ...EMPTY_INPUT, left: direction < 0, right: direction > 0 },
      mobile: true,
      jumpable: false,
    },
  )
}

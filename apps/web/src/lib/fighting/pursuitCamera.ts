import { isAirPursuit } from './directionalChain'
import type { FightState } from './types'

/** One shot holds from the confirmed launcher through either fighter's answer. */
export function pursuitCameraActive(state: FightState): boolean {
  if (state.phase !== 'fighting') return false
  const { player, opponent } = state
  return Boolean(pursues(player) || pursues(opponent) || player.airRecovery || opponent.airRecovery)
}

function pursues(fighter: FightState['player']) {
  return (
    isAirPursuit(fighter.attack?.directionalChain) ||
    (fighter.attack?.directionalChain === 'air' && fighter.attack.confirmedHit)
  )
}

/** Retain the near end of the sleeper in portrait framing without fitting the full body. */
export function pursuitSleeperEdge(bodyX: number, actors: readonly number[]): number {
  const centre = (Math.min(...actors) + Math.max(...actors)) / 2
  const direction = Math.sign(bodyX - centre)
  const towardsFight = Math.max(0, Math.abs(bodyX - centre) - 0.65)
  return centre + direction * Math.min(2, towardsFight)
}

/** Let a contact finish its shot even if the impact cancels both aerial actions. */
export function createPursuitCameraHold() {
  let until = -1
  let frame = -1
  let match = ''
  return (state: FightState): boolean => {
    const key = `${state.player.id}:${state.opponent.id}:${state.roundNumber}`
    if (state.frame < frame || key !== match || state.phase !== 'fighting') until = -1
    frame = state.frame
    match = key
    if (pursuitCameraActive(state)) until = frame + 8
    return frame <= until
  }
}

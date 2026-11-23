import { activeHitbox, boxesOverlap, contactPoint } from './frameData'
import { attackCanResolve } from './impactAdmission'
import { isCriticalAuraStrike, releaseFocusedAura } from './nen'
import { nenOutputCapacity } from './nenBudget'
import type { ArcadeFighter, FightState } from './types'

const CLASH_PUSHBACK = 4
const CLASH_HITSTOP = 8

/** Two committed Ko hitboxes meeting on one frame cancel before either body is struck. */
export function resolveKoClash(state: FightState): FightState | null {
  const playerBox = koHitbox(state.player)
  const opponentBox = koHitbox(state.opponent)
  if (!playerBox || !opponentBox || !boxesOverlap(playerBox, opponentBox)) return null

  const playerRen = nenOutputCapacity(state.player)
  const opponentRen = nenOutputCapacity(state.opponent)
  const winner = playerRen === opponentRen ? null : playerRen > opponentRen ? 'player' : 'opponent'
  const position = contactPoint(playerBox, opponentBox)
  let player = cancelKoAttack(state.player)
  let opponent = cancelKoAttack(state.opponent)

  if (winner === 'player') opponent = pushFromClash(opponent, player)
  if (winner === 'opponent') player = pushFromClash(player, opponent)

  return {
    ...state,
    player,
    opponent,
    hitstop: Math.max(state.hitstop, CLASH_HITSTOP),
    attackClash: {
      sequence: (state.attackClash?.sequence ?? 0) + 1,
      frame: state.frame,
      winner,
      playerRen,
      opponentRen,
      position,
    },
  }
}

function koHitbox(fighter: ArcadeFighter) {
  if (!attackCanResolve(fighter) || !isCriticalAuraStrike(fighter)) return null
  return activeHitbox(fighter)
}

function cancelKoAttack(fighter: ArcadeFighter): ArcadeFighter {
  const released = releaseFocusedAura(fighter)
  return { ...released, attack: null, pose: released.y > 0 ? 'jump' : 'idle' }
}

function pushFromClash(loser: ArcadeFighter, winner: ArcadeFighter): ArcadeFighter {
  const direction = winner.x <= loser.x ? 1 : -1
  return { ...loser, x: Math.max(7, Math.min(93, loser.x + direction * CLASH_PUSHBACK)) }
}

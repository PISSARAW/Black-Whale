import { judgmentForbidsNen } from './judgmentRules'
import { perceivedOpponentGap } from './opponentAwareness'
import { seesCombatBody } from './fightCounterplay'
import { advancedOpponentNen } from './nenAi'
import { applyAuraContext } from './nen'
import { chainsImmobilize } from './kurapika'
import { opponentWantsOn } from './onTechnique'
import { EMPTY_INPUT, type ArcadeFighter, type FightInput, type FightState } from './types'

export function planOpponentNen(state: FightState): FightState {
  const gap = perceivedOpponentGap(state)
  const opponent = state.opponent
  if (opponent.melodyPerformance) return state
  if (judgmentForbidsNen(opponent) || chainsImmobilize(opponent))
    return applyOpponentAura(state, { aura: true, down: true })
  if (opponent.hanzoProjection || opponent.attack) return state
  const rest = tacticalRest(opponent, gap)
  if (rest) return applyOpponentAura(state, rest)
  if (opponentWantsOn(opponent)) return applyOpponentAura(state, { aura: true, hatsu: true })
  if (needsKen(state, gap)) return applyOpponentAura(state, { aura: true, guard: true })
  return advancedOpponentNen(state) ?? restingOpponentNen(state, gap)
}

function applyOpponentAura(
  state: FightState,
  partial: Partial<Pick<FightInput, 'aura' | 'down' | 'guard' | 'jump' | 'hatsu'>>,
): FightState {
  const input = { ...EMPTY_INPUT, ...partial }
  return { ...state, opponent: applyAuraContext(state.opponent, input) }
}

function tacticalRest(fighter: ArcadeFighter, gap: number): Partial<FightInput> | null {
  if (needsZetsu(fighter, gap)) return { aura: true, down: true }
  return canLeaveZetsu(fighter, gap) ? {} : null
}
const needsZetsu = (fighter: ArcadeFighter, gap: number) =>
  (fighter.aura < 16 || fighter.nenTactics?.goal === 'recover') &&
  fighter.nen.mode !== 'zetsu' && gap > 24
const canLeaveZetsu = (fighter: ArcadeFighter, gap: number) =>
  fighter.nen.mode === 'zetsu' &&
  (fighter.aura >= (fighter.nenTactics?.reserve || 49) || (gap <= 24 && fighter.aura >= 16))
const needsKen = (state: FightState, gap: number) =>
  seesCombatBody(state.opponent) &&
  !state.player.attack?.concealed &&
  gap < 18 &&
  state.opponent.aura > 28 &&
  !state.opponent.nen.ken &&
  ['heavy', 'special'].includes(state.player.pose)
const wantsRen = (fighter: ArcadeFighter, gap: number) =>
  gap < 12 && fighter.aura > 55 && fighter.nen.mode === 'ten'

function restingOpponentNen(state: FightState, gap: number): FightState {
  if (state.opponent.nen.mode === 'zetsu') return state
  return wantsRen(state.opponent, gap)
    ? applyOpponentAura(state, { aura: true })
    : applyOpponentAura(state, {})
}

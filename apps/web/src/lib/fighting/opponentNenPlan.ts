import { advancedOpponentNen } from './nenAi'
import { applyAuraContext } from './nen'
import { chainsImmobilize } from './kurapika'
import { opponentWantsOn } from './onTechnique'
import { EMPTY_INPUT, type ArcadeFighter, type FightInput, type FightState } from './types'

export function planOpponentNen(state: FightState): FightState {
  const gap = Math.abs(state.player.x - state.opponent.x)
  const opponent = state.opponent
  if (opponent.judgmentChain || chainsImmobilize(opponent))
    return applyOpponentAura(state, { aura: true, down: true })
  if (opponent.hanzoProjection) return state
  if (needsZetsu(opponent)) return applyOpponentAura(state, { aura: true, down: true })
  if (canLeaveZetsu(opponent)) return applyOpponentAura(state, {})
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

const needsZetsu = (fighter: ArcadeFighter) => fighter.aura < 16 && fighter.nen.mode !== 'zetsu'
const canLeaveZetsu = (fighter: ArcadeFighter) => fighter.nen.mode === 'zetsu' && fighter.aura > 48
const needsKen = (state: FightState, gap: number) =>
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

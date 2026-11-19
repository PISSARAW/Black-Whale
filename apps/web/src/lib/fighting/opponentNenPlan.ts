import { judgmentForbidsNen } from './judgmentRules'
import { perceivedOpponentGap } from './opponentAwareness'
import { seesCombatBody } from './fightCounterplay'
import { advancedOpponentNen } from './nenAi'
import { aiFocusedDefence, perceivesAttack } from './nenCombat/aiReads'
import { applyAuraContext } from './nen'
import { chainsImmobilize } from './kurapika'
import { opponentWantsOn } from './onTechnique'
import { EMPTY_INPUT, type ArcadeFighter, type FightInput, type FightState } from './types'
import { nenApprehensionRatio, readAuraPsychology } from './nenPsychology'
import { nenPsychologyProfile } from './nenPsychologyProfiles'

export function planOpponentNen(state: FightState): FightState {
  const locked = lockedOpponentNen(state)
  if (locked) return locked
  const gap = perceivedOpponentGap(state)
  const opponent = state.opponent
  const rest = zetsuRest(opponent, gap)
  if (rest) return applyOpponentAura(state, rest)
  if (opponentWantsOn(opponent)) return applyOpponentAura(state, { aura: true, hatsu: true })
  const observed = psychologyObservationInput(state, gap)
  if (observed) return applyOpponentAura(state, observed)
  const focused = aiFocusedDefence(state, gap)
  if (focused) return applyOpponentAura(state, focused)
  if (psychologyNeedsKen(state, gap)) return applyOpponentAura(state, { aura: true, guard: true })
  if (needsKen(state, gap)) return applyOpponentAura(state, { aura: true, guard: true })
  return advancedOpponentNen(state) ?? restingOpponentNen(state, gap)
}

/** States where the opponent cannot choose its Nen: performing, sealed, or committed. */
function lockedOpponentNen(state: FightState): FightState | null {
  const opponent = state.opponent
  if (opponent.melodyPerformance) return state
  if (judgmentForbidsNen(opponent) || chainsImmobilize(opponent))
    return applyOpponentAura(state, { aura: true, down: true })
  if (opponent.hanzoProjection || opponent.attack) return state
  return null
}

function applyOpponentAura(state: FightState, partial: Partial<FightInput>): FightState {
  const input = { ...EMPTY_INPUT, ...partial }
  return { ...state, opponent: applyAuraContext(state.opponent, input) }
}

function zetsuRest(fighter: ArcadeFighter, gap: number): Partial<FightInput> | null {
  if (needsZetsu(fighter, gap)) return { aura: true, down: true }
  return canLeaveZetsu(fighter, gap) ? {} : null
}

/** Zetsu doubles as a wound multiplier: the AI only rests in it out of striking range. */
const ZETSU_SAFE_GAP = 24
const needsZetsu = (fighter: ArcadeFighter, gap: number) =>
  (fighter.aura < 16 || fighter.nenTactics?.goal === 'recover') &&
  fighter.nen.mode !== 'zetsu' &&
  gap > ZETSU_SAFE_GAP
const canLeaveZetsu = (fighter: ArcadeFighter, gap: number) =>
  fighter.nen.mode === 'zetsu' &&
  (fighter.aura >= (fighter.nenTactics?.reserve || 49) ||
    (gap <= ZETSU_SAFE_GAP && fighter.aura >= 16))
const needsKen = (state: FightState, gap: number) =>
  seesCombatBody(state.opponent) &&
  (!state.player.attack || perceivesAttack(state.opponent, state.player)) &&
  gap < 18 &&
  state.opponent.aura > 28 &&
  !state.opponent.nen.ken &&
  ['heavy', 'special'].includes(state.player.pose)
const psychologyNeedsKen = (state: FightState, gap: number) => {
  const reading = readAuraPsychology(state, 'player', 'opponent')
  const profile = nenPsychologyProfile(state.opponent.id)
  return (
    seesCombatBody(state.opponent) &&
    gap < 24 &&
    state.opponent.aura > 28 &&
    !state.opponent.nen.ken &&
    ((reading?.pressure === 'overwhelming' && profile.auraResponse !== 'press') ||
      nenApprehensionRatio(state.opponent) >= profile.guardAtApprehension)
  )
}
export const psychologyObservationInput = (
  state: FightState,
  gap: number,
): Partial<FightInput> | null => {
  const profile = nenPsychologyProfile(state.opponent.id)
  if (profile.auraResponse !== 'observe' || state.opponent.nen.gyo || gap >= 28) return null
  const reading = readAuraPsychology(state, 'player', 'opponent')
  return reading?.pressure === 'high' || reading?.pressure === 'overwhelming' ? { gyo: true } : null
}
const wantsRen = (fighter: ArcadeFighter, gap: number) =>
  gap < 12 && fighter.aura > 55 && fighter.nen.mode === 'ten'

function restingOpponentNen(state: FightState, gap: number): FightState {
  if (state.opponent.nen.mode === 'zetsu') return state
  return wantsRen(state.opponent, gap)
    ? applyOpponentAura(state, { aura: true })
    : applyOpponentAura(state, {})
}

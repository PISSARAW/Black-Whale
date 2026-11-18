import { judgmentForbidsContact } from './judgmentCommunication'
import { perceivedOpponentGap } from './opponentAwareness'
import { canAct } from './fightActorState'
import { canUseRangedAttack } from './projectiles'
import { speakBattleWords } from './battleConversation'
import { battleAppearance } from './battleCantabileRules'
import { BATTLE_CONVERSATION_RANGE } from './battleCantabileTypes'
import { voluntaryNenAvailable } from './nenAccess'
import { canSpeak, senseDeprived } from './saiyuSenses'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightState, FighterId } from './types'

/** Only carried weapons or already implemented Nen applications, never generic stone throws. */
const RANGED_ARSENALS: readonly FighterId[] = [
  'hisoka',
  'benjamin',
  'feitan',
  'theta',
  'franklin',
  'illumi',
  'camilla',
  'musse',
  'tserriednich',
  'halkenburg',
]

export function nativeArsenalAiAction(
  state: FightState,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  const fighter = state.opponent
  if (!canAct(fighter) || fighter.attack || fighter.coveringEars) return null
  const gap = perceivedOpponentGap(state)
  if (!Number.isFinite(gap)) return null
  if (shouldSpeakToModel(state, gap)) return speakBattleWords(state, 'opponent')
  if (!RANGED_ARSENALS.includes(fighter.id) || gap < 15 || !canUseRangedAttack(fighter)) return null
  // Alternate a ranged action with the character's setup/utility decisions.
  if ((state.frame + state.rng) % 3 !== 0) return null
  return perform({ state, side: 'opponent', kind: 'ranged', auraCharged: false })
}

function shouldSpeakToModel(state: FightState, gap: number): boolean {
  const fighter = state.opponent
  if (fighter.id !== 'bonolenov' || gap > BATTLE_CONVERSATION_RANGE) return false
  if (judgmentForbidsContact(fighter, state.player.id) || !canDiscussModel(state)) return false
  // The player must actually have spoken. AI speech does not invent their reply.
  return (
    state.player.battleUtteranceFrame !== undefined && fighter.battleUtteranceFrame === undefined
  )
}

function canDiscussModel(state: FightState): boolean {
  const fighter = state.opponent
  const battle = fighter.battleCantabile
  if (!voluntaryNenAvailable(fighter) || !canSpeak(fighter) || senseDeprived(fighter, 'hearing'))
    return false
  if (battle?.preparation || battle?.form) return false
  return !battle?.models[battleAppearance(state.player)]?.spoken
}

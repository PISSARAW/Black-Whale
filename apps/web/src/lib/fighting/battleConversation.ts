import { judgmentForbidsContact } from './judgmentCommunication'
import { recordVocalExchange } from './halkenburgBonolenovUpgrades'
import { speakPaperWords, voiceAvailable } from './kallutoListening'
import { canSpeak, senseDeprived } from './saiyuSenses'
import { resolveHanzoBodyCalls } from './hanzoBodyCall'
import { battleAppearance, battleMindAvailable } from './battleCantabileRules'
import { BATTLE_CONVERSATION_RANGE, emptyBattleCantabile } from './battleCantabileTypes'
import type { ArcadeFighter, FightInput, FightSide, FightState } from './types'

function canExchange(fighter: ArcadeFighter): boolean {
  return (
    canSpeak(fighter) &&
    !senseDeprived(fighter, 'hearing') &&
    !fighter.coveringEars &&
    battleMindAvailable(fighter) &&
    !fighter.attack &&
    !fighter.battleCantabile?.preparation
  )
}

function nearModel(state: FightState): boolean {
  return (
    Math.hypot(state.player.x - state.opponent.x, state.player.y - state.opponent.y) <=
    BATTLE_CONVERSATION_RANGE
  )
}

/** Each local player supplies their own words. An available AI may reply to the player. */
export function speakBattleWords(state: FightState, side: FightSide, text?: string): FightState {
  if (!voiceAvailable(state, side)) return state
  state = speakPaperWords(state, side, text)
  if (state.phase !== 'fighting' || state.catsName || !nearModel(state)) return state
  if (![state.player.id, state.opponent.id].includes('bonolenov') || !canExchange(state[side]))
    return state
  const other = side === 'player' ? 'opponent' : 'player'
  const reply = autoReplyAvailable(state, side)
  if (reply) state = speakPaperWords(state, 'opponent', 'Je t’écoute.')
  const speakerBody =
    state[side].id === 'bonolenov' ? recordVocalExchange(state[side]) : state[side]
  const otherBody =
    state[other].id === 'bonolenov' ? recordVocalExchange(state[other]) : state[other]
  return {
    ...state,
    [side]: { ...speakerBody, battleUtteranceFrame: state.frame },
    [other]: reply ? { ...otherBody, battleUtteranceFrame: state.frame } : otherBody,
  }
}

function autoReplyAvailable(state: FightState, side: FightSide): boolean {
  return (
    state.mode === 'versus-ai' &&
    side === 'player' &&
    canExchange(state.opponent) &&
    voiceAvailable(state, 'opponent') &&
    !judgmentForbidsContact(state.opponent, state.player.id)
  )
}

/** Co-presence is measured in this duel only; no historical relationship is fabricated. */
export function observeBattleModels(state: FightState): FightState {
  if (!nearModel(state)) return state
  const exchanged = [state.player, state.opponent].every(
    (fighter) =>
      canExchange(fighter) &&
      fighter.battleUtteranceFrame !== undefined &&
      state.frame - fighter.battleUtteranceFrame <= 60,
  )
  return (['player', 'opponent'] as const).reduce((next, side) => {
    const fighter = next[side]
    if (fighter.id !== 'bonolenov') return next
    const other = next[side === 'player' ? 'opponent' : 'player']
    const model = battleAppearance(other)
    const battle = fighter.battleCantabile ?? emptyBattleCantabile()
    const known = battle.models[model]
    return {
      ...next,
      [side]: {
        ...fighter,
        battleCantabile: {
          ...battle,
          models: {
            ...battle.models,
            [model]: {
              frames: (known?.frames ?? 0) + 1,
              spoken: Boolean(known?.spoken || exchanged),
            },
          },
        },
      },
    }
  }, state)
}

export function resolveFighterSpeech(
  state: FightState,
  input: FightInput,
  opponentInput?: FightInput,
): FightState {
  let next = resolveHanzoBodyCalls(state, input, opponentInput)
  if (input.call) next = speakBattleWords(next, 'player')
  if (opponentInput?.call) next = speakBattleWords(next, 'opponent')
  return observeBattleModels(next)
}

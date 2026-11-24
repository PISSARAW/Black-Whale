import { bonolenovHasSpear } from './bonolenovArmedProfile'
import { selectedBattleModel } from './metamorphosenModels'
import { triggerHatsu } from './hatsu'
import { freeCombatBody } from './fightActorState'
import {
  BATTLE_COST,
  BATTLE_DANCE_FRAMES,
  BATTLE_MOVES,
  emptyBattleCantabile,
  type BattlePiece,
} from './battleCantabileTypes'
import {
  battleCommand,
  battleMindAvailable,
  battlePreparing,
  battleTechniqueAvailable,
  stopBattleMusic,
} from './battleCantabileRules'
import type { AuraAttackOptions } from './auraAttackAction'
import type { ArcadeFighter, FightSide, FightState } from './types'

const PIECES: Readonly<Record<string, BattlePiece>> = {
  [BATTLE_MOVES.prologue]: 'prologue',
  [BATTLE_MOVES.jupiter]: 'jupiter',
  [BATTLE_MOVES.metamorphosen]: 'metamorphosen',
}

export function battleCanStart(state: FightState, side: FightSide, moveId: string): boolean {
  const fighter = state[side]
  if (moveId === BATTLE_MOVES.stop) return Boolean(fighter.battleCantabile)
  if (!battleTechniqueAvailable(fighter, moveId) || !danceBodyReady(fighter)) return false
  if (moveId === BATTLE_MOVES.spear) return bonolenovHasSpear(fighter) && fighter.aura >= 12
  const piece = PIECES[moveId]
  if (!piece || fighter.aura < BATTLE_COST[piece]) return false
  return pieceConditions(state, side, piece)
}

function danceBodyReady(fighter: ArcadeFighter): boolean {
  return (
    freeCombatBody(fighter) &&
    battleMindAvailable(fighter) &&
    !fighter.attack &&
    !battlePreparing(fighter) &&
    fighter.y === 0 &&
    !fighter.blocking
  )
}

function pieceConditions(state: FightState, side: FightSide, piece: BattlePiece): boolean {
  const fighter = state[side]
  if (state.projectiles.some((shot) => shot.owner === side && shot.jupiter)) return false
  if (piece === 'prologue') return !fighter.battleCantabile?.prologue
  if (piece === 'jupiter') return true
  return learnedModelReady(state, side)
}

function learnedModelReady(state: FightState, side: FightSide): boolean {
  const fighter = state[side]
  const model = selectedBattleModel(state, side)
  const known = fighter.battleCantabile?.models[model]
  return Boolean(
    known?.spoken && known.frames > 0 && fighter.battleCantabile?.form?.model !== model,
  )
}

/** Only the spear thrust uses the shared strike path; each piece starts with a real dance. */
export function performBattleCantabileAction(options: AuraAttackOptions): FightState | null {
  const { state, side, kind, moveId } = options
  const fighter = state[side]
  const command = battleCommand(fighter, kind, moveId)
  if (!command) return battlePreparing(fighter) ? state : null
  if (command === BATTLE_MOVES.stop) return stopBattleCantabile(state, side)
  if (!battleCanStart(state, side, command)) return state
  if (command === BATTLE_MOVES.spear) return null
  return beginBattlePiece({ state, side, piece: PIECES[command] })
}

function beginBattlePiece(options: {
  state: FightState
  side: FightSide
  piece: BattlePiece
}): FightState {
  const { state, side, piece } = options
  const fighter = state[side]
  const battle = fighter.battleCantabile ?? emptyBattleCantabile()
  const model = selectedBattleModel(state, side)
  const total = BATTLE_DANCE_FRAMES[piece]
  const witnessed = triggerHatsu(state, side, 'bonolenov')
  return {
    ...witnessed,
    [side]: {
      ...witnessed[side],
      aura: fighter.aura - BATTLE_COST[piece],
      blocking: false,
      guardFrames: 0,
      motion: undefined,
      bufferedAttack: null,
      hatsuChargeFrames: 0,
      pose: 'special',
      battleCantabile: {
        ...battle,
        prologue: false,
        form: null,
        preparation: {
          piece,
          remaining: total,
          total,
          ...(piece === 'metamorphosen' ? { model, duration: battle.models[model]!.frames } : {}),
        },
      },
    },
  }
}

export function stopBattleCantabile(state: FightState, side: FightSide): FightState {
  if (!state[side].battleCantabile) return state
  return {
    ...state,
    [side]: stopBattleMusic(state[side]),
    projectiles: state.projectiles.filter((shot) => !(shot.owner === side && shot.jupiter)),
  }
}

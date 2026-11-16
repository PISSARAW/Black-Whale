import { chrolloPageForMove, CHROLLO_SECONDARY, CHROLLO_USE } from './chrolloBook'
import { resolveCrossGameCommand } from './crossGameAction'
import { resolveMoonlightAction } from './moonlightAction'
import {
  maryAuthority,
  maryCommandReady,
  maryState,
  MARY_BIND_COST,
  MARY_INFUSION_FRAMES,
  MARY_SCOUT_LIFE,
  type MaryCommand,
} from './bloodyMary'
import { slamMary } from './bloodyMarySlam'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightSide, FightState } from './types'

const COMMANDS: Record<string, MaryCommand> = {
  'zakuro:neutralSpecial': 'bind',
  'zakuro:forwardSpecial': 'slam',
  'zakuro:downSpecial': 'scout',
  'zakuro:backSpecial': 'recall',
}

export function performMaryAction(options: AuraAttackOptions): FightState | null {
  const { state, side, kind, moveId } = options
  const fighter = state[side]
  if (kind !== 'special') return null
  if (fighter.id !== 'zakuro' && chrolloPageForMove(fighter, moveId) !== 'zakuro') return null
  if (fighter.id === 'zakuro' && moveId && !COMMANDS[moveId]) return state
  if (!maryAuthority(fighter, moveId)) return state
  const command = selectedMaryCommand(fighter, moveId)
  return executeMary({ state, side, command, moveId })
}

function executeMary(options: {
  state: FightState
  side: FightSide
  command: MaryCommand
  moveId?: string
}): FightState {
  const { state, side, command, moveId } = options
  if (!maryCommandReady(state, side, command)) return state
  if (command === 'slam') return slamMary(state, side)
  if (command === 'recall') return recallMary(state, side)
  const fighter = state[side]
  const blood = { ...maryState(fighter), command: undefined, sourceMoveId: moveId }
  const target = state[side === 'player' ? 'opponent' : 'player']
  const spent = command === 'bind' ? MARY_BIND_COST : 8
  const active =
    command === 'bind'
      ? {
          ...blood,
          available: blood.available - 3,
          tendril: {
            phase: 'flying' as const,
            x: fighter.x,
            y: fighter.y + 5,
            originX: fighter.x,
            aimX: target.x,
            aimY: target.y + 5,
            age: 0,
            units: 3,
          },
        }
      : {
          ...blood,
          available: blood.available - 3,
          drops: [0, 1, 2].map((id) => ({
            id,
            x: fighter.x + id,
            y: 1,
            direction: (id === 1 ? -1 : 1) as -1 | 1,
            remainingFrames: MARY_SCOUT_LIFE,
            reformFrames: 0,
          })),
        }
  const other = side === 'player' ? 'opponent' : 'player'
  return {
    ...state,
    [side]: {
      ...fighter,
      aura: fighter.aura - spent,
      bloodyMary: active,
      bufferedAttack: null,
      blocking: false,
    },
    [other]: { ...target, hatsuEffects: { ...target.hatsuEffects, witnessedHatsu: 'zakuro' } },
  }
}

export function recallMary(state: FightState, side: FightSide): FightState {
  const blood = maryState(state[side])
  const other = side === 'player' ? 'opponent' : 'player'
  const target = state[other]
  return {
    ...state,
    [side]: {
      ...state[side],
      bloodyMary: {
        ...blood,
        command: undefined,
        returning: true,
        tendril: blood.tendril ? { ...blood.tendril, phase: 'returning' } : undefined,
      },
    },
    [other]:
      target.maryCapture?.owner === side
        ? { ...target, maryCapture: undefined, maryGraceFrames: 60 }
        : target,
  }
}

/** Material preparation does not consume a borrowed Hatsu and cannot conjure a blood kit. */
export function commandMary(
  options: { state: FightState; side: FightSide; command: MaryCommand },
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  const { state, side, command } = options
  if (!maryCommandReady(state, side, command)) return state
  if (command === 'bleed' || command === 'infuse') {
    const next = prepareMary(options)
    return resolveMoonlightAction(state, resolveCrossGameCommand(state, next, side), side)
  }
  const fighter = state[side]
  const draft = { ...state, [side]: { ...fighter, bloodyMary: { ...maryState(fighter), command } } }
  const next = perform({
    state: draft,
    side,
    kind: 'special',
    moveId: maryInputMove(state, side, command),
    auraCharged: false,
  })
  return next === draft ? state : next
}

function prepareMary(options: {
  state: FightState
  side: FightSide
  command: MaryCommand
}): FightState {
  const { state, side, command } = options
  const fighter = state[side]
  const blood = maryState(fighter)
  if (command === 'bleed')
    return {
      ...state,
      [side]: {
        ...fighter,
        health: fighter.health - 2,
        aura: fighter.aura - 1,
        openWounds: (fighter.openWounds ?? 0) + 1,
        bloodyMary: blood,
      },
    }
  return {
    ...state,
    [side]: {
      ...fighter,
      aura: Math.max(0, fighter.aura - 1),
      bloodyMary: {
        ...blood,
        infusion: {
          remainingFrames: MARY_INFUSION_FRAMES,
          originX: fighter.x,
          health: fighter.health,
        },
      },
    },
  }
}

function maryInputMove(state: FightState, side: FightSide, command: MaryCommand): string {
  const fighter = state[side]
  if (fighter.id === 'chrollo')
    return chrolloPageForMove(fighter) === 'zakuro' ? CHROLLO_USE : CHROLLO_SECONDARY
  if (fighter.id === 'kurapika') return 'kurapika:backSpecial'
  return Object.keys(COMMANDS).find((key) => COMMANDS[key] === command) ?? 'zakuro:neutralSpecial'
}

function selectedMaryCommand(fighter: FightState['player'], moveId?: string): MaryCommand {
  return maryState(fighter).command ?? COMMANDS[moveId ?? 'zakuro:neutralSpecial'] ?? 'bind'
}

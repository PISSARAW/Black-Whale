import { witnessedHatsu } from './nenWitness'
import { chrolloPageForMove } from './chrolloBook'
import { writingBodyAvailable } from './bashoPoem'
import { canAct } from './fightActorState'
import {
  BIOHAZARD_COST,
  BIOHAZARD_GRACE,
  BIOHAZARD_LIFETIME,
  BIOHAZARD_MOVE,
  biohazardAuthority,
  biohazardBodyFree,
  biohazardCanLaunch,
  biohazardNen,
  biohazardRecallMove,
} from './biohazard'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightState } from './types'

/** Touch and transform one owned object. No generic special hit or cancel is started. */
export function performBiohazardAction(options: AuraAttackOptions): FightState | null {
  const { state, side, moveId } = options
  const fighter = state[side]
  if (!handlesBiohazardCommand(options)) return null
  if (!canCommand(options)) return state
  if (biohazardRecallMove(moveId)) return recallBiohazard(options)
  if (!canLaunch(options)) return state
  const selected = fighter.biohazard!.objects.find((o) => o.phase === 'carried')!
  const target = side === 'player' ? 'opponent' : 'player'
  return {
    ...state,
    [side]: {
      ...fighter,
      aura: fighter.aura - BIOHAZARD_COST,
      attack: null,
      bufferedAttack: null,
      hatsuChargeFrames: 0,
      motion: undefined,
      pose: 'special',
      biohazard: {
        objects: fighter.biohazard!.objects.map((object) =>
          object.id !== selected.id
            ? object
            : {
                ...object,
                phase: 'transforming',
                x: fighter.x,
                y: fighter.y + 6,
                direction: fighter.facing,
                frames: 0,
                life: BIOHAZARD_LIFETIME,
              },
        ),
      },
    },
    [target]: {
      ...state[target],
      hatsuEffects: {
        ...state[target].hatsuEffects,
        witnessedHatsu: witnessedHatsu(state, { side, source: 'hinrigh' }),
      },
    },
  }
}

function recallBiohazard(options: AuraAttackOptions): FightState {
  const { state, side } = options
  const fighter = state[side]
  if (!biohazardNen(fighter) || !fighter.biohazard) return state
  const other = side === 'player' ? 'opponent' : 'player'
  const canUnlock = Math.abs(fighter.x - state[other].x) <= 4
  const restrained = canUnlock && state[other].biohazardRestraint?.owner === side
  const objects = fighter.biohazard.objects.map((object) => {
    if (object.phase === 'bound' && restrained) return { ...object, phase: 'carried' as const }
    if (object.phase !== 'flying') return object
    return { ...object, phase: 'returning' as const }
  })
  return {
    ...state,
    [side]: { ...fighter, biohazard: { objects } },
    [other]: restrained
      ? { ...state[other], biohazardRestraint: undefined, biohazardGraceFrames: BIOHAZARD_GRACE }
      : state[other],
  }
}

function handlesBiohazardCommand(options: AuraAttackOptions): boolean {
  return (
    options.kind === 'special' &&
    (options.state[options.side].id === 'hinrigh' ||
      chrolloPageForMove(options.state[options.side], options.moveId) === 'hinrigh')
  )
}

function canCommand(options: AuraAttackOptions): boolean {
  const { state, side, moveId } = options
  const fighter = state[side]
  return (
    state.phase === 'fighting' &&
    !state.catsName &&
    biohazardBodyFree(fighter) &&
    canAct(fighter) &&
    writingBodyAvailable(fighter) &&
    biohazardAuthority(fighter, moveId)
  )
}

function canLaunch(options: AuraAttackOptions): boolean {
  const fighter = options.state[options.side]
  if (fighter.id === 'hinrigh' && options.moveId && options.moveId !== BIOHAZARD_MOVE) return false
  return biohazardCanLaunch(fighter)
}

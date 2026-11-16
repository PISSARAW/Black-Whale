import { feitanMoveAvailable } from './feitanPain'
import { canBufferFighterAttack, canStartFighterAttack, startFighterAttack } from './fighterAttacks'
import { triggerHatsu } from './hatsu'
import type { AttackKind, AttackVariant, FightSide, FightState, FighterId } from './types'

export interface AuraAttackOptions {
  state: FightState
  side: FightSide
  kind: AttackKind
  auraCharged: boolean
  variant?: AttackVariant
  moveId?: string
}

interface AttackIntent {
  hatsuSource: FighterId | null
  concealed: boolean
  resourceReady: boolean
}

/** Start now or buffer once; effects and aura are committed only on the actual start. */
export function commitAuraAttack(options: AuraAttackOptions, intent: AttackIntent): FightState {
  const { side, kind, auraCharged, variant, moveId } = options
  const original = options.state[side]
  if (!techniqueAllowed(options)) return options.state
  const { hatsuSource, concealed, resourceReady } = intent
  const starts = canStartFighterAttack(original, kind, moveId)
  const buffers = resourceReady && canBufferFighterAttack(original)
  if (!starts && !buffers) return options.state
  const state =
    starts && hatsuSource ? triggerHatsu(options.state, side, hatsuSource) : options.state
  const fighter = state[side]
  if (starts)
    return {
      ...state,
      [side]: startFighterAttack({
        fighter,
        kind,
        variant,
        moveId,
        auraCharged,
        concealed,
        hatsuSource,
      }),
    }
  return {
    ...state,
    [side]: {
      ...fighter,
      bufferedAttack: { kind, variant, moveId, auraCharged, concealed, hatsuSource },
    },
  }
}

function techniqueAllowed(options: AuraAttackOptions): boolean {
  const { state, side, kind, moveId } = options
  return kind !== 'special' || feitanMoveAvailable(state[side], moveId)
}

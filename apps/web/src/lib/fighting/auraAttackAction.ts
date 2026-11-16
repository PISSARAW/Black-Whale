import { paperMoveAllowed } from './kallutoPaper'
import { blinkyActionAllowed } from './blinkyAction'
import { beyondCurseUnavailable } from './beyondCurseAction'
import { isErigeronAction } from './billSupport'
import { canBufferFighterAttack, canStartFighterAttack, startFighterAttack } from './fighterAttacks'
import { triggerAttackHatsu } from './attackHatsuTrigger'
import { padailleMoveAvailable } from './padailleWeapon'
import { feitanMoveAvailable } from './feitanPain'
import { hisokaTechniqueAllowed } from './hisokaTechnique'
import { observeComboMaster } from './comboMaster'
import type { AttackKind, AttackVariant, FightSide, FightState, FighterId } from './types'

export interface AuraAttackOptions {
  state: FightState
  side: FightSide
  kind: AttackKind
  auraCharged: boolean
  lynchQuestion?: import('./lynchTypes').LynchQuestionId
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
  if (!canAttemptTechnique(options)) return options.state
  const { hatsuSource, concealed, resourceReady } = intent
  const starts = canStartFighterAttack(original, kind, moveId)
  const buffers = resourceReady && canBufferFighterAttack(original)
  if (!starts && !buffers) return options.state
  const state =
    starts && hatsuSource
      ? triggerAttackHatsu({ state: options.state, side, source: hatsuSource, moveId })
      : options.state
  const fighter = state[side]
  if (starts)
    return observeComboMaster({
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
    })
  return {
    ...state,
    [side]: {
      ...fighter,
      bufferedAttack: { kind, variant, moveId, auraCharged, concealed, hatsuSource },
    },
  }
}

function canAttemptTechnique(options: AuraAttackOptions): boolean {
  const { state, side, kind, moveId } = options
  if (state[side].id === 'camilla' && kind === 'special') return false
  if (isErigeronAction(state[side], kind, moveId)) return false
  return techniqueAllowed(options)
}

function techniqueAllowed(options: AuraAttackOptions): boolean {
  const { state, side, kind, moveId } = options
  if (beyondCurseUnavailable({ fighter: state[side], kind, moveId })) return false
  if (!blinkyActionAllowed(options)) return false
  if (moveId === 'gel:finisher') return false
  if (kind !== 'special') return true
  if (!padailleMoveAvailable(state[side], moveId)) return false
  if (!paperMoveAllowed(state, side, moveId)) return false
  if (isErigeronAction(state[side], kind, moveId)) return false
  return hisokaTechniqueAllowed(state, side, moveId) && feitanMoveAvailable(state[side], moveId)
}

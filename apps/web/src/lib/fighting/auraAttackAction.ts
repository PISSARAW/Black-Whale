import { blackVoiceMoveAllowed } from './blackVoice'
import { INPUT_BUFFER_FRAMES } from './fightClock'
import { cancelBufferSource } from './bufferedCancel'
import { attackAuraCost } from './fightAttackCost'
import { canUseMovesetMove, moveById } from './movesets'
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
  if (!attackAdmission(options, intent)) return options.state
  const { hatsuSource, concealed, resourceReady } = intent
  const starts = canStartFighterAttack(original, kind, moveId)
  const cancelFrom = cancelBufferSource(original, moveId)
  const buffers = resourceReady && (canBufferFighterAttack(original) || Boolean(cancelFrom))
  if (!starts && !buffers) return options.state
  const state =
    starts && hatsuSource
      ? triggerAttackHatsu({ state: options.state, side, source: hatsuSource, moveId, concealed })
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
        auraCost: attackAuraCost({ fighter: original, kind, moveId, concealed }),
      }),
    })
  return {
    ...state,
    [side]: {
      ...fighter,
      bufferedAttack: {
        kind,
        variant,
        moveId,
        auraCharged,
        concealed,
        hatsuSource,
        cancelFrom,
        // Contact is resolved after buffer advancement; retain the intent for that flush.
        bufferFrames: INPUT_BUFFER_FRAMES + Number(Boolean(cancelFrom)),
      },
    },
  }
}

function attackAdmission(options: AuraAttackOptions, intent: AttackIntent): boolean {
  const { state, side, kind, moveId } = options
  const fighter = state[side]
  if (fighter.id === 'camilla' && kind === 'special') return false
  if (!techniqueAllowed(options)) return false
  const move = moveById(moveId)
  if (move && !canUseMovesetMove(state, side, move)) return false
  return fighter.aura >= attackAuraCost({ fighter, kind, moveId, concealed: intent.concealed })
}

function techniqueAllowed(options: AuraAttackOptions): boolean {
  const { state, side, kind, moveId } = options
  if (beyondCurseUnavailable({ fighter: state[side], kind, moveId })) return false
  if (!blinkyActionAllowed(options)) return false
  if (moveId === 'gel:finisher') return false
  if (kind !== 'special') return true
  if (!blackVoiceMoveAllowed(state, side, moveId)) return false
  if (!padailleMoveAvailable(state[side], moveId)) return false
  if (!paperMoveAllowed(state, side, moveId)) return false
  if (isErigeronAction(state[side], kind, moveId)) return false
  return hisokaTechniqueAllowed(state, side, moveId) && feitanMoveAvailable(state[side], moveId)
}

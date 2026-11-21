import { BISCUIT_FORM_MOVE, isBiscuitFormMove } from './biscuitForm'
import { canStartFighterAttack } from './fighterAttacks'
import type { ArcadeFighter, AttackKind, FightSide, FightState } from './types'

/** Revealing her body neither hits the opponent nor spends aura on Cookie. */
export function performBiscuitFormAction(options: {
  state: FightState
  side: FightSide
  kind: AttackKind
  moveId?: string
}): FightState | null {
  const { state, side, kind, moveId } = options
  const fighter = state[side]
  if (kind !== 'special' || !isBiscuitFormMove(fighter, moveId)) return null
  if (fighter.y > 0) return state
  // Retour à la vraie forme (signatureCombosBiscuitPhinks.ts): revealed during a combo capture.
  if (fighter.attack)
    return comboCapture(fighter) && !fighter.biscuitTrueForm ? reveal(state, side) : state
  if (!canStartFighterAttack(fighter, 'special', BISCUIT_FORM_MOVE)) return state
  return reveal(state, side)
}

const reveal = (state: FightState, side: FightSide): FightState => ({
  ...state,
  [side]: { ...state[side], biscuitTrueForm: true },
})

/** A throw that ends an accélération holds its target (throwRules.ts). */
const comboCapture = (fighter: ArcadeFighter) =>
  fighter.attack?.variant === 'throw' &&
  Boolean(fighter.attack.accel) &&
  fighter.attack.confirmedHit

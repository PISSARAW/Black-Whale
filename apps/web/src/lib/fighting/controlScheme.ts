import { cancelGrammarFor } from './duelComboProfiles'
import { numpadDirection, quarterCircleForward } from './motionInput'
import type {
  ArcadeFighter,
  FightInput,
  FightSide,
  FightState,
  MoveAction,
  MoveSlot,
} from './types'

/**
 * Classic: the grammar's super needs a 236 motion (full damage). Simplified: the authored
 * direction + special command, with SIMPLIFIED_SUPER_DAMAGE. Touch play is always simplified.
 */
export type ControlScheme = 'classic' | 'simplified'
export const DEFAULT_CONTROL_SCHEME: ControlScheme = 'simplified'
/** −10 %: at −20 % a 40-aura super no longer beat a free physical ender (Benjamin). */
export const SIMPLIFIED_SUPER_DAMAGE = 0.9

export const controlSchemeOf = (fighter: ArcadeFighter): ControlScheme =>
  fighter.controlScheme ?? DEFAULT_CONTROL_SCHEME

/** The super a classic 236 + special performs: the first one on the special button. */
function motionSuper(fighter: ArcadeFighter): MoveSlot | undefined {
  return cancelGrammarFor(fighter.id)?.supers.find((slot) => slot.endsWith('Special'))
}

/** The grammar super this classic special command performs, if its motion is complete. */
function classicSuper(fighter: ArcadeFighter, input: FightInput): MoveSlot | null {
  const superSlot = motionSuper(fighter)
  if (!superSlot) return null
  const press = numpadDirection(fighter.facing, input)
  return quarterCircleForward(fighter.motionLog ?? [], press) ? superSlot : null
}

function usesClassicGrammar(fighter: ArcadeFighter, action: MoveAction): boolean {
  return (
    action === 'special' &&
    controlSchemeOf(fighter) === 'classic' &&
    Boolean(cancelGrammarFor(fighter.id))
  )
}

/** Slot after the control scheme: a classic motion turns the special into the super. */
export function schemeSlot(options: {
  fighter: ArcadeFighter
  action: MoveAction
  input: FightInput
  slot: MoveSlot
}): MoveSlot {
  const { fighter, action, input, slot } = options
  if (!usesClassicGrammar(fighter, action)) return slot
  return classicSuper(fighter, input) ?? slot
}

/** Classic refuses the super's simplified command when the motion is missing. */
export function refusedByScheme(
  fighter: ArcadeFighter,
  input: FightInput,
  slot: MoveSlot | undefined,
): boolean {
  if (!slot || controlSchemeOf(fighter) !== 'classic') return false
  return slot === motionSuper(fighter) && classicSuper(fighter, input) === null
}

export type ControlSchemes = Partial<Record<FightSide, ControlScheme>>

/** Sets each side's scheme; an absent side keeps the default and adds no state. */
export function applyControlSchemes(state: FightState, controls?: ControlSchemes): FightState {
  if (!controls) return state
  const withScheme = (side: FightSide): ArcadeFighter =>
    controls[side] ? { ...state[side], controlScheme: controls[side] } : state[side]
  return { ...state, player: withScheme('player'), opponent: withScheme('opponent') }
}

/** A new round keeps the player's chosen scheme; the motion log starts empty. */
export function keepControlScheme(fighter: ArcadeFighter, previous: ArcadeFighter): ArcadeFighter {
  return previous.controlScheme ? { ...fighter, controlScheme: previous.controlScheme } : fighter
}

/** Damage factor of a super under the attacker's control scheme. */
export function schemeDamageFactor(fighter: ArcadeFighter, superMove: boolean): number {
  return superMove && controlSchemeOf(fighter) === 'simplified' ? SIMPLIFIED_SUPER_DAMAGE : 1
}

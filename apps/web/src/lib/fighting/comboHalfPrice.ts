import type { ArcadeFighter, FightSide, FightState } from './types'

/**
 * Les trois interdits (Saiyu) and Feu de suppression (Franklin), SIGNATURE_COMBOS.md: while
 * the target stays held in the combo, every technique after the first costs a third of its
 * aura. The first technique of a combo pays in full. Duel tuning, not canon.
 */
const HALF_PRICE_FIGHTERS: ReadonlySet<string> = new Set(['saiyu', 'franklin'])
/** Two techniques of one combo are never further apart than this. */
const COMBO_TECHNIQUE_GAP = 150

export interface ComboTechniques {
  count: number
  /** The target's combo when the last technique started, to tell one combo from the next. */
  hits: number
  damage: number
  frame: number
}

const target = (state: FightState, side: FightSide) =>
  state[side === 'player' ? 'opponent' : 'player']

/** Techniques already started in the combo the target is still held in. */
function techniquesInCombo(state: FightState, side: FightSide): number {
  const record = state[side].comboTechniques
  const held = target(state, side)
  if (!record || held.comboHits === 0 || !(held.hitStun > 0 || held.knockdownFrames > 0)) return 0
  const sameCombo =
    held.comboHits >= record.hits &&
    held.comboDamage >= record.damage &&
    state.frame - record.frame <= COMBO_TECHNIQUE_GAP
  return sameCombo ? record.count : 0
}

/** A third of the full cost after the first technique; undefined when the rule does not apply. */
export function halfPriceCost(
  state: FightState,
  side: FightSide,
  move: { auraCost: number } | null | undefined,
): number | undefined {
  if (!move || move.auraCost <= 0 || !HALF_PRICE_FIGHTERS.has(state[side].id)) return undefined
  return techniquesInCombo(state, side) > 0 ? Math.ceil(move.auraCost / 3) : undefined
}

/** Counts a technique that actually started. */
export function recordComboTechnique(
  state: FightState,
  side: FightSide,
  move: { auraCost: number } | null | undefined,
): ArcadeFighter {
  const fighter = state[side]
  if (!move || move.auraCost <= 0 || !HALF_PRICE_FIGHTERS.has(fighter.id)) return fighter
  const held = target(state, side)
  const comboTechniques: ComboTechniques = {
    count: techniquesInCombo(state, side) + 1,
    hits: held.comboHits,
    damage: held.comboDamage,
    frame: state.frame,
  }
  return { ...fighter, comboTechniques }
}

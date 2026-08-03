import type {
  AbilityConditionResult,
  AbilityContext,
  ActionVisibility,
} from '@black-whale/nen-engine'

/**
 * The grammar of uses — §8 of `docs/hatsu-potentiel.md`.
 *
 * A hatsu pushed to its maximum is not one gesture but a grid: each cell is a
 * target crossed with a technique (In, Gyo, Shu, Ko, En, Zetsu). What keeps the
 * grid honest is the rule of three truths: every cell says whether the manga
 * *shows* the use, merely *asserts* it, or whether it is a hypothesis — and a
 * hypothesis never reaches a canon view.
 */

/** The base techniques a use may be wrapped in, mapped onto engine primitives. */
export type NenTechnique = 'in' | 'gyo' | 'shu' | 'ko' | 'ken' | 'ryu' | 'en' | 'ten' | 'zetsu'

export type AbilityUseEvidence =
  /** Drawn in the manga: a normal wheel entry, with its source. */
  | { kind: 'shown'; source: string }
  /** Said in dialogue or in a data page, never drawn. */
  | { kind: 'asserted'; source: string }
  /** Never shown nor asserted: simulation branches only, never a canon view. */
  | { kind: 'hypothesis'; note?: string }

export const shown = (source: string): AbilityUseEvidence => ({ kind: 'shown', source })
export const asserted = (source: string): AbilityUseEvidence => ({ kind: 'asserted', source })
export const hypothesis = (note?: string): AbilityUseEvidence => ({ kind: 'hypothesis', note })

/**
 * What the manga shows the ability *refusing*. A displayed refusal is worth
 * more than a missing entry: Chain Jail on a non-Spider is a rule of the world,
 * not an oversight, so it stays on the wheel, greyed, carrying its reason.
 */
export type AbilityUseRefusal = string

/** The canon branch, where a hypothesis has no right to be executed. */
const CANON_BRANCH = 'canon'

/**
 * The provenance line the "Why?" panel shows under a use.
 *
 * Shown and asserted uses are notes: they explain, they never gate. A
 * hypothesis does gate — refused on the canon branch, allowed in a simulation
 * one, which is the only honest door for the "what if" (§8.2).
 */
export function evidenceCondition(
  evidence: AbilityUseEvidence,
  ctx: AbilityContext,
): AbilityConditionResult {
  if (evidence.kind === 'shown') {
    return { id: 'use-shown', label: `Montré au manga — ${evidence.source}`, status: 'MET' }
  }
  if (evidence.kind === 'asserted') {
    return {
      id: 'use-asserted',
      label: `Affirmé, non montré — ${evidence.source}`,
      status: 'MET',
    }
  }
  const subject = evidence.note ?? 'jamais montré ni affirmé'
  return {
    id: 'use-hypothesis',
    label: `Hypothèse — ${subject} : branche de simulation uniquement`,
    status: ctx.cursor?.branchId === CANON_BRANCH ? 'UNMET' : 'MET',
  }
}

/** Whether this use is one the canon views must not offer. */
export const isHypothesis = (evidence?: AbilityUseEvidence): boolean =>
  evidence?.kind === 'hypothesis'

/** A refusal blocks: the wheel shows it, the engine never runs it. */
export const refusalCondition = (refusal: AbilityUseRefusal): AbilityConditionResult => ({
  id: 'use-refused',
  label: refusal,
  status: 'UNMET',
})

/** What Gyo reveals of a masked use — the counter-field every In owes (§8.1). */
export const gyoCondition = (reveals: string): AbilityConditionResult => ({
  id: 'use-gyo',
  label: `Gyo révèle : ${reveals}`,
  status: 'MET',
})

export interface UseVisibilityInput {
  evidence?: AbilityUseEvidence
  refusal?: AbilityUseRefusal
  locked?: boolean
}

/**
 * Where a use lands on the wheel. A refusal is greyed rather than dropped, a
 * hypothesis is hidden from canon views, and everything else keeps the plain
 * locked/available split the modules already used.
 */
export function useVisibility(input: UseVisibilityInput): ActionVisibility {
  if (input.refusal) return 'locked'
  if (input.evidence?.kind === 'hypothesis') return 'hidden'
  return input.locked ? 'locked' : 'available'
}

/** The hint that explains that visibility, when the module gave none. */
export function useHint(input: UseVisibilityInput): string | undefined {
  if (input.refusal) return input.refusal
  if (input.evidence?.kind === 'hypothesis') {
    return input.evidence.note
      ? `Hypothèse : ${input.evidence.note} — simulation uniquement`
      : 'Hypothèse — accessible en branche de simulation uniquement'
  }
  if (input.evidence?.kind === 'asserted') {
    return `Affirmé, non montré — ${input.evidence.source}`
  }
  return undefined
}

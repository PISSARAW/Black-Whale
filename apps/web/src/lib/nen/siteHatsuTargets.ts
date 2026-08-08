import type { HatsuInteractionKind } from '@black-whale/nen-engine'

/** Techniques whose DOM transposition still requires an actual person marker. */
export const CHARACTER_ONLY_SITE_HATSU = new Set<HatsuInteractionKind>([
  'chain-rule',
  'chain-bind',
  'curse',
  'inherit',
  'ability-loan',
])

export const requiresCharacterTarget = (kind: HatsuInteractionKind) =>
  CHARACTER_ONLY_SITE_HATSU.has(kind)

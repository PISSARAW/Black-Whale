import type { NenTechniqueState } from '@black-whale/nen-engine'

export interface HumanAppearance {
  role:
    | 'witness'
    | 'guard'
    | 'nen-guard'
    | 'hunter'
    | 'fighter'
    | 'steward'
    | 'victim'
    | 'silent-majority'
    | 'morena'
  pose:
    | 'idle'
    | 'walk'
    | 'listen'
    | 'search'
    | 'held'
    | 'guard'
    | 'attack'
    | 'fallen'
    | 'seated'
    | 'flute'
  /**
   * What this body is wearing, when its role's own clothes are not the answer.
   *
   * The nine roles carry a costume each, which was enough while the only
   * people in the walk were supplied by a game. The named cast of ADR-003 is
   * not: a queen and her servant are both drawn from the catalogue's own
   * roles, and one of them is in a gown. Overriding the cloth rather than
   * adding a tenth role keeps the looks a closed set — see
   * `lib/tour/cast/wardrobe.ts`, which is the only thing that sets this.
   */
  dress?: 'civilian' | 'uniform' | 'suit' | 'combat' | 'ritual' | 'gown'
  aura?: 'none' | 'ten' | 'ren' | 'zetsu'
  /** Shared Nen state; every human figure consumes the same engine contract. */
  nen?: NenTechniqueState<'head' | 'torso' | 'hands' | 'feet'>
  /** Stable identity seed: named character when known, otherwise apparition id. */
  identity?: string
  alert?: boolean
}

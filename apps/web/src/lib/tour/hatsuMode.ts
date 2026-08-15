import { canUseHatsu, type NenTechniqueState } from '@black-whale/nen-engine'
import type { HatsuInteractionKind } from '$lib/nen/hatsuRegistry'

/** Parallel Future is the sole Tour Hatsu whose activation requires Zetsu. */
export const tourHatsuRequiresZetsu = (kind: HatsuInteractionKind | null) => kind === 'future'

/** The Tour's Hatsu compatibility rule, shared by its session and every input surface. */
export const canUseTourHatsu = (
  state: NenTechniqueState,
  kind: HatsuInteractionKind | null,
): boolean => (tourHatsuRequiresZetsu(kind) ? state.mode === 'zetsu' : canUseHatsu(state))

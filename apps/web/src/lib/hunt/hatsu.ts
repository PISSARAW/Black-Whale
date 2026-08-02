/**
 * The first ability adapter for Hunt.
 *
 * The catalogue remains authoritative: identity, Nen category, interaction
 * mode and action id come from `ability-modules`. Hunt only says how that
 * declared action enters its existing economy. Bungee Gum's masked elastic
 * connection is the entrave the prototype already knows how to account for;
 * no second trap or damage value is invented here.
 */
import { bungeeGum } from '@black-whale/ability-modules'

export type HuntHatsuId = 'bungee-gum'

export interface HuntHatsuProfile {
  id: HuntHatsuId
  name: string
  ownerId: string
  category: string
  actionId: 'set-trap'
  inputMode: string
}

const interaction = bungeeGum.getInteractionManifest()

export const BUNGEE_GUM_HUNT: HuntHatsuProfile = {
  id: 'bungee-gum',
  name: bungeeGum.manifest.name,
  ownerId: bungeeGum.manifest.ownerId,
  category: bungeeGum.manifest.category,
  actionId: 'set-trap',
  inputMode: interaction?.inputMode ?? 'DRAG',
}

export const DEFAULT_HUNT_HATSU = BUNGEE_GUM_HUNT.id

export function huntHatsu(id: HuntHatsuId): HuntHatsuProfile {
  switch (id) {
    case 'bungee-gum':
      return BUNGEE_GUM_HUNT
  }
}

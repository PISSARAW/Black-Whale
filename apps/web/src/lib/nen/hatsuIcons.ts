import { iconForGlyph, type MangaIconName } from '$lib/components/icons/mangaIcons'
import { HATSU_VISUAL_SIGNATURE_BY_KIND, type HatsuInteractionKind } from './hatsuRegistry'

// Several techniques share a legacy text glyph. SVGs can depict their actual
// manifestation instead, without changing the glyphs used by canvas exports.
const overrides: Partial<Record<HatsuInteractionKind, MangaIconName>> = {
  vehicle: 'vehicle',
  scout: 'insect',
  capture: 'cards',
  resurrection: 'cat',
  impact: 'planet',
  mimicry: 'mask',
  bookmark: 'book',
  pocket: 'cloth',
  puppet: 'antenna',
  'paper-spy': 'puppet',
  flock: 'bird',
  'blood-search': 'droplet',
  'door-network': 'door',
  'coercive-beast': 'guardian',
  'coin-growth': 'coin',
  'lie-marks': 'contract',
  'aura-levy': 'eye',
  'room-isolation': 'frame',
  decipher: 'frame',
}

export function iconForHatsu(kind: HatsuInteractionKind): MangaIconName {
  return overrides[kind] ?? iconForGlyph(HATSU_VISUAL_SIGNATURE_BY_KIND[kind].glyph)
}

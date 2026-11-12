import { mangaView as view, type MangaView } from './mangaViewModel'
import { ROYAL_ARMY_LOCAL_SECTION, SOLDIERS_QUARTERS } from './royalArmyRoomsStyle'

/** Inspection views of map reconstructions, not invented dormitory panels. */
export const MANGA_ROYAL_ARMY_ROOMS_VIEWS: MangaView[] = [
  ...Array.from({ length: 4 }, (_, index) => {
    const number = index + 1
    const x = 31 + index * 11
    return view({
      id: `royal-army-barracks-${number}`,
      spaceId: `${SOLDIERS_QUARTERS}-barracks-${number}`,
      at: [x, 26.4],
      target: [x, 20.5],
      pitch: -0.16,
      chapter: 363,
      volume: 35,
      pages: 'opening residential diagram',
      staging: [],
      label: `Army barrack ${number} — /ship reconstruction; the manga only locates the quarters`,
      labelFr: `Chambrée militaire ${number} — reconstruction /ship ; le manga situe seulement le quartier`,
    })
  }),
  ...Array.from({ length: 4 }, (_, index) => {
    const number = index + 1
    const x = 35.25 + index * 11
    return view({
      id: `royal-army-associates-${number}`,
      spaceId: `${SOLDIERS_QUARTERS}-hunters-${number}`,
      at: [x, 33.3],
      target: [x - 7.5, 38.4],
      pitch: -0.2,
      chapter: 363,
      volume: 35,
      pages: 'opening residential diagram',
      staging: [],
      label: `Provisional Hunter room ${number} — /ship bed layout, unshown interior`,
      labelFr: `Salle des Hunters provisoires ${number} — couchettes du plan /ship, intérieur non montré`,
    })
  }),
  view({
    id: 'royal-army-quarters-passage',
    spaceId: SOLDIERS_QUARTERS,
    at: [26, 29.75],
    target: [68, 29.75],
    pitch: 0,
    chapter: 363,
    volume: 35,
    pages: 'opening residential diagram',
    staging: [],
    label: 'Reconstructed passage — the chapter only names the quarters and lower-deck access',
    labelFr:
      'Passage reconstitué — le chapitre nomme seulement le quartier et l’accès aux ponts inférieurs',
  }),
  view({
    id: 'royal-army-local-section',
    spaceId: ROYAL_ARMY_LOCAL_SECTION,
    at: [0, -20],
    target: [0, -40],
    pitch: 0,
    chapter: 380,
    volume: 36,
    pages: '10 (chapter reading order)',
    staging: [],
    label:
      'Tier 3 Royal Army branch — cutaway location; room envelope reconstructed, interior unshown',
    labelFr:
      'Section de l’armée royale du pont 3 — située en coupe ; volume reconstitué, intérieur non montré',
  }),
]

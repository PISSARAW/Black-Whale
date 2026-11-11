import { mangaView as view, type MangaCastStaging, type MangaView } from './mangaViewModel'
import { CAMILLA_DINING, CAMILLA_ENTRANCE, CAMILLA_LIVING } from './camillaView'
import { MANGA_CAMILLA_APARTMENT_VIEWS } from './mangaCamillaApartmentViews'

/** Chapter 389: the briefing is standing, while Camilla is detained in the VVIP area. */
export const camillaGuardStaging: MangaCastStaging[] = [
  { characterId: 'sarahell', at: [1, 3.6], heading: Math.PI, pose: 'idle' },
  ...[
    'lisamsetta',
    'meshush',
    'mozbe',
    'umanma',
    'kako',
    'cavic',
    'nukuocon',
    'bucket',
    'burvena',
    'hignori',
    'fukataki',
    'taler',
  ].map((characterId, index) => {
    const at = [-0.8 + (index % 4) * 0.9, 0.85 + Math.floor(index / 4) * 0.85] as const
    return { characterId, at, heading: Math.atan2(1 - at[0], 3.6 - at[1]), pose: 'idle' as const }
  }),
]
export const camillaDiningStaging: MangaCastStaging[] = [
  { characterId: 'prince-camilla', at: [3.6, -4.42], heading: 0, pose: 'seated' },
  { characterId: 'duazul-hui-guo-rou', at: [3.6, -0.98], heading: Math.PI, pose: 'seated' },
]
export const musseStaging: MangaCastStaging[] = [
  { characterId: 'musse', at: [0.55, -5.65], heading: Math.PI, pose: 'seated' },
]

export const MANGA_CAMILLA_VIEWS: MangaView[] = [
  view({
    id: 'camilla-untouchables-circle', // Retained for existing links; the corrected scene is standing.
    spaceId: CAMILLA_LIVING,
    chapter: 389,
    eventSequence: 1,
    eventTitle: "Camilla's Have-Nots compare their curse assignments",
    volume: 37,
    pages: '16–17 (chapitre)',
    staging: camillaGuardStaging,
    at: [-3.8, -1.7],
    target: [0.85, 3.6],
    eyeHeight: 3.1,
    pitch: -0.28,
    label: 'The Have-Not guards standing for their briefing in Room 1002',
    labelFr: 'Les gardes Intouchables debout pour leur réunion dans la suite 1002',
  }),
  view({
    id: 'camilla-salon-panelling',
    staging: camillaGuardStaging,
    spaceId: CAMILLA_LIVING,
    chapter: 389,
    eventSequence: 1,
    eventTitle: "Camilla's Have-Nots compare their curse assignments",
    volume: 37,
    pages: '16–17 (chapitre)',
    at: [-2.8, 2.8],
    target: [0.85, 5.25],
    pitch: 0.17,
    label: 'Room 1002’s framed walls, peripheral seating and stepped ceiling',
    labelFr: 'Les murs moulurés, sièges périphériques et plafond en retrait de la suite 1002',
  }),
  view({
    id: 'camilla-duazul-dining',
    spaceId: CAMILLA_DINING,
    chapter: 366,
    eventSequence: 3,
    volume: 35,
    pages: '14–15 (chapitre)',
    staging: camillaDiningStaging,
    at: [7.4, -3.5],
    target: [3.6, -2.7],
    pitch: -0.07,
    label: 'Camilla and Duazul facing one another over flowers and short candles',
    labelFr: 'Camilla et Duazul face à face, de part et d’autre des fleurs et des bougies courtes',
  }),
  view({
    id: 'musse-surveillance-post',
    spaceId: CAMILLA_ENTRANCE,
    chapter: 366,
    eventSequence: 3,
    volume: 35,
    pages: '14–15 (chapitre)',
    staging: musseStaging,
    at: [-0.9, -8.4],
    target: [0.55, -6.3],
    pitch: -0.12,
    label: 'Musse at his separate passage desk with an open laptop and papers',
    labelFr: 'Musse à son bureau séparé du passage, avec ordinateur ouvert et papiers',
  }),
  ...MANGA_CAMILLA_APARTMENT_VIEWS,
]

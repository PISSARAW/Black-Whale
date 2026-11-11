import { mangaView, type MangaCastStaging, type MangaView } from './mangaViewModel'
import { MANGA_TSERRIEDNICH_APARTMENT_VIEWS } from './mangaTserriednichApartmentViews'

const living = 'tier-1-royal-residential-sector-room-1004-living'
export const tserriednichTrainingStaging: MangaCastStaging[] = [
  { characterId: 'prince-tserriednich', at: [0.5, 3.7], heading: Math.PI / 2, pose: 'idle' },
  { characterId: 'theta', at: [3.6, 3.7], heading: -Math.PI / 2, pose: 'idle' },
]
export const MANGA_TSERRIEDNICH_VIEWS: MangaView[] = [
  mangaView({
    id: 'tserriednich-living-training',
    spaceId: living,
    at: [2.1, 0.65],
    target: [2.1, 3.7],
    pitch: -0.03,
    chapter: 366,
    eventSequence: 3,
    volume: 35,
    pages: '10 (chapitre)',
    staging: [
      ...tserriednichTrainingStaging,
      { characterId: 'salkov', at: [4.25, 4.4], heading: Math.PI / 2, pose: 'idle' },
    ],
    beastStaging: [{ ownerId: 'prince-tserriednich', at: [-2.7, 3.7], heading: Math.PI / 2 }],
    label: 'Tserriednich’s first aura exercise with Theta and Salkov — reconstructed blocking',
    labelFr:
      'Premier exercice d’aura de Tserriednich avec Theta et Salkov — positions reconstituées',
  }),
  mangaView({
    id: 'tserriednich-zetsu-training',
    spaceId: living,
    at: [2.1, 0.65],
    target: [2.1, 3.7],
    pitch: -0.03,
    chapter: 385,
    eventSequence: 1,
    volume: 37,
    pages: '1, 5–7 (chapitre)',
    staging: tserriednichTrainingStaging,
    beastStaging: [{ ownerId: 'prince-tserriednich', omit: true }],
    label: 'Zetsu training — clear centre, rectangular floor grid and panelled double doors',
    labelFr: 'Entraînement au Zetsu — centre dégagé, sol quadrillé et doubles portes à panneaux',
  }),
  mangaView({
    id: 'tserriednich-clock-panelling',
    spaceId: living,
    at: [8.1, 1.8],
    target: [10.05, 2.8],
    pitch: -0.07,
    chapter: 385,
    eventSequence: 1,
    volume: 37,
    pages: '5, 7 (chapitre)',
    staging: [],
    label: 'The ornamental mantel clock and peripheral cabinets — unpopulated decor inspection',
    labelFr: 'Pendule ornementale et meubles périphériques — inspection du décor sans personnages',
  }),
  mangaView({
    id: 'tserriednich-salon-seating',
    spaceId: living,
    at: [-1.8, 4.4],
    target: [-6, 0.8],
    pitch: -0.08,
    chapter: 385,
    eventSequence: 1,
    volume: 37,
    pages: '7 (chapitre)',
    staging: [],
    label: 'Peripheral sofas and low tables, leaving the training floor clear',
    labelFr: 'Canapés et tables basses en périphérie, en laissant libre le sol d’entraînement',
  }),
  ...MANGA_TSERRIEDNICH_APARTMENT_VIEWS,
]

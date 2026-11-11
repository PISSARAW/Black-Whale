import { mangaView, type MangaView } from './mangaViewModel'
import { MANGA_FUGETSU_APARTMENT_VIEWS } from './mangaFugetsuApartmentViews'
import { FUGETSU_BEDROOM } from './fugetsuView'

const inspection = {
  staging: [],
  beastStaging: [{ ownerId: 'prince-fugetsu', omit: true }],
} as const
export const MANGA_FUGETSU_VIEWS: MangaView[] = [
  mangaView({
    id: 'fugetsu-bedroom-curtains',
    spaceId: FUGETSU_BEDROOM,
    at: [-1, 6.4],
    target: [-5.8, 8.7],
    pitch: -0.07,
    chapter: 366,
    volume: 35,
    pages: '3 (chapitre)',
    ...inspection,
    label:
      'Broad column bed and open curtains — unpopulated decor inspection, without Magical Worm',
    labelFr:
      'Grand lit à colonnes et rideaux ouverts — inspection du décor sans personnages ni Magical Worm',
  }),
  mangaView({
    id: 'fugetsu-bedroom-keepsakes',
    spaceId: FUGETSU_BEDROOM,
    at: [-5.7, 6.5],
    target: [-5.55, 8.1],
    eyeHeight: 1.5,
    pitch: -0.43,
    chapter: 366,
    volume: 35,
    pages: '3 (chapitre)',
    ...inspection,
    label:
      'Albums, loose photographs and tissue box on the covers — simplified original photo silhouettes',
    labelFr:
      'Albums, photographies éparses et boîte de mouchoirs sur le linge — silhouettes photographiques originales simplifiées',
  }),
  mangaView({
    id: 'fugetsu-digital-clock',
    spaceId: FUGETSU_BEDROOM,
    at: [-3.1, 7.95],
    target: [-3.25, 9.2],
    eyeHeight: 1.15,
    pitch: -0.15,
    chapter: 374,
    volume: 36,
    pages: '9 (chapitre)',
    ...inspection,
    label: 'Digital bedside clock showing the panel’s 01:27 — reconstructed support and placement',
    labelFr: 'Réveil numérique affichant le 01 h 27 de la case — support et position reconstitués',
  }),
  mangaView({
    id: 'fugetsu-wardrobe',
    spaceId: FUGETSU_BEDROOM,
    at: [-8.3, 6.6],
    target: [-10.05, 8.25],
    pitch: 0.06,
    chapter: 374,
    volume: 36,
    pages: '11 (chapitre)',
    ...inspection,
    label:
      'Ornate wardrobe beside the curtain bed — simplified glass panels and carved lower doors',
    labelFr:
      'Armoire ornée à côté du lit à rideaux — vitrages et portes basses sculptées simplifiés',
  }),
  ...MANGA_FUGETSU_APARTMENT_VIEWS,
]

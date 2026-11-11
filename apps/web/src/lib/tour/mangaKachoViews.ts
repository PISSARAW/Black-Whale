import { mangaView, type MangaView } from './mangaViewModel'
import { MANGA_KACHO_APARTMENT_VIEWS } from './mangaKachoApartmentViews'
import { KACHO_LIVING, KACHO_KITCHEN, KACHO_DINING } from './kachoView'

const inspection = { staging: [], beastStaging: [{ ownerId: 'prince-kacho', omit: true }] } as const
export const MANGA_KACHO_VIEWS: MangaView[] = [
  mangaView({
    id: 'kacho-living-homework',
    spaceId: KACHO_LIVING,
    at: [-2.9, 3.4],
    target: [-6, 0.2],
    pitch: -0.04,
    chapter: 376,
    volume: 36,
    pages: '10–11 (chapitre)',
    ...inspection,
    label:
      'Kacho’s study table, tall chair and framed upper ornaments — unpopulated decor inspection',
    labelFr:
      'Table de travail, grand fauteuil et ornements supérieurs encadrés — inspection du décor sans personnages',
  }),
  mangaView({
    id: 'kacho-study-table',
    spaceId: KACHO_LIVING,
    at: [-4.2, 1.9],
    target: [-6, 0.8],
    pitch: -0.35,
    chapter: 376,
    volume: 36,
    pages: '10–11 (chapitre)',
    ...inspection,
    label:
      'Open book, calculator and bottle — original abstract page marks, without the Morse message',
    labelFr:
      'Livre ouvert, calculatrice et bouteille — signes de page abstraits originaux, sans le message en morse',
  }),
  mangaView({
    id: 'kacho-kitchen-cabinet',
    spaceId: KACHO_KITCHEN,
    at: [6, -6.5],
    target: [5.8, -9.4],
    pitch: -0.08,
    chapter: 376,
    volume: 36,
    pages: '11 (chapitre)',
    ...inspection,
    label:
      'L-shaped kitchen with left cooker, rear cupboards and sink, wall units and right refrigerator',
    labelFr:
      'Cuisine en L avec cuisinière à gauche, placards et évier au fond, éléments hauts et réfrigérateur à droite',
  }),
  mangaView({
    id: 'kacho-kitchen-cooker',
    spaceId: KACHO_KITCHEN,
    at: [5.4, -7.5],
    target: [3.3, -8.4],
    pitch: -0.3,
    chapter: 376,
    volume: 36,
    pages: '11 (chapitre)',
    ...inspection,
    label: 'Hob, covered saucepan, built-in oven and hood on the left return',
    labelFr: 'Plaque, casserole couverte, four encastré et hotte sur le retour gauche',
  }),
  mangaView({
    id: 'kacho-kitchen-lower-cupboard',
    spaceId: KACHO_KITCHEN,
    at: [4, -8.5],
    target: [4.8, -9.8],
    pitch: -0.5,
    chapter: 376,
    volume: 36,
    pages: '11 (chapitre)',
    ...inspection,
    label: 'Lower cupboards named by Melody’s Morse — exact door and hidden contents not specified',
    labelFr:
      'Placards bas cités par le morse de Senritsu — porte précise et contenu caché non spécifiés',
  }),
  mangaView({
    id: 'kacho-dining-table',
    spaceId: KACHO_DINING,
    at: [9.3, -4.8],
    target: [5.1, -2.7],
    pitch: -0.08,
    chapter: 366,
    volume: 35,
    pages: '4 (chapitre)',
    ...inspection,
    label: 'Rectangular bordered dining table and high-backed chairs — without the thrown meal',
    labelFr: 'Table de repas rectangulaire à bordure et sièges à haut dossier — sans le repas jeté',
  }),
  ...MANGA_KACHO_APARTMENT_VIEWS,
]

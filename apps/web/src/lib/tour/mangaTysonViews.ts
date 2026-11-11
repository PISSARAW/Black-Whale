import { mangaView, type MangaView } from './mangaViewModel'
import { MANGA_TYSON_APARTMENT_VIEWS } from './mangaTysonApartmentViews'
import { TYSON_LIVING } from './tysonView'

export const MANGA_TYSON_VIEWS: MangaView[] = [
  mangaView({
    id: 'tyson-living-audience',
    spaceId: TYSON_LIVING,
    at: [-1.8, 4.5],
    target: [-6, 2.6],
    pitch: -0.09,
    chapter: 375,
    eventSequence: 1,
    volume: 36,
    pages: '1 (chapitre)',
    staging: [],
    beastStaging: [{ ownerId: 'prince-tyson', omit: true }],
    label:
      'Tyson’s salon: upholstered seats, square low table, bouquet and book — decor inspection',
    labelFr:
      'Salon de Tyson : sièges rembourrés, table basse carrée, bouquet et livre — inspection du décor',
  }),
  mangaView({
    id: 'tyson-salon-overview',
    spaceId: TYSON_LIVING,
    at: [0, 1.4],
    target: [1, 3.3],
    eyeHeight: 3.4,
    pitch: -0.5,
    chapter: 375,
    eventSequence: 1,
    volume: 36,
    pages: '1 (chapitre)',
    staging: [],
    beastStaging: [{ ownerId: 'prince-tyson', omit: true }],
    label:
      'The salon’s rectangular floor grid and checkerboard side rug — reconstructed metric layout',
    labelFr:
      'Quadrillage rectangulaire du salon et tapis latéral à damier — implantation métrique reconstituée',
  }),
  mangaView({
    id: 'tyson-checkerboard-corner',
    spaceId: TYSON_LIVING,
    at: [2.8, 1.6],
    target: [7.1, 3],
    pitch: -0.12,
    chapter: 375,
    eventSequence: 1,
    volume: 36,
    pages: '1 (chapitre)',
    staging: [],
    beastStaging: [{ ownerId: 'prince-tyson', omit: true }],
    label: 'The checkerboard side rug and low service table — unpopulated decor inspection',
    labelFr:
      'Tapis latéral à damier et table basse de service — inspection du décor sans personnages',
  }),
  mangaView({
    id: 'tyson-salon-panelling',
    spaceId: TYSON_LIVING,
    at: [2.6, 3.8],
    target: [-1.1, -2.4],
    pitch: 0.16,
    chapter: 389,
    eventSequence: 1,
    volume: 37,
    pages: '10 (chapitre)',
    staging: [],
    beastStaging: [{ ownerId: 'prince-tyson', omit: true }],
    label:
      'Floral panels, fluted dado and the doorway of Giuliano’s surprise birthday — permanent decor only',
    labelFr:
      'Panneaux à motifs, soubassement strié et porte de l’anniversaire surprise de Giuliano — décor permanent seul',
  }),
  ...MANGA_TYSON_APARTMENT_VIEWS,
]

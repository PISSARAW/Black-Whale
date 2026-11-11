import { mangaView, type MangaView } from './mangaViewModel'
import { MANGA_LUZURUS_APARTMENT_VIEWS } from './mangaLuzurusApartmentViews'
import { LUZURUS_LIVING } from './luzurusView'

export const MANGA_LUZURUS_VIEWS: MangaView[] = [
  mangaView({
    id: 'luzurus-living-sofa',
    spaceId: LUZURUS_LIVING,
    at: [4.2, 1.05],
    target: [7, 2.8],
    pitch: -0.12,
    chapter: 386,
    eventSequence: 1,
    volume: 37,
    pages: '8 (chapitre)',
    staging: [],
    beastStaging: [{ ownerId: 'prince-luzurus', omit: true }],
    label:
      'Luzurus’s deep upholstered seat, framed backdrop and stocked shelving — decor inspection',
    labelFr:
      'Assise capitonnée de Luzurus, grand cadre et rayonnages remplis — inspection du décor',
  }),
  mangaView({
    id: 'luzurus-smoking-area',
    spaceId: LUZURUS_LIVING,
    at: [0, 0],
    target: [2.8, 2.8],
    pitch: -0.27,
    chapter: 366,
    eventSequence: 3,
    volume: 35,
    pages: '7 (chapitre)',
    staging: [],
    beastStaging: [{ ownerId: 'prince-luzurus', omit: true }],
    label:
      'The chapter 366 hookah, low table and floor cushions — reconstructed corner without an asserted raised floor',
    labelFr:
      'Narguilé, table basse et coussins du chapitre 366 — coin reconstitué sans sol surélevé affirmé',
  }),
  mangaView({
    id: 'luzurus-television-lounge',
    spaceId: LUZURUS_LIVING,
    at: [-2.5, 3.5],
    target: [-10.1, 2.7],
    pitch: -0.02,
    chapter: 386,
    eventSequence: 1,
    volume: 37,
    pages: '8 (chapitre)',
    staging: [],
    beastStaging: [{ ownerId: 'prince-luzurus', omit: true }],
    label:
      'Television, secondary seats, side tables and bottles — original approximate screen image',
    labelFr:
      'Télévision, assises secondaires, petites tables et bouteilles — image d’écran originale approximative',
  }),
  mangaView({
    id: 'luzurus-salon-panelling',
    spaceId: LUZURUS_LIVING,
    at: [0, 1.4],
    target: [-5, 5.4],
    pitch: 0.12,
    chapter: 386,
    eventSequence: 1,
    volume: 37,
    pages: '8 (chapitre)',
    staging: [],
    beastStaging: [{ ownerId: 'prince-luzurus', omit: true }],
    label:
      'Floral infills, upper cartouches, framed pictures and the room’s rectangular floor grid',
    labelFr:
      'Panneaux à motifs, cartouches supérieurs, tableaux et quadrillage rectangulaire du salon',
  }),
  ...MANGA_LUZURUS_APARTMENT_VIEWS,
]

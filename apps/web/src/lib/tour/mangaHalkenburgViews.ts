import { mangaView, type MangaView } from './mangaViewModel'
import { MANGA_HALKENBURG_APARTMENT_VIEWS } from './mangaHalkenburgApartmentViews'
import { HALKENBURG_BEDROOM, HALKENBURG_LIVING } from './halkenburgView'

const inspection = {
  staging: [],
  beastStaging: [{ ownerId: 'prince-halkenburg', omit: true }],
} as const
export const MANGA_HALKENBURG_VIEWS: MangaView[] = [
  mangaView({
    id: 'halkenburg-living-cleared',
    spaceId: HALKENBURG_LIVING,
    at: [-0.5, 4.4],
    target: [4.5, 0.7],
    pitch: -0.05,
    chapter: 382,
    volume: 37,
    pages: '11 (chapitre)',
    ...inspection,
    label:
      'Cleared reception room, bookcases and arched central feature — reconstructed metric layout',
    labelFr:
      'Salon dégagé, bibliothèques et élément central cintré — implantation métrique reconstituée',
  }),
  mangaView({
    id: 'halkenburg-folding-chairs',
    spaceId: HALKENBURG_LIVING,
    at: [4.5, 1.4],
    target: [4.5, 3.2],
    pitch: -0.28,
    chapter: 386,
    volume: 37,
    pages: '13 (chapitre)',
    ...inspection,
    label:
      'Two folding chairs facing one another — movable interview arrangement, without characters',
    labelFr:
      'Deux chaises pliantes face à face — disposition mobile de l’entretien, sans personnages',
  }),
  mangaView({
    id: 'halkenburg-bookcases',
    spaceId: HALKENBURG_LIVING,
    at: [1.3, 2.5],
    target: [2.45, 0.65],
    pitch: 0.03,
    chapter: 382,
    volume: 37,
    pages: '11 (chapitre)',
    ...inspection,
    label: 'Open shelves, books, cornices and floral wall panels — simplified original motifs',
    labelFr:
      'Rayonnages ouverts, livres, corniches et panneaux muraux à motifs — ornements originaux simplifiés',
  }),
  mangaView({
    id: 'halkenburg-bedroom-curtains',
    spaceId: HALKENBURG_BEDROOM,
    at: [-5.3, 6.3],
    target: [-8, 9.8],
    pitch: -0.02,
    chapter: 366,
    volume: 35,
    pages: '5 (chapitre)',
    ...inspection,
    label: 'Curved carved headboard and curtains behind the bed — unpopulated decor inspection',
    labelFr:
      'Tête de lit courbe sculptée et rideaux arrière — inspection du décor sans personnages',
  }),
  mangaView({
    id: 'halkenburg-bedroom-bedding',
    spaceId: HALKENBURG_BEDROOM,
    at: [-7.4, 6.4],
    target: [-8, 8.6],
    pitch: -0.28,
    chapter: 366,
    volume: 35,
    pages: '5 (chapitre)',
    ...inspection,
    label: 'Pale pillows and loose bedding — approximate folds, reconstructed bed dimensions',
    labelFr:
      'Oreillers clairs et linge ample — plis approximatifs, dimensions du lit reconstituées',
  }),
  ...MANGA_HALKENBURG_APARTMENT_VIEWS,
]

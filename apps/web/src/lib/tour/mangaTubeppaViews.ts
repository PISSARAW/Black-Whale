import { mangaView, type MangaView } from './mangaViewModel'
import { MANGA_TUBEPPA_APARTMENT_VIEWS } from './mangaTubeppaApartmentViews'
import { TUBEPPA_LIVING } from './tubeppaView'

export const MANGA_TUBEPPA_VIEWS: MangaView[] = [
  mangaView({
    id: 'tubeppa-living-workstation',
    spaceId: TUBEPPA_LIVING,
    at: [4.2, 3],
    target: [9, 3],
    pitch: -0.06,
    chapter: 366,
    eventSequence: 3,
    volume: 35,
    pages: '9 (chapitre)',
    staging: [
      { characterId: 'prince-tubeppa', at: [9.05, 3], heading: -Math.PI / 2, pose: 'seated' },
    ],
    beastStaging: [{ ownerId: 'prince-tubeppa', omit: true }],
    label:
      'Tubeppa at her laptop, with files, a bottle and two adjacent writing boards — reconstructed blocking',
    labelFr:
      'Tubeppa devant son ordinateur, avec dossiers, bouteille et deux tableaux contigus — positions reconstituées',
  }),
  mangaView({
    id: 'tubeppa-desk-objects',
    spaceId: TUBEPPA_LIVING,
    at: [5.6, 2.1],
    target: [7.65, 3],
    pitch: -0.25,
    chapter: 366,
    eventSequence: 3,
    volume: 35,
    pages: '9 (chapitre)',
    staging: [],
    beastStaging: [{ ownerId: 'prince-tubeppa', omit: true }],
    label: 'Open laptop, bottle, files and desktop stationery — unpopulated decor inspection',
    labelFr:
      'Ordinateur ouvert, bouteille, dossiers et papeterie — inspection du décor sans personnages',
  }),
  mangaView({
    id: 'tubeppa-research-boards',
    spaceId: TUBEPPA_LIVING,
    at: [8.9, 1.7],
    target: [10.32, 3],
    pitch: 0.08,
    chapter: 388,
    eventSequence: 1,
    volume: 37,
    pages: '16 (chapitre)',
    staging: [],
    beastStaging: [{ ownerId: 'prince-tubeppa', omit: true }],
    label: 'Pinned sheets and dense marker writing behind Tubeppa — original approximate strokes',
    labelFr:
      'Feuilles épinglées et écriture dense derrière Tubeppa — tracés originaux approximatifs',
  }),
  mangaView({
    id: 'tubeppa-salon-panelling',
    spaceId: TUBEPPA_LIVING,
    at: [6.4, 3.8],
    target: [-6, 1.2],
    pitch: 0.12,
    chapter: 388,
    eventSequence: 1,
    volume: 37,
    pages: '16 (chapitre)',
    staging: [],
    beastStaging: [{ ownerId: 'prince-tubeppa', omit: true }],
    label: 'Floral wall panels and coffered ceiling; peripheral furniture remains a reconstruction',
    labelFr: 'Panneaux muraux à motifs et plafond à caissons ; mobilier périphérique reconstitué',
  }),
  ...MANGA_TUBEPPA_APARTMENT_VIEWS,
]

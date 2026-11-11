import { mangaView, type MangaView } from './mangaViewModel'
import { MARAYAM_BEDROOM, MARAYAM_LIVING, MARAYAM_DINING, MARAYAM_STAFF } from './marayamView'
import { MANGA_MARAYAM_APARTMENT_VIEWS } from './mangaMarayamApartmentViews'

const inspection = {
  staging: [],
  beastStaging: [{ ownerId: 'prince-marayam', omit: true }],
} as const
export const MANGA_MARAYAM_VIEWS: MangaView[] = [
  mangaView({
    id: 'marayam-dining-meal',
    spaceId: MARAYAM_DINING,
    at: [6, 0.05],
    target: [6, -2.7],
    pitch: -0.15,
    chapter: 366,
    volume: 35,
    pages: '1 (chapitre)',
    ...inspection,
    label:
      'Full-height carved meal table and two tall chairs — empty decor inspection, metric placement reconstructed',
    labelFr:
      'Table de repas haute sculptée et deux sièges à haut dossier — inspection du décor vide, implantation métrique reconstituée',
  }),
  mangaView({
    id: 'marayam-dining-sideboard',
    spaceId: MARAYAM_DINING,
    at: [3.8, -1.1],
    target: [1.85, -3.5],
    pitch: -0.03,
    chapter: 366,
    volume: 35,
    pages: '1 (chapitre)',
    ...inspection,
    label: 'Sideboard, striped vase and framed picture — original simplified motifs',
    labelFr: 'Crédence, vase strié et tableau encadré — motifs originaux simplifiés',
  }),
  mangaView({
    id: 'marayam-living-play',
    spaceId: MARAYAM_LIVING,
    at: [-3.6, 4.8],
    target: [-0.4, 2],
    pitch: -0.3,
    chapter: 372,
    volume: 36,
    pages: '16 (chapitre)',
    ...inspection,
    label:
      'Bordered floor play area, toy cars, blocks and folded paper — furniture inspection without occupants',
    labelFr:
      'Aire de jeu au sol bordée, voitures, blocs et papier plié — inspection du mobilier sans occupants',
  }),
  mangaView({
    id: 'marayam-living-vent',
    spaceId: MARAYAM_LIVING,
    at: [-8.2, -0.4],
    target: [-10.3, -0.5],
    pitch: 0.6,
    chapter: 367,
    volume: 35,
    pages: '19 (chapitre)',
    ...inspection,
    label: 'High horizontal-louvred grille used by Oito’s cockroach to observe Marayam’s apartment',
    labelFr:
      'Grille haute à lames horizontales par laquelle le cafard d’Oito observe l’appartement de Marayam',
  }),
  mangaView({
    id: 'marayam-staff-bunks',
    spaceId: MARAYAM_STAFF,
    at: [-4.6, -3.4],
    target: [-8, -8.2],
    pitch: -0.02,
    chapter: 372,
    volume: 36,
    pages: '16 (chapitre)',
    ...inspection,
    label:
      'Square-posted bunks, upper rails and foot ladders — reconstructed placement in the staff zone',
    labelFr:
      'Lits superposés à montants carrés, garde-corps et échelles — placement reconstitué dans la zone du personnel',
  }),
  mangaView({
    id: 'marayam-hanzo-bunk',
    spaceId: MARAYAM_STAFF,
    at: [-8, -5.5],
    target: [-9.1, -8.2],
    eyeHeight: 2,
    pitch: -0.08,
    chapter: 375,
    volume: 36,
    pages: '10 (chapitre)',
    ...inspection,
    label:
      'Upper bunk where Hanzo rests — empty bed inspection, cabinet with paper stack and cup nearby',
    labelFr:
      'Couchette haute où repose Hanzo — inspection du lit vide, meuble avec papiers et tasse à proximité',
  }),
  mangaView({
    id: 'marayam-bedroom-crib',
    spaceId: MARAYAM_BEDROOM,
    at: [-2.3, 6.4],
    target: [-4.8, 8.3],
    pitch: -0.15,
    chapter: 375,
    volume: 36,
    pages: '11 (chapitre)',
    ...inspection,
    label: 'Marayam’s barred child bed — empty decor inspection, dimensions reconstructed',
    labelFr: 'Lit à barreaux de Marayam — inspection du décor vide, dimensions reconstituées',
  }),
  mangaView({
    id: 'marayam-bedroom-layout',
    spaceId: MARAYAM_BEDROOM,
    at: [-4.6, 6.2],
    target: [-6.2, 8.6],
    pitch: -0.09,
    chapter: 375,
    volume: 36,
    pages: '11 (chapitre)',
    ...inspection,
    label: 'Child bed beside an adult bed — adult furniture and metric layout partly reconstructed',
    labelFr:
      'Lit de l’enfant à côté d’un lit adulte — mobilier adulte et implantation métrique partiellement reconstitués',
  }),
  ...MANGA_MARAYAM_APARTMENT_VIEWS,
]

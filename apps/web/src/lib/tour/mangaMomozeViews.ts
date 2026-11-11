import { mangaView, type MangaView } from './mangaViewModel'
import { MOMOZE_BEDROOM, MOMOZE_LIVING } from './momozeView'
import { MANGA_MOMOZE_APARTMENT_VIEWS } from './mangaMomozeApartmentViews'

const inspection = {
  staging: [],
  beastStaging: [{ ownerId: 'prince-momoze', omit: true }],
} as const
export const MANGA_MOMOZE_VIEWS: MangaView[] = [
  mangaView({
    id: 'momoze-bedroom-canopy',
    spaceId: MOMOZE_BEDROOM,
    at: [-3, 6],
    target: [-5.8, 8.4],
    pitch: 0.15,
    chapter: 366,
    volume: 35,
    pages: '2 (chapitre) ; 368 p. 9',
    ...inspection,
    label: 'Carved canopy bed — curtains open as in ch. 368 p. 9, unpopulated decor inspection',
    labelFr:
      'Lit à baldaquin sculpté — rideaux ouverts comme au chap. 368 p. 9, inspection du décor sans personnages',
  }),
  mangaView({
    id: 'momoze-bedroom-headboard',
    spaceId: MOMOZE_BEDROOM,
    at: [-5.8, 6.4],
    target: [-5.8, 9.55],
    eyeHeight: 1.7,
    pitch: -0.17,
    chapter: 368,
    volume: 35,
    pages: '3 (chapitre)',
    ...inspection,
    label:
      'Shaped tufted headboard, two pillows and loose pale bedding — no reenactment of the attack',
    labelFr:
      'Tête de lit chantournée capitonnée, deux oreillers et linge clair ample — sans reconstitution de l’agression',
  }),
  mangaView({
    id: 'momoze-bedroom-vent',
    spaceId: MOMOZE_BEDROOM,
    at: [-2.8, 8.4],
    target: [-3, 10],
    pitch: 0.65,
    chapter: 368,
    volume: 35,
    pages: '3 (chapitre)',
    ...inspection,
    label:
      'High grille with horizontal louvres — Oito’s cockroach observation, not an established entrance for the killer',
    labelFr:
      'Grille haute à lames horizontales — observation d’Oito par le cafard, pas une entrée attestée de l’assassin',
  }),
  mangaView({
    id: 'momoze-living-table',
    spaceId: MOMOZE_LIVING,
    at: [-5.8, 3.8],
    target: [-6, 0],
    pitch: -0.12,
    chapter: 361,
    volume: 35,
    pages: '18 (chapitre)',
    ...inspection,
    label:
      'Reception table, shaded lamps, flowers, chairs and palm — reconstructed metric placement',
    labelFr:
      'Table de réception, lampes à abat-jour, fleurs, sièges et palmier — implantation métrique reconstituée',
  }),
  mangaView({
    id: 'momoze-living-armchair',
    spaceId: MOMOZE_LIVING,
    at: [-3, 4.7],
    target: [-3.2, 1.7],
    pitch: -0.12,
    chapter: 361,
    volume: 35,
    pages: '19 (chapitre)',
    ...inspection,
    label:
      'Momoze’s curved upholstered armchair and woven floor basket — empty furniture inspection',
    labelFr: 'Fauteuil rembourré de Momoze et panier tressé au sol — inspection du mobilier vide',
  }),
  ...MANGA_MOMOZE_APARTMENT_VIEWS,
]

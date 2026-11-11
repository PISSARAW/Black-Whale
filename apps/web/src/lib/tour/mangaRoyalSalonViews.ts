import { mangaView as view, type MangaCastStaging, type MangaView } from './mangaViewModel'
import { ROYAL_SALON, ROYAL_VESTIBULE } from './royalSalonView'

const staging: MangaCastStaging[] = [
  { characterId: 'nasubi-hui-guo-rou', at: [0, -1.1], heading: 0, pose: 'seated' },
  { characterId: 'prince-halkenburg', at: [-3.2, 2.15], heading: 0, pose: 'idle' },
]
const beasts = [
  { ownerId: 'nasubi-hui-guo-rou', omit: true },
  { ownerId: 'prince-halkenburg', omit: true },
] as const
const source = {
  spaceId: ROYAL_SALON,
  chapter: 382,
  eventSequence: 1,
  volume: 37,
  staging,
  beastStaging: beasts,
}
const inspection = {
  spaceId: ROYAL_SALON,
  chapter: 382,
  volume: 37,
  staging: [],
  beastStaging: beasts,
}

export const MANGA_ROYAL_SALON_VIEWS: MangaView[] = [
  view({
    ...source,
    id: 'nasubi-living-mantel',
    at: [1, 4.5],
    target: [11.3, -1.9],
    pitch: 0.04,
    pages: '4 (chapitre, double planche)',
    label: 'Nasubi’s salon, the side-wall battle painting and ornamented mantel',
    labelFr: 'Le salon de Nasubi, le tableau de bataille et le manteau du mur latéral',
  }),
  view({
    ...source,
    id: 'nasubi-living-landscape',
    at: [0, 5.1],
    target: [0, -8.18],
    pitch: 0.08,
    pages: '3–4 (chapitre)',
    label: 'The King’s reclining chair facing the large framed landscape panel',
    labelFr: 'Le fauteuil de repos du roi face au grand panneau paysager encadré',
  }),
  view({
    ...source,
    id: 'nasubi-living-vault',
    at: [3.5, 4.3],
    target: [-6, -6],
    pitch: 0.3,
    pages: '4 (chapitre, double planche)',
    label: 'The royal salon’s coffered barrel vault, square piers and picture walls',
    labelFr: 'La voûte à caissons du salon royal, ses piles carrées et ses murs de tableaux',
  }),
  view({
    ...inspection,
    id: 'nasubi-salon-overview',
    at: [0, 6.2],
    target: [0, -8.18],
    pitch: 0.08,
    pages: '3–4 (chapitre)',
    label: 'Furnished salon and landscape axis — empty decor inspection',
    labelFr: 'Salon meublé et axe du paysage — inspection du décor sans occupants',
  }),
  view({
    ...inspection,
    id: 'nasubi-mantel-objects',
    at: [7, -3.6],
    target: [11.35, -1.9],
    pitch: -0.04,
    pages: '4 (chapitre, double planche)',
    label: 'Mantel bust, framed photographs, clock and vessels — simplified original forms',
    labelFr:
      'Buste, photographies encadrées, horloge et vases du manteau — formes originales simplifiées',
  }),
  view({
    ...inspection,
    id: 'nasubi-seating-service',
    at: [-3.5, 4.5],
    target: [-8.4, 1.4],
    pitch: -0.14,
    pages: '3–4 (chapitre)',
    label: 'Upholstered seating and cloth-draped drinks service — empty decor inspection',
    labelFr: 'Sièges rembourrés et desserte à boissons drapée — inspection du décor sans occupants',
  }),
  view({
    ...inspection,
    id: 'nasubi-chair-profile',
    at: [3.2, -1.8],
    target: [0, -1.1],
    pitch: -0.18,
    pages: '4–7 (chapitre)',
    label: 'Long reclining chair with scrolled arms and exposed carved legs',
    labelFr: 'Fauteuil de repos allongé, accoudoirs à volutes et pieds sculptés dégagés',
  }),
  view({
    ...inspection,
    id: 'nasubi-floor-inlay',
    at: [2.8, 5.4],
    target: [0, -2],
    pitch: -0.65,
    pages: '3–4 (chapitre)',
    label: 'Dark geometric bands and pale inlaid floor fields — metric pattern reconstructed',
    labelFr: 'Bandes géométriques sombres et champs clairs du sol — trame métrique reconstituée',
  }),
  view({
    id: 'nasubi-vestibule-reconstruction',
    spaceId: ROYAL_VESTIBULE,
    at: [0, 11.4],
    target: [0, 8.4],
    pitch: 0.02,
    chapter: 382,
    volume: 37,
    pages: '1–2 (chapitre)',
    staging: [],
    beastStaging: beasts,
    label:
      'Vestibule reconstruction — the guarded lobby does not establish this inherited metric connection',
    labelFr:
      'Vestibule : reconstitution — le hall gardé ne fournit pas le tracé métrique de ce raccord hérité',
  }),
]

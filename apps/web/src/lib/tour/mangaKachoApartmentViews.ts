import { mangaView, type MangaView } from './mangaViewModel'
import type { Vec2 } from './types'

const prefix = 'tier-1-royal-residential-sector-room-1010'
const rooms: { suffix: string; at: Vec2; target: Vec2; en: string; fr: string }[] = [
  {
    suffix: 'bedroom',
    at: [-4.7, 8.7],
    target: [-9.3, 7],
    en: 'Kacho’s bedroom',
    fr: 'Chambre de Kacho',
  },
  { suffix: 'entrance', at: [0, -3.8], target: [0, -9.5], en: 'Entrance passage', fr: 'Vestibule' },

  {
    suffix: 'servants',
    at: [-4.7, -3.4],
    target: [-8.2, -9.1],
    en: 'Staff room',
    fr: 'Pièce du personnel',
  },
  {
    suffix: 'servants-wc',
    at: [-3.5, -4.6],
    target: [-1.85, -5.25],
    en: 'Staff WC',
    fr: 'WC du personnel',
  },
  {
    suffix: 'bathroom',
    at: [5.25, 6.5],
    target: [8.8, 8.8],
    en: 'Bath and WC',
    fr: 'Salle de bains et WC',
  },
]
export const MANGA_KACHO_APARTMENT_VIEWS: MangaView[] = rooms.map((room) =>
  mangaView({
    id: `kacho-${room.suffix}-reconstruction`,
    spaceId: `${prefix}-${room.suffix}`,
    at: room.at,
    target: room.target,
    pitch: room.suffix === 'servants-wc' ? -0.5 : -0.12,
    chapter: 363,
    eventSequence: 2,
    volume: 35,
    pages: '2 (chapitre, programme-type)',
    staging: [],
    beastStaging: [{ ownerId: 'prince-kacho', omit: true }],
    label: `${room.en} — Room 1010 reconstruction from the chapter 363 programme-type`,
    labelFr: `${room.fr} — reconstitution du 1010 à partir du programme-type du chapitre 363`,
  }),
)

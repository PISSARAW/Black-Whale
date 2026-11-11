import { mangaView, type MangaView } from './mangaViewModel'
import type { Vec2 } from './types'

const prefix = 'tier-1-royal-residential-sector-room-1005'
const rooms: { suffix: string; at: Vec2; target: Vec2; en: string; fr: string }[] = [
  { suffix: 'dining', at: [9.3, -4.8], target: [5, -2.7], en: 'Dining room', fr: 'Salle à manger' },
  { suffix: 'entrance', at: [0, -3.8], target: [0, -9.5], en: 'Entrance passage', fr: 'Vestibule' },
  {
    suffix: 'bedroom',
    at: [-4.7, 8.7],
    target: [-9.3, 7],
    en: 'Tubeppa’s bedroom',
    fr: 'Chambre de Tubeppa',
  },
  { suffix: 'kitchen', at: [9.4, -6.4], target: [4.5, -9.6], en: 'Kitchen', fr: 'Cuisine' },
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
export const MANGA_TUBEPPA_APARTMENT_VIEWS: MangaView[] = rooms.map((room) =>
  mangaView({
    id: `tubeppa-${room.suffix}-reconstruction`,
    spaceId: `${prefix}-${room.suffix}`,
    at: room.at,
    target: room.target,
    pitch: room.suffix === 'servants-wc' ? -0.5 : -0.12,
    chapter: 363,
    eventSequence: 2,
    volume: 35,
    pages: '2 (chapitre, programme-type)',
    staging: [],
    label: `${room.en} — Room 1005 reconstruction from the chapter 363 programme-type`,
    labelFr: `${room.fr} — reconstitution du 1005 à partir du programme-type du chapitre 363`,
  }),
)

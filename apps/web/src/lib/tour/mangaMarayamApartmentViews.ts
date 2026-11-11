import { mangaView, type MangaView } from './mangaViewModel'
import type { Vec2 } from './types'

const prefix = 'tier-1-royal-residential-sector-room-1013'
const rooms: { suffix: string; at: Vec2; target: Vec2; en: string; fr: string }[] = [
  { suffix: 'entrance', at: [0, -3.8], target: [0, -9.5], en: 'Entrance passage', fr: 'Vestibule' },
  { suffix: 'kitchen', at: [9.4, -6.4], target: [4.5, -9.6], en: 'Kitchen', fr: 'Cuisine' },
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
export const MANGA_MARAYAM_APARTMENT_VIEWS: MangaView[] = rooms.map((room) =>
  mangaView({
    id: `marayam-${room.suffix}-reconstruction`,
    spaceId: `${prefix}-${room.suffix}`,
    at: room.at,
    target: room.target,
    pitch: room.suffix === 'servants-wc' ? -0.5 : -0.12,
    chapter: 368,
    eventSequence: 2,
    volume: 35,
    pages: '2 (chapitre, coupe schématique)',
    staging: [],
    beastStaging: [{ ownerId: 'prince-marayam', omit: true }],
    label: `${room.en} — Room 1013 reconstruction — walked layout not metrically established by the chapter 368 cutaway`,
    labelFr: `${room.fr} — reconstitution du 1013 — implantation de visite non établie métriquement par la coupe du chapitre 368`,
  }),
)

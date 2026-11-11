import { mangaView, type MangaView } from './mangaViewModel'
import type { Vec2 } from './types'

const prefix = 'tier-1-royal-residential-sector-room-1014'
const rooms: { suffix: string; at: Vec2; target: Vec2; en: string; fr: string }[] = [
  { suffix: 'entrance', at: [0, -3.8], target: [0, -9.5], en: 'Entrance passage', fr: 'Vestibule' },
  {
    suffix: 'servants-wc',
    at: [-3.5, -4.6],
    target: [-1.85, -5.25],
    en: 'Staff WC',
    fr: 'WC du personnel',
  },
  {
    suffix: 'servants',
    at: [-4.7, -3.4],
    target: [-8.2, -9.1],
    en: 'Staff room',
    fr: 'Pièce du personnel',
  },
]
export const MANGA_WOBLE_APARTMENT_VIEWS: MangaView[] = rooms.map((room) =>
  mangaView({
    id: `woble-${room.suffix}-reconstruction`,
    spaceId: `${prefix}-${room.suffix}`,
    at: room.at,
    target: room.target,
    pitch: room.suffix === 'servants-wc' ? -0.5 : -0.12,
    chapter: 368,
    eventSequence: 2,
    volume: 35,
    pages: '2 (chapitre, coupe schématique)',
    staging: [],
    beastStaging: [{ ownerId: 'prince-woble', omit: true }],
    label: `${room.en} — Room 1014 reconstruction — walked layout not metrically established by the chapter 368 cutaway`,
    labelFr: `${room.fr} — reconstitution du 1014 — implantation de visite non établie métriquement par la coupe du chapitre 368`,
  }),
)

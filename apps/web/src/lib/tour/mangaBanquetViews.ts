import { mangaView as view, type MangaView } from './mangaViewModel'
import { BANQUET_SERVICE, BANQUET_SPACE } from './banquetView'

export const MANGA_BANQUET_VIEWS: MangaView[] = [
  view({
    id: 'banquet-inaugural-hall',
    spaceId: BANQUET_SPACE,
    triggerSpaceIds: [BANQUET_SERVICE],
    chapter: 359,
    volume: 34,
    at: [-1, 12],
    target: [-1, -26],
    pitch: 0.08,
    label: 'The inaugural banquet, looking between the round tables towards the royal dais',
    labelFr: 'Le banquet inaugural, entre les tables rondes face à l’estrade royale',
  }),
  view({
    id: 'banquet-royal-dais',
    spaceId: BANQUET_SPACE,
    triggerSpaceIds: [BANQUET_SERVICE],
    chapter: 359,
    volume: 34,
    at: [-1, -17.5],
    target: [-1, -23.05],
    pitch: 0.12,
    label: 'The carved royal chair and its separate curtained dais at the inaugural banquet',
    labelFr: 'Le fauteuil royal sculpté et son estrade drapée distincte au banquet inaugural',
  }),
  view({
    id: 'banquet-performance-stage',
    spaceId: BANQUET_SPACE,
    triggerSpaceIds: [BANQUET_SERVICE],
    chapter: 383,
    volume: 37,
    at: [-1, 16],
    target: [-1, 29.5],
    pitch: 0.1,
    label: 'The performance stage and light curtain, opposite the royal dais',
    labelFr: 'La scène des spectacles et son rideau clair, face à l’estrade royale',
  }),
]

import { mangaView as view, type MangaCastStaging, type MangaView } from './mangaViewModel'
import { BANQUET_SERVICE, BANQUET_SPACE } from './banquetView'
import fixture from '../../../../../data/ship/melody-concert.json'

const royalDaisStaging: readonly MangaCastStaging[] = [
  {
    characterId: 'nasubi-hui-guo-rou',
    at: [-1.0, -23.05],
    floorOffset: 0.63,
    heading: 0,
    pose: 'seated',
  },
  {
    characterId: 'prince-benjamin',
    at: [-1.3, -19.0],
    heading: 0.1,
    pose: 'idle',
  },
]

export const MANGA_BANQUET_VIEWS: MangaView[] = [
  view({
    id: 'banquet-melody-concert',
    spaceId: BANQUET_SERVICE,
    triggerSpaceIds: [BANQUET_SPACE],
    chapter: fixture.chapter,
    volume: 37,
    at: [fixture.audience.at[0], fixture.audience.at[1]],
    target: [fixture.audience.target[0], fixture.audience.target[1]],
    pitch: fixture.audience.pitch,
    label: 'Melody’s flute concert, facing the performance stage',
    labelFr: 'Le concert de flûte de Melody, face à la scène des spectacles',
  }),
  view({
    id: 'banquet-side-galleries',
    spaceId: BANQUET_SPACE,
    triggerSpaceIds: [BANQUET_SERVICE],
    chapter: 358,
    volume: 34,
    at: [-1, -3],
    target: [-13.8, -14],
    pitch: 0.14,
    label: 'The inaugural banquet galleries, panelled parapets and fluted columns',
    labelFr:
      'Les galeries du banquet inaugural, leurs parapets à panneaux et les colonnes cannelées',
  }),
  view({
    id: 'banquet-inaugural-hall',
    spaceId: BANQUET_SPACE,
    triggerSpaceIds: [BANQUET_SERVICE],
    chapter: 359,
    volume: 34,
    pages: '11–12',
    at: [-1, 12],
    target: [-1, -26],
    pitch: 0.08,
    label: 'Tier 1 — Banquet Hall: the inaugural banquet facing the royal dais',
    labelFr: 'Niveau 1 — Salle des fêtes : le banquet inaugural face à l’estrade royale',
  }),
  view({
    id: 'banquet-royal-dais',
    spaceId: BANQUET_SPACE,
    triggerSpaceIds: [BANQUET_SERVICE],
    chapter: 359,
    volume: 34,
    pages: '13',
    at: [-1, -17.5],
    target: [-1, -23.05],
    pitch: 0.12,
    label: 'King Nasubi on the royal dais and Prince Benjamin at the inaugural banquet',
    labelFr: 'Le roi Nasubi sur l’estrade royale et le prince Benjamin au banquet inaugural',
    staging: royalDaisStaging,
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

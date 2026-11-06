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
    label: 'The royal throne and the stage framing the inaugural banquet',
    labelFr: 'Le trône royal et la scène encadrant le banquet inaugural',
  }),
]

import { mangaView as view, type MangaCastStaging, type MangaView } from './mangaViewModel'
import { BENJAMIN_ROOM_SPACE } from './benjaminRoomView'

const briefing: MangaCastStaging[] = [
  { characterId: 'prince-benjamin', at: [-5.8, 4.6], heading: 0, pose: 'idle' },
  { characterId: 'balsamilco-might', at: [-4.8, -1.45], heading: Math.PI, pose: 'idle' },
  ...['furykov', 'babimyna', 'rihan', 'coventoba', 'musse', 'vincent'].map(
    (characterId, index) => ({
      characterId,
      at: [index < 3 ? -8.05 : -3.55, -0.3 + (index % 3) * 1.8] as const,
      heading: index < 3 ? -Math.PI / 2 : Math.PI / 2,
      pose: 'idle' as const,
    }),
  ),
]

const source = { spaceId: BENJAMIN_ROOM_SPACE, volume: 35 }

export const MANGA_BENJAMIN_ROOM_VIEWS: MangaView[] = [
  view({
    ...source,
    id: 'benjamin-living-guards',
    at: [-1, 4.8],
    target: [-5.8, 1.5],
    eyeHeight: 3.2,
    pitch: -0.42,
    chapter: 363,
    eventSequence: 3,
    pages: '13–14 (chapitre)',
    staging: briefing,
    label: 'Benjamin briefs his soldiers around the long table in room 1001',
    labelFr: 'Benjamin donne ses ordres aux soldats réunis autour de la longue table du 1001',
  }),
  view({
    ...source,
    id: 'benjamin-living-mural',
    at: [-8.7, 1],
    target: [-6.4, -2.54],
    pitch: 0.12,
    chapter: 363,
    eventSequence: 2,
    pages: '13 (chapitre)',
    staging: briefing.slice(0, 2),
    label: 'The framed landscape and panelled walls of Benjamin’s reception room',
    labelFr: 'Le paysage encadré et les lambris du salon de réception de Benjamin',
  }),
  view({
    ...source,
    id: 'benjamin-living-telephone',
    at: [-2.7, 3.6],
    target: [-2.2, -1.35],
    pitch: -0.03,
    chapter: 366,
    eventSequence: 1,
    pages: '16 (chapitre)',
    staging: [
      { characterId: 'prince-benjamin', at: [-5.8, -1.4], heading: Math.PI, pose: 'seated' },
      { characterId: 'balsamilco-might', at: [0.55, -1.35], heading: -Math.PI / 2, pose: 'idle' },
    ],
    label: 'Balsamilco at the wall telephone beside the panelled doorway',
    labelFr: 'Balsamilco au téléphone mural près de la porte à panneaux',
  }),
]

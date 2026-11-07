import { mangaView as view, type MangaCastStaging, type MangaView } from './mangaViewModel'
import { BENJAMIN_ROOM_SPACE } from './benjaminRoomView'

const staging: MangaCastStaging[] = [
  { characterId: 'prince-benjamin', at: [-6.0, 0.5], heading: -Math.PI / 2, pose: 'idle' },
  { characterId: 'balsamilco-might', at: [1.0, -1.2], heading: 1.5, pose: 'idle' },
  { characterId: 'furykov', at: [-1.5, 3.8], heading: -1.8, pose: 'idle' },
]

const source = {
  spaceId: BENJAMIN_ROOM_SPACE,
  volume: 35,
  staging,
}

export const MANGA_BENJAMIN_ROOM_VIEWS: MangaView[] = [
  view({
    ...source,
    id: 'benjamin-living-guards',
    at: [1.5, 4.2],
    target: [-6.0, 0.5],
    pitch: 0.02,
    chapter: 362,
    eventSequence: 1,
    pages: '46–48',
    label: "Benjamin's military address to his private guard in room 1001",
    labelFr: 'Le salon de réception de Benjamin et sa ligne de gardes au garde-à-vous',
  }),
  view({
    ...source,
    id: 'benjamin-living-mural',
    at: [-3.5, 1.2],
    target: [-8.4, -2.58],
    pitch: 0.06,
    chapter: 363,
    eventSequence: 1,
    pages: '48–50',
    label: 'Prince Benjamin standing in command before the grand military mural',
    labelFr: 'Le prince Benjamin en commandement devant le grand tableau mural',
  }),
  view({
    ...source,
    id: 'benjamin-living-telephone',
    at: [-2.0, -0.5],
    target: [1.2, -1.5],
    pitch: -0.02,
    chapter: 366,
    eventSequence: 1,
    pages: '108–110',
    label: 'Balsamilco at the command telephone monitoring dispatched guard reports',
    labelFr: 'Balsamilco au téléphone de commandement coordonnant les gardes déployés',
  }),
]

import { mangaView as view, type MangaCastStaging, type MangaView } from './mangaViewModel'
import { QUEEN_UNMA_ROOM } from './queenUnmaView'

const staging: MangaCastStaging[] = [
  {
    characterId: 'unma-hui-guo-rou',
    at: [-65.06, -36.519],
    heading: 0,
    pose: 'seated',
  },
]

const source = {
  spaceId: QUEEN_UNMA_ROOM,
  chapter: 403,
  eventSequence: 1,
  volume: 39,
  staging,
}

export const MANGA_QUEEN_UNMA_VIEWS: MangaView[] = [
  view({
    ...source,
    id: 'unma-nursery-salon',
    at: [-63.5, -32.8],
    target: [-66.5, -25.0],
    pitch: 0.04,
    pages: '10–12',
    label: 'Queen Unma in her formal salon with the nursery visible behind her',
    labelFr: 'La reine Unma dans son salon d’apparat, avec la nursery visible derrière elle',
  }),
  view({
    ...source,
    id: 'unma-salon-armchair',
    at: [-65.06, -33.2],
    target: [-65.06, -36.519],
    pitch: 0.02,
    pages: '10–12',
    label: 'Queen Unma’s carved armchair of state, side tables and panelled salon',
    labelFr: 'Le fauteuil d’apparat sculpté de la reine Unma, ses guéridons et son salon lambrissé',
  }),
  view({
    ...source,
    id: 'unma-nursery-cot',
    at: [-67.5, -26.0],
    target: [-70.429, -24.41],
    pitch: -0.05,
    pages: '11–12',
    label: 'The nursery cot with carved wooden spindles and hanging mobile',
    labelFr: 'Le berceau de la nursery à fuseaux de bois sculptés et son mobile suspendu',
  }),
]

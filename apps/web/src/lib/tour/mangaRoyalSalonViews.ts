import { mangaView as view, type MangaCastStaging, type MangaView } from './mangaViewModel'
import { ROYAL_SALON } from './royalSalonView'

const staging: MangaCastStaging[] = [
  { characterId: 'nasubi-hui-guo-rou', at: [0, -1.1], heading: 0, pose: 'seated' },
  { characterId: 'prince-halkenburg', at: [-3.2, 2.15], heading: 0, pose: 'idle' },
]
const source = { spaceId: ROYAL_SALON, chapter: 382, eventSequence: 1, volume: 37, staging }

export const MANGA_ROYAL_SALON_VIEWS: MangaView[] = [
  view({
    ...source,
    id: 'nasubi-living-mantel',
    at: [1, 4.5],
    target: [11.3, -1.9],
    pitch: 0.04,
    pages: '29–30',
    label: 'Nasubi’s salon, the side-wall battle painting and ornamented mantel',
    labelFr: 'Le salon de Nasubi, le tableau de bataille et le manteau du mur latéral',
  }),
  view({
    ...source,
    id: 'nasubi-living-landscape',
    at: [0, 5.1],
    target: [0, -8.18],
    pitch: 0.08,
    pages: '28–30',
    label: 'The King’s reclining chair facing the large framed landscape panel',
    labelFr: 'Le fauteuil de repos du roi face au grand panneau paysager encadré',
  }),
  view({
    ...source,
    id: 'nasubi-living-vault',
    at: [3.5, 4.3],
    target: [-6, -6],
    pitch: 0.3,
    pages: '29–30',
    label: 'The royal salon’s coffered barrel vault, square piers and picture walls',
    labelFr: 'La voûte à caissons du salon royal, ses piles carrées et ses murs de tableaux',
  }),
]

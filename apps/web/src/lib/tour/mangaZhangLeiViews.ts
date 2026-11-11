import { mangaView as view, type MangaCastStaging, type MangaView } from './mangaViewModel'
import { ZHANG_LEI_DINING } from './zhangLeiView'
import { MANGA_ZHANG_LEI_APARTMENT_VIEWS } from './mangaZhangLeiApartmentViews'

/** Ch. 365 pp. 16–19: human figures face +Z locally, unlike the camera's -Z. */
export const zhangLeiStaging: MangaCastStaging[] = [
  { characterId: 'prince-zhanglei', at: [3.2, -2.7], heading: Math.PI / 2, pose: 'seated' },
  { characterId: 'queen-oito', at: [8.8, -2.7], heading: -Math.PI / 2, pose: 'seated' },
  {
    characterId: 'prince-woble',
    at: [8.55, -2.7],
    heading: -Math.PI / 2,
    pose: 'held',
    floorOffset: 0.65,
  },
  { characterId: 'kurapika', at: [8.8, -1.9], heading: -Math.PI / 2, pose: 'idle' },
  { characterId: 'tenftory', at: [2.9, -4.15], heading: Math.PI / 2, pose: 'idle' },
  { characterId: 'coventoba', at: [2.9, -1.1], heading: Math.PI / 2, pose: 'idle' },
  { characterId: 'sakata', at: [3.2, -0.05], heading: Math.PI / 2, pose: 'idle' },
]
const source = {
  spaceId: ZHANG_LEI_DINING,
  chapter: 365,
  eventSequence: 1,
  volume: 35,
  staging: zhangLeiStaging,
  beastStaging: [{ ownerId: 'prince-zhanglei', at: [2.75, -2.7] as const, heading: Math.PI / 2 }],
}
export const MANGA_ZHANG_LEI_VIEWS: MangaView[] = [
  view({
    ...source,
    id: 'zhanglei-dining-audience',
    at: [9.9, -4.4],
    target: [3.2, -2.7],
    pitch: -0.03,
    pages: '16–19 (chapitre)',
    label: 'Zhang Lei receives Oito, Woble and Kurapika across the carved table',
    labelFr: 'Zhang Lei reçoit Oito, Woble et Kurapika autour de la table sculptée',
  }),
  view({
    ...source,
    id: 'zhanglei-dining-statue-credenza',
    staging: [],
    at: [5, -4.7],
    target: [1.9, -2.9],
    pitch: 0.04,
    pages: '16, 19 (chapitre)',
    label:
      'Standing sculpture, mantel clock and landscape — unpopulated inspection of the audience decor',
    labelFr:
      'Sculpture en pied, pendule et paysage — inspection du décor de l’audience sans personnages',
  }),
  view({
    ...source,
    id: 'zhanglei-dining-candelabrum',
    at: [6.5, -4.5],
    target: [5.5, -2.7],
    pitch: -0.18,
    pages: '16–19 (chapitre)',
    label: 'Two tabletop candelabra, lidded jars and cups, without an invented wine service',
    labelFr: 'Deux candélabres de table, pots à couvercle et tasses',
  }),
  ...MANGA_ZHANG_LEI_APARTMENT_VIEWS,
]

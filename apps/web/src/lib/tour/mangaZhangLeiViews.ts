import { mangaView as view, type MangaCastStaging, type MangaView } from './mangaViewModel'
import { ZHANG_LEI_DINING } from './zhangLeiView'

const staging: MangaCastStaging[] = [
  { characterId: 'prince-zhanglei', at: [3.2, -2.7], heading: -Math.PI / 2, pose: 'seated' },
  { characterId: 'queen-oito', at: [8.8, -2.7], heading: Math.PI / 2, pose: 'seated' },
  { characterId: 'kurapika', at: [8.8, -1.9], heading: Math.PI / 2, pose: 'idle' },
]

const source365 = {
  spaceId: ZHANG_LEI_DINING,
  chapter: 365,
  eventSequence: 1,
  volume: 35,
  staging,
}

const source366 = {
  spaceId: ZHANG_LEI_DINING,
  chapter: 366,
  eventSequence: 1,
  volume: 36,
  staging,
}

export const MANGA_ZHANG_LEI_VIEWS: MangaView[] = [
  view({
    ...source365,
    id: 'zhanglei-dining-audience',
    at: [2.3, -1.8],
    target: [7.5, -2.7],
    pitch: 0.02,
    pages: '10–12',
    label:
      'Zhang Lei’s formal dining room, the audience with Queen Oito across the long carved table',
    labelFr:
      'La salle à manger d’apparat de Zhang Lei, l’audience avec la reine Oito le long de la table sculptée',
  }),
  view({
    ...source365,
    id: 'zhanglei-dining-statue-credenza',
    at: [5.2, -1.2],
    target: [10.1, -4.2],
    pitch: 0.04,
    pages: '11',
    label: 'The credenza, the sculpted bust on its stand and the framed decree down the wall',
    labelFr: 'La crédence, la statue sur sellette et le décret encadré le long du mur',
  }),
  view({
    ...source366,
    id: 'zhanglei-dining-candelabrum',
    at: [7.2, -4.2],
    target: [9.8, -1.0],
    pitch: 0.08,
    pages: '7–8',
    label: 'The tall branched candelabrum illuminating the Prince’s ceremonial suite',
    labelFr: 'Le haut candélabre à branches éclairant la suite d’apparat du prince',
  }),
]

import { DINING_HALL_SPACE } from './diningHallView'
import { mangaView as view, type MangaCastStaging, type MangaView } from './mangaViewModel'

const troupeStaging: MangaCastStaging[] = [
  { characterId: 'chrollo-lucilfer', at: [28.5, 25.0], heading: 0, pose: 'idle' },
  { characterId: 'machi-komacine', at: [27.0, 24.5], heading: 0.3, pose: 'seated' },
  { characterId: 'shizuku-murasaki', at: [27.2, 25.5], heading: -0.2, pose: 'seated' },
  { characterId: 'bonolenov-ndongo', at: [30.5, 25.2], heading: -Math.PI / 2, pose: 'seated' },
  { characterId: 'nobunaga-hazama', at: [32.0, 24.0], heading: -Math.PI / 2, pose: 'idle' },
  { characterId: 'feitan-portor', at: [31.5, 25.5], heading: -Math.PI / 2, pose: 'idle' },
  { characterId: 'phinks-magcub', at: [32.0, 26.5], heading: -Math.PI / 2, pose: 'idle' },
  { characterId: 'franklin-bordeau', at: [29.5, 23.5], heading: Math.PI / 2, pose: 'seated' },
  { characterId: 'illumi', at: [28.0, 22.5], heading: Math.PI / 2, pose: 'idle' },
  { characterId: 'kalluto-zoldyck', at: [27.0, 22.8], heading: Math.PI / 2, pose: 'idle' },
]

const franklinStaging: MangaCastStaging[] = [
  {
    characterId: 'franklin-bordeau',
    at: [41.0, 12.0],
    heading: Math.PI,
    pose: 'seated',
  },
]

export const MANGA_DINING_HALL_VIEWS: MangaView[] = [
  view({
    id: 'central-dining-hall-troupe',
    spaceId: DINING_HALL_SPACE,
    at: [29.5, 17.0],
    target: [29.5, 25.0],
    pitch: -0.15,
    chapter: 377,
    volume: 36,
    pages: '105-106',
    label: 'The Phantom Troupe gathered at the central raised platform',
    labelFr: 'La Brigade Fantôme réunie sur la plateforme centrale',
    staging: troupeStaging,
  }),
  view({
    id: 'central-dining-hall-franklin',
    spaceId: DINING_HALL_SPACE,
    at: [38.5, 12.0],
    target: [41.0, 12.0],
    pitch: -0.05,
    chapter: 380,
    volume: 36,
    pages: '158',
    label: 'Franklin waiting alone for Hisoka with his hands ready at the dining table',
    labelFr: 'Franklin attendant seul Hisoka les mains prêtes à la table du réfectoire',
    staging: franklinStaging,
  }),
  view({
    id: 'central-dining-hall-catwalk',
    spaceId: DINING_HALL_SPACE,
    at: [23.5, 13.5],
    target: [29.75, 26.0],
    pitch: -0.42,
    eyeHeight: 7.2,
    chapter: 371,
    volume: 36,
    pages: '14-15',
    label: 'Overhead view of the crowded Tier 5 refectory from the steel trusses',
    labelFr: 'Vue plongeante sur le réfectoire bondé du niveau 5 depuis les fermes métalliques',
  }),
  view({
    id: 'central-dining-hall-ch378-service',
    spaceId: DINING_HALL_SPACE,
    at: [20.0, 39.0],
    target: [15.5, 24.0],
    pitch: -0.32,
    eyeHeight: 5.2,
    chapter: 378,
    volume: 36,
    pages: '121',
    label: 'High-angle view of the continuous service counter, menu boards and queuing crowd',
    labelFr: 'Vue plongeante sur le comptoir de service, les panneaux de menu et la foule',
  }),
]

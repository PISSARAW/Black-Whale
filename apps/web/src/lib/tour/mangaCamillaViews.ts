import { mangaView as view, type MangaCastStaging, type MangaView } from './mangaViewModel'
import {
  CAMILLA_DINING,
  CAMILLA_ENTRANCE,
  CAMILLA_LIVING,
} from './camillaView'

const untouchablesStaging: MangaCastStaging[] = [
  { characterId: 'lisamsetta', at: [-8.2, 0.2], heading: Math.PI / 2, pose: 'seated' },
  { characterId: 'meshush', at: [-8.2, 1.8], heading: Math.PI / 2, pose: 'seated' },
  { characterId: 'mozbe', at: [-8.2, 3.4], heading: Math.PI / 2, pose: 'seated' },
  { characterId: 'sarahell', at: [-3.8, 4.7], heading: Math.PI, pose: 'seated' },
  { characterId: 'umanma', at: [-1.2, 4.7], heading: Math.PI, pose: 'seated' },
  { characterId: 'fukataki', at: [1.4, 4.7], heading: Math.PI, pose: 'seated' },
  { characterId: 'kako', at: [4.0, 4.7], heading: Math.PI, pose: 'seated' },
  { characterId: 'prince-camilla', at: [-5.5, 2.0], heading: 0, pose: 'seated' },
]

const couchStaging: MangaCastStaging[] = [
  { characterId: 'prince-camilla', at: [-5.5, 2.0], heading: 0, pose: 'seated' },
]

const diningStaging: MangaCastStaging[] = [
  { characterId: 'prince-camilla', at: [4.65, -2.7], heading: Math.PI / 2, pose: 'seated' },
  { characterId: 'duazul-hui-guo-rou', at: [7.35, -2.7], heading: -Math.PI / 2, pose: 'seated' },
]

const musseStaging: MangaCastStaging[] = [
  { characterId: 'musse', at: [0.4, -5.88], heading: 0, pose: 'seated' },
]

export const MANGA_CAMILLA_VIEWS: MangaView[] = [
  view({
    id: 'camilla-untouchables-circle',
    spaceId: CAMILLA_LIVING,
    chapter: 389,
    volume: 37,
    staging: untouchablesStaging,
    at: [-0.5, -1.8],
    target: [-0.5, 3.5],
    pitch: -0.05,
    label: 'The Have-Not guards seated in a circle along the salon walls around Camilla',
    labelFr: 'Les gardes Intouchables réunis en cercle le long des murs du salon autour de Camilla',
  }),
  view({
    id: 'camilla-massage-couch',
    spaceId: CAMILLA_LIVING,
    chapter: 389,
    volume: 37,
    staging: couchStaging,
    at: [-3.0, 2.0],
    target: [-5.5, 2.0],
    pitch: -0.06,
    label: 'Princess Camilla reclining on her carved state chaise-longue',
    labelFr: 'La princesse Camilla trônant sur sa méridienne d’apparat sculptée',
  }),
  view({
    id: 'camilla-duazul-dining',
    spaceId: CAMILLA_DINING,
    chapter: 366,
    volume: 36,
    staging: diningStaging,
    at: [6.0, -4.6],
    target: [6.0, -2.7],
    pitch: -0.06,
    label: 'Princess Camilla and Queen Duazul dining in the private royal dining room',
    labelFr: 'La princesse Camilla et la reine Duazul dînant dans la salle à manger privée',
  }),
  view({
    id: 'musse-surveillance-post',
    spaceId: CAMILLA_ENTRANCE,
    chapter: 366,
    volume: 36,
    staging: musseStaging,
    at: [0.4, -4.8],
    target: [0.4, -6.5],
    pitch: -0.05,
    label: 'Musse stationed at his surveillance desk and telephone post in the entrance passage',
    labelFr: 'Musse posté à son bureau de surveillance et téléphone d’écoute dans le vestibule d’entrée',
  }),
]

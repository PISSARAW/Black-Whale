import { mangaView as view, type MangaCastStaging, type MangaView } from './mangaViewModel'
import { ROYAL_ARMY_CONFERENCE_ROOM } from './royalArmyConferenceView'

const mizaistomBriefingStaging: MangaCastStaging[] = [
  {
    characterId: 'mizaistom-nana',
    at: [0.8, -3.25],
    heading: Math.PI,
    pose: 'idle',
  },
]

export const MANGA_ROYAL_ARMY_CONFERENCE_VIEWS: MangaView[] = [
  view({
    id: 'royal-army-briefing-audience',
    spaceId: ROYAL_ARMY_CONFERENCE_ROOM,
    at: [0, 6.2],
    target: [0, -5.2],
    pitch: 0.05,
    chapter: 380,
    volume: 36,
    pages: '189',
    label: 'The royal-army briefing from behind the U-shaped conference table',
    labelFr: 'Le briefing de l’armée royale derrière la table de conférence en U',
    staging: mizaistomBriefingStaging,
  }),
  view({
    id: 'royal-army-lectern-stage',
    spaceId: ROYAL_ARMY_CONFERENCE_ROOM,
    at: [0, 1.0],
    target: [-0.75, -3.25],
    pitch: 0.04,
    chapter: 380,
    volume: 36,
    pages: '189',
    label: 'The speaker lectern on the presentation dais in front of the screen',
    labelFr: 'Le pupitre d’exposé sur l’estrade devant le grand écran de projection',
    staging: mizaistomBriefingStaging,
  }),
  view({
    id: 'royal-army-tactical-maps',
    spaceId: ROYAL_ARMY_CONFERENCE_ROOM,
    at: [-5.5, -3.0],
    target: [-9.88, -3.0],
    pitch: 0.0,
    chapter: 380,
    volume: 36,
    pages: '189',
    label: 'The ship tactical chart board mounted on the briefing room wall',
    labelFr: 'Le tableau mural des cartes tactiques et plans de ponts du navire',
  }),
  view({
    id: 'royal-army-u-table-command',
    spaceId: ROYAL_ARMY_CONFERENCE_ROOM,
    at: [0, 6.2],
    target: [0, 0.5],
    eyeHeight: 4.2,
    pitch: -0.55,
    chapter: 350,
    volume: 34,
    pages: '124–126',
    label: 'The U-shaped military command table surrounded by 15 conference seats',
    labelFr: 'La table de commandement militaire en U entourée de ses 15 sièges de conférence',
  }),
]

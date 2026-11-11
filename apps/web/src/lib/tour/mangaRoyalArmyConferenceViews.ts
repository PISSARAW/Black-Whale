import { mangaView as view, type MangaCastStaging, type MangaView } from './mangaViewModel'
import { ROYAL_ARMY_CONFERENCE_ROOM } from './royalArmyConferenceView'

const staging: MangaCastStaging[] = [
  {
    characterId: 'mizaistom-nana',
    at: [0.5, -5.1],
    floorOffset: 0.16,
    heading: 0,
    pose: 'idle',
  },
]
const source = { spaceId: ROYAL_ARMY_CONFERENCE_ROOM, chapter: 380, volume: 36, eventSequence: 1 }

export const MANGA_ROYAL_ARMY_CONFERENCE_VIEWS: MangaView[] = [
  view({
    ...source,
    id: 'royal-army-briefing-audience',
    at: [0, 7.05],
    target: [0, -4.7],
    eyeHeight: 4.2,
    pitch: -0.55,
    pages: '1–2 (chapitre)',
    staging,
    label:
      'The committee U opens towards Mizaistom; audience rows behind it — elevated panel composition',
    labelFr:
      'Le U du comité s’ouvre vers Mizaistom ; rangées du public derrière — cadrage surélevé de la case',
  }),
  view({
    ...source,
    id: 'royal-army-lectern-stage',
    at: [0, -2.8],
    target: [-1.1, -5.3],
    pitch: 0.02,
    pages: '1, 6 (chapitre)',
    staging,
    label: 'The small plain lectern beside the speaker and blank screen',
    labelFr: 'Le petit pupitre sobre à côté de l’orateur et de l’écran blanc',
  }),
  view({
    ...source,
    id: 'royal-army-tactical-maps',
    at: [-5.2, -3.4],
    target: [-5.2, -7.25],
    pitch: 0.04,
    pages: '1 (chapitre)',
    staging: [],
    label: 'The smaller blank presentation board — no tactical map is legible in the panel',
    labelFr: 'Le petit tableau de présentation vierge — aucune carte tactique lisible dans la case',
  }),
  view({
    ...source,
    id: 'royal-army-u-table-command',
    at: [-6.5, -3.5],
    target: [0, 0.7],
    eyeHeight: 4.4,
    pitch: -0.5,
    pages: '6 (chapitre)',
    staging: [],
    label: 'The pale U-shaped table and simple framed chairs, open towards the dais',
    labelFr: 'La table claire en U et les chaises à cadre simple, ouvertes vers l’estrade',
  }),
  view({
    ...source,
    id: 'royal-army-briefing-decor',
    at: [0, 7.05],
    target: [0, -4.7],
    eyeHeight: 4.2,
    pitch: -0.55,
    pages: '1–3, 6 (chapitre)',
    staging: [],
    label: 'Empty decor inspection: tiled floor, committee U, audience rows and blank screen',
    labelFr:
      'Inspection sans occupants : sol quadrillé, U du comité, rangées du public et écran blanc',
  }),
]

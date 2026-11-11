import { mangaView as view, type MangaCastStaging, type MangaView } from './mangaViewModel'
import { POLICE_ATRIUM, POLICE_SAFETY } from './policeStationView'

const atriumStaging: MangaCastStaging[] = [
  { characterId: 'mizaistom-nana', at: [1.2, -3.8], heading: 0.2, pose: 'idle' },
]

const safetyStaging: MangaCastStaging[] = [
  { characterId: 'mizaistom-nana', at: [-5.5, -12.15], heading: Math.PI, pose: 'idle' },
]

export const MANGA_POLICE_VIEWS: MangaView[] = [
  view({
    id: 'police-atrium-double-page',
    spaceId: POLICE_ATRIUM,
    volume: 36,
    chapter: 378,
    eventSequence: 1,
    pages: '124–125',
    at: [0, -9.0],
    target: [0, 4.4],
    pitch: 0.1,
    eyeHeight: 1.7,
    staging: atriumStaging,
    label: 'Monumental 4-tier atrium of the Central Police Station and central stepped fountain',
    labelFr: "L'atrium monumental sur 4 étages de galeries et la fontaine centrale à gradins",
  }),
  view({
    id: 'police-atrium-fountain',
    spaceId: POLICE_ATRIUM,
    volume: 36,
    chapter: 378,
    eventSequence: 2,
    pages: '126–127',
    at: [2.5, -1.2],
    target: [0, -2.5],
    pitch: -0.05,
    staging: atriumStaging,
    label: 'Stepped central fountain with Mizaistom Nana supervising Tier 3 security',
    labelFr: 'La fontaine à gradins et Mizaistom Nana supervisant la sécurité du Niveau 3',
  }),
  view({
    id: 'police-marquee-entrance',
    spaceId: POLICE_ATRIUM,
    volume: 36,
    chapter: 378,
    eventSequence: 3,
    pages: '125',
    at: [0, 1.2],
    target: [0, 4.8],
    pitch: 0.22,
    staging: atriumStaging,
    label: 'Entrance facade with iron marquee and official hanging police signs',
    labelFr: "Façade d'entrée sous la marquise en fer forgé et enseignes suspendues de la police",
  }),
  view({
    id: 'police-safety-desk',
    spaceId: POLICE_SAFETY,
    volume: 34,
    chapter: 350,
    eventSequence: 1,
    pages: '18–19',
    at: [-5.5, -10.55],
    target: [-5.5, -13.65],
    pitch: -0.12,
    staging: safetyStaging,
    label: 'Compact interview office of the Community Safety Section',
    labelFr: "Bureau d'entretien compact de la section de sécurité publique",
  }),
]

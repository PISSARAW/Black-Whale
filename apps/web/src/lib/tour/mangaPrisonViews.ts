import { mangaView as view, type MangaCastStaging } from './mangaViewModel'
import { BEYOND_CELL, BEYOND_WATCH } from './prisonView'

const staging: MangaCastStaging[] = [
  {
    characterId: 'beyond-netero',
    spaceId: BEYOND_CELL,
    at: [-2.45, 0.6],
    heading: Math.PI / 2,
    pose: 'reclined',
    floorOffset: 0.585,
  },
  {
    characterId: 'kanzai',
    spaceId: BEYOND_WATCH,
    at: [1.5, 1.3],
    heading: -2.9,
    pose: 'cross-legged',
    floorOffset: 0.25,
  },
  {
    characterId: 'saiyu',
    spaceId: BEYOND_WATCH,
    at: [1.8, -0.8],
    heading: 0.2,
    pose: 'cross-legged',
  },
  {
    characterId: 'saccho-kobayakawa',
    spaceId: BEYOND_WATCH,
    at: [2.35, 0],
    heading: -Math.PI / 2,
    pose: 'cross-legged',
  },
]

export const MANGA_PRISON_VIEWS = [
  view({
    id: 'beyond-cell-bars',
    spaceId: BEYOND_WATCH,
    at: [3.5, 0],
    target: [-2.45, 0.6],
    pitch: -0.1,
    eyeHeight: 1.6,
    chapter: 359,
    volume: 34,
    staging,
    label: 'The Zodiac watch facing Beyond’s bunk through the barred front',
    labelFr: 'La veille des Zodiaques face à la couchette de Beyond, à travers les barreaux',
    triggerSpaceIds: [BEYOND_CELL],
  }),
  view({
    id: 'beyond-cell-restraint',
    spaceId: BEYOND_CELL,
    at: [-1.7, -1.2],
    target: [-2.5, 0.6],
    pitch: -0.14,
    eyeHeight: 1.45,
    chapter: 359,
    volume: 34,
    staging,
    label: 'Beyond’s pillow, bolted restraint plate and short chain',
    labelFr: 'L’oreiller de Beyond, la platine boulonnée et sa courte chaîne',
    triggerSpaceIds: [BEYOND_WATCH],
  }),
  view({
    id: 'beyond-cell-aerial-plan',
    spaceId: BEYOND_WATCH,
    at: [0, 0],
    target: [0, -1],
    pitch: -1.5,
    eyeHeight: 7.5,
    chapter: 359,
    volume: 34,
    staging,
    label: 'Reconstructed plan of the cell and Zodiac watch, based on chapter 359',
    labelFr:
      'Plan reconstruit de la cellule et de la veille des Zodiaques, d’après le chapitre 359',
    triggerSpaceIds: [BEYOND_CELL],
  }),
]

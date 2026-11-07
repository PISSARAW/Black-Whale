import { mangaView as view, type MangaView } from './mangaViewModel'
import {
  HEILLY_COMMUNAL,
  HEILLY_LAUNDRY,
  HEILLY_OFFICE,
  HEILLY_PROCESSING,
} from './heillyHideoutView'

export const MANGA_HEILLY_VIEWS: MangaView[] = [
  view({
    id: 'heilly-processing-room',
    spaceId: HEILLY_PROCESSING,
    at: [-13.14, -10.8],
    target: [-13.5, -6.65],
    pitch: 0.04,
    chapter: 398,
    volume: 38,
    label: 'The white-tiled execution room, Nen wall barrier and seven doors',
    labelFr: 'La salle d’exécution carrelée de blanc, sa barrière de Nen et ses sept portes',
  }),
  view({
    id: 'heilly-laundry-disposal',
    spaceId: HEILLY_LAUNDRY,
    at: [-12.8, 0.8],
    target: [-17.35, 3.6],
    pitch: 0.05,
    chapter: 399,
    volume: 38,
    label: 'The industrial washers and dryers of the disposal room',
    labelFr: 'Les lave-linge et sèche-linge industriels de la salle d’élimination',
  }),
  view({
    id: 'heilly-communal-table',
    spaceId: HEILLY_COMMUNAL,
    at: [0.53, 2.0],
    target: [0.53, 5.25],
    pitch: 0.06,
    chapter: 399,
    volume: 38,
    label: 'The long communal table and surveillance monitor bank',
    labelFr: 'La grande table de réunion et le mur d’écrans de surveillance',
  }),
  view({
    id: 'morena-office-negotiation-game',
    spaceId: HEILLY_OFFICE,
    at: [14.4, 0.55],
    target: [11.9, 6.45],
    pitch: -0.02,
    chapter: 407,
    volume: 39,
    label: 'Morena’s negotiation table between the wall couch and the two consoles',
    labelFr: 'La table de négociation de Morena entre le canapé mural et les deux consoles',
    staging: [
      {
        characterId: 'morena-prudo',
        at: [12.08, 1.6],
        heading: 0,
        pose: 'seated',
      },
      {
        characterId: 'borksen',
        at: [12.08, 3.7],
        heading: Math.PI,
        pose: 'seated',
      },
    ],
  }),
]

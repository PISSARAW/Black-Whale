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
    at: [-13.14, -11.55],
    target: [-13.14, -6.65],
    pitch: 0.02,
    chapter: 398,
    volume: 38,
    label: 'The grimy tiled processing room, four far-wall doors and coiled service hose',
    labelFr:
      'La salle de traitement carrelée et souillée, ses quatre portes au fond et son flexible enroulé',
    staging: [
      {
        characterId: 'tassi',
        at: [-13.35, -8.75],
        heading: 0,
        pose: 'idle',
      },
    ],
  }),
  view({
    id: 'heilly-laundry-disposal',
    spaceId: HEILLY_LAUNDRY,
    at: [-13.14, 0.05],
    target: [-13.14, 4.25],
    pitch: 0.02,
    chapter: 394,
    volume: 38,
    label: 'The disposal room: body tray, processing tanks, bag racks and hanging work cloths',
    labelFr:
      'La salle d’élimination : table mortuaire, cuves, rayonnages de sacs et linge suspendu',
    staging: [
      {
        characterId: 'terebellum',
        at: [-13.18, 1.1],
        heading: Math.PI,
        pose: 'idle',
      },
      {
        characterId: 'montblanc-toto',
        at: [-15.05, 4.54],
        heading: Math.PI,
        pose: 'idle',
      },
      {
        characterId: 'chiffon-toto',
        at: [-11.95, 4.52],
        heading: Math.PI,
        pose: 'idle',
      },
    ],
  }),
  view({
    id: 'heilly-communal-table',
    spaceId: HEILLY_COMMUNAL,
    at: [0.53, 2.0],
    target: [0.53, 5.25],
    pitch: 0.06,
    chapter: 399,
    volume: 38,
    pages: '170–175',
    staging: [
      { characterId: 'terebellum', at: [-1.75, 3.35], heading: 0, pose: 'seated' },
      { characterId: 'orarge', at: [-0.25, 7.15], heading: Math.PI, pose: 'seated' },
      { characterId: 'souffle', at: [1.25, 7.15], heading: Math.PI, pose: 'seated' },
      { characterId: 'gelato', at: [2.75, 7.15], heading: Math.PI, pose: 'seated' },
      { characterId: 'voconte', at: [-0.25, 3.35], heading: 0, pose: 'seated' },
      { characterId: 'montblanc-toto', at: [1.25, 3.35], heading: 0, pose: 'seated' },
      { characterId: 'chiffon-toto', at: [2.75, 3.35], heading: 0, pose: 'seated' },
      { characterId: 'perigord', at: [-3.22, 5.35], heading: Math.PI / 2, pose: 'seated' },
      { characterId: 'hinrigh-biganduffno', at: [2.58, 1.17], heading: -0.35, pose: 'idle' },
      { characterId: 'nobunaga-hazama', at: [3.8, 1.29], heading: -0.45, pose: 'idle' },
    ],
    label: 'The lived-in communal area: long table, bookcase and open kitchenette',
    labelFr: 'La salle commune habitée : grande table, bibliothèque et kitchenette ouverte',
  }),
  view({
    id: 'morena-office-negotiation-game',
    spaceId: HEILLY_OFFICE,
    at: [14.4, 0.55],
    target: [12.08, 5.4],
    eyeHeight: 3.2,
    pitch: -0.32,
    chapter: 407,
    volume: 39,
    label: 'Morena’s striped desk facing the central sofa and panelled audience doors',
    labelFr: 'Le bureau rayé de Morena face au canapé central et aux portes moulurées',
    staging: [
      {
        characterId: 'morena-prudo',
        at: [12.08, 1.6],
        heading: 0,
        pose: 'seated',
      },
      {
        characterId: 'borksen',
        at: [12.08, 3.72],
        heading: Math.PI,
        pose: 'seated',
      },
    ],
  }),
]

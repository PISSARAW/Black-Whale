import { mangaView as view, type MangaView } from './mangaViewModel'
import { VVIP_RECREATION_HALL } from './vvipRecreationView'

export const MANGA_VVIP_RECREATION_VIEWS: MangaView[] = [
  view({
    id: 'vvip-recreation-double-staircase',
    spaceId: VVIP_RECREATION_HALL,
    at: [41.0, -26.5],
    target: [41.0, -42.0],
    pitch: 0.08,
    chapter: 419,
    pages: '18',
    label: 'Grand VVIP recreation hall facing the symmetric double stairs and upper gallery',
    labelFr:
      'Grande salle de loisirs VVIP face au double escalier symétrique et à la galerie supérieure',
    triggerSpaceIds: ['tier-1-vvip-recreation-gallery'],
  }),
  view({
    id: 'vvip-recreation-mezzanine-balcony',
    spaceId: VVIP_RECREATION_HALL,
    at: [41.0, -48.5],
    target: [41.0, -35.0],
    pitch: -0.28,
    eyeHeight: 4.4,
    chapter: 419,
    pages: '18',
    label: 'High-angle view from the upper mezzanine over the billiards tables and grand hall',
    labelFr:
      'Vue plongeante depuis la mezzanine supérieure sur les tables de billard et le grand hall',
    triggerSpaceIds: ['tier-1-vvip-recreation-gallery'],
  }),
  view({
    id: 'vvip-recreation-tserriednich-transit',
    spaceId: VVIP_RECREATION_HALL,
    at: [38.0, -36.0],
    target: [41.0, -46.0],
    pitch: 0.0,
    chapter: 419,
    pages: '17–18',
    label: 'Prince Tserriednich traversing the VVIP leisure district during martial lockdown',
    labelFr:
      'Le Prince Tserriednich traversant la salle de loisirs VVIP lors du confinement militaire',
    staging: [
      {
        characterId: 'prince-tserriednich',
        at: [41.0, -43.0],
        heading: 0,
        pose: 'idle',
      },
    ],
  }),
]

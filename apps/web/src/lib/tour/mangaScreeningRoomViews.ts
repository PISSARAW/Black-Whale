import { mangaView as view, type MangaView } from './mangaViewModel'

export const MANGA_SCREENING_ROOM_VIEWS: MangaView[] = [
  view({
    id: 'screening-room-overview',
    spaceId: 'tier-2-screening-room',
    at: [-12.0, 29.75],
    target: [-79.0, 29.75],
    pitch: 0.05,
    chapter: 359,
    volume: 34,
    label: 'Screening room overview — monumental proscenium stage, lateral boxes, and screen',
    labelFr:
      "Vue d'ensemble de la salle de projection — scène monumentale à proscénium, loges latérales et écran",
  }),
  view({
    id: 'screening-room-stage-proscenium',
    spaceId: 'tier-2-screening-room',
    at: [-75.0, 22.0],
    target: [-82.0, 20.0],
    pitch: 0.06,
    chapter: 359,
    volume: 34,
    label: 'The raised stage, briefing lectern, and illuminated projection screen',
    labelFr: "L'estrade surélevée, le pupitre de briefing et l'écran de projection illuminé",
  }),
  view({
    id: 'screening-room-vip-box',
    spaceId: 'tier-2-screening-room',
    at: [-62.0, 8.6],
    target: [-75.0, 29.75],
    pitch: -0.14,
    eyeHeight: 5.6,
    chapter: 359,
    volume: 34,
    label: 'View from the elevated private VIP boxes over the stalls and proscenium',
    labelFr: 'Vue plongeante depuis les loges privatives VIP sur le parterre et le proscénium',
  }),
  view({
    id: 'screening-room-stage-looking-back',
    spaceId: 'tier-2-screening-room',
    at: [-78.5, 16.5],
    target: [-12.0, 29.75],
    pitch: 0.02,
    eyeHeight: 2.7,
    chapter: 359,
    volume: 34,
    label: 'View from the stage lectern facing the raked stalls, chandeliers, and projection booth',
    labelFr:
      'Vue depuis le pupitre de scène face aux gradins, aux lustres et à la cabine de projection',
  }),
]

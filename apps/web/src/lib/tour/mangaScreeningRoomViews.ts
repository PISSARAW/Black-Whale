import { mangaView as view, type MangaView } from './mangaViewModel'

export const MANGA_SCREENING_ROOM_VIEWS: MangaView[] = [
  view({
    id: 'screening-room-overview',
    spaceId: 'tier-2-screening-room',
    at: [-48.0, 29.75],
    target: [-81.5, 29.75],
    pitch: 0.08,
    chapter: 359,
    volume: 34,
    label:
      'Screening room overview — supplied-panel framing of the proscenium, lateral boxes, and screen',
    labelFr:
      "Vue d'ensemble de la salle de projection — cadrage de la case sur le proscénium, les loges latérales et l'écran",
  }),
  view({
    id: 'screening-room-stage-proscenium',
    spaceId: 'tier-2-screening-room',
    at: [-75.0, 22.0],
    target: [-82.0, 20.0],
    pitch: 0.06,
    chapter: 359,
    volume: 34,
    label: 'The raised stage, pleated backdrop and projection screen',
    labelFr: "L'estrade surélevée, le rideau plissé et l'écran de projection",
  }),
  view({
    id: 'screening-room-vip-box',
    spaceId: 'tier-2-screening-room',
    at: [-62.0, 8.6],
    target: [-75.0, 29.75],
    pitch: -0.14,
    eyeHeight: 6.2,
    chapter: 359,
    volume: 34,
    label: 'Upper gallery overlooking the stalls and proscenium (reconstructed framing)',
    labelFr: 'Galerie haute, vue sur le parterre et le cadre de scène (cadrage reconstitué)',
  }),
  view({
    id: 'screening-room-stage-looking-back',
    spaceId: 'tier-2-screening-room',
    at: [-79.0, 40.0],
    target: [-12.0, 29.75],
    pitch: 0.02,
    eyeHeight: 3.0,
    chapter: 359,
    volume: 34,
    label:
      'View from the stage facing the rows of seats and side galleries (reconstructed framing)',
    labelFr:
      'Vue depuis le plateau face aux rangées de sièges et aux galeries (cadrage reconstitué)',
  }),
]

import { mangaView as view, type MangaCastStaging, type MangaView } from './mangaViewModel'
import { BURIAL_SPACE } from './burialChamberView'

const staging: MangaCastStaging[] = [
  { characterId: 'nasubi-hui-guo-rou', at: [2.75, 7.87], heading: -2.8, pose: 'idle' },
]

const source = {
  spaceId: BURIAL_SPACE,
  chapter: 371,
  volume: 36,
  eventSequence: 1,
  staging,
}

export const MANGA_BURIAL_CHAMBER_VIEWS: MangaView[] = [
  view({
    ...source,
    id: 'princes-burial-chamber-overhead',
    at: [0, 0],
    target: [0.01, 0.01],
    pitch: -1.57,
    eyeHeight: 28,
    pages: '18–19',
    label: 'The 14 radial coffins, central apparatus and ritual labyrinth floor',
    labelFr: 'Les 14 cercueils en rayon, l’appareil central et le sol en labyrinthe rituel',
  }),
  view({
    ...source,
    id: 'burial-rotunda-caskets',
    at: [0, -8.2],
    target: [1.8, 7.87],
    pitch: 0.06,
    pages: '18–20',
    label: 'The fourteen radial caskets of the succession-war burial chamber',
    labelFr: 'Les quatorze cercueils en rayon de la chambre funéraire de la succession',
  }),
  view({
    ...source,
    id: 'burial-nasubi-momoze-coffin',
    at: [0.9, 6.0],
    target: [2.75, 7.87],
    pitch: 0.08,
    eyeHeight: 1.5,
    pages: '20–21',
    label: 'King Nasubi standing at Momoze’s coffin: “My daughter is still alive...”',
    labelFr: 'Le roi Nasubi au chevet du cercueil de Momoze : « Ma fille est toujours en vie... »',
  }),
]

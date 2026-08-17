import { mangaView as view, type MangaView } from './mangaViewModel'

export const MANGA_OBSERVATION_DECK_VIEWS: MangaView[] = [
  view({
    id: 'observation-deck-illumi-kalluto',
    spaceId: 'tier-3-observation-deck',
    at: [-143, 10],
    target: [-149, -10],
    pitch: 0,
    chapter: 380,
    volume: 36,
    label: 'The Zodiacs and Royal Army confront Illumi and Kalluto at the observation deck',
    labelFr: 'Les Zodiaques et l’armée royale confrontent Illumi et Kalluto au poste d’observation',
    staging: [
      {
        characterId: 'illumi-zoldyck',
        at: [-150, -5],
        heading: Math.PI / 2,
        pose: 'idle',
      },
      {
        characterId: 'botobai-gigante',
        at: [-148, -10],
        heading: -Math.PI / 2,
        pose: 'idle',
      },
    ],
  }),
  view({
    id: 'observation-deck-panorama',
    spaceId: 'tier-3-observation-deck',
    at: [-147, 0],
    target: [-160, 0],
    pitch: -0.05,
    chapter: 380,
    volume: 36,
    label: 'Panoramic view of the container city from the observation deck window',
    labelFr: 'Vue panoramique sur la ville-conteneur depuis la baie vitrée du poste d’observation',
  }),
]

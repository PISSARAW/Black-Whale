import type { ApparitionKind } from '../../src/lib/tour/apparitions'
import type { TwinCostume } from '../../src/lib/tour/mangaTwinWardrobe'
import type { HumanPose } from '../../src/lib/tour/humanAnimation'

export type Point = [number, number, number]

export interface Actor {
  id: string
  position: Point
  heading?: number
  pose?: HumanPose
  royalCostume?: TwinCostume
  gesture?: 'toast' | 'floor-lounge' | 'bed-lounge' | 'play' | 'raise' | 'cradle' | 'door-reveal'
}

export interface Guardian {
  kind: ApparitionKind
  position: Point
  size: number
  stage?: number
  heading?: number
}

export interface Shot {
  name: string
  room: 'living' | 'dining' | 'bedroom'
  label: string
  source: string
  camera: Point
  target: Point
  fov?: number
  actors: Actor[]
  beasts?: Guardian[]
}

const prince = (id: string, position: Point, options: Partial<Actor> = {}): Actor => ({
  id: 'prince-' + id,
  position,
  ...options,
})

// Coordinates use the existing apartment plans. Heights are relative to the room floor.
export const shots: Shot[] = [
  {
    name: 'Benjamin',
    room: 'living',
    label: 'Salon de commandement',
    source: '362 · p. 7',
    camera: [-2.89, 1.46, 5.35],
    target: [-2.89, 1.82, 1.25],
    fov: 42,
    actors: [prince('benjamin', [-2.89, 0, 2.34])],
    beasts: [{ kind: 'benjamin-guardian', position: [-2.89, 1.21, 1.51], size: 0.75 }],
  },
  {
    name: 'Camilla',
    room: 'living',
    label: 'Salon de réception',
    source: '362 · p. 6',
    camera: [-3.2, 1.61, 5.3],
    target: [-4.25, 1.79, 0.21],
    fov: 40,
    actors: [prince('camilla', [-3.55, 0, 1.8], { heading: 0.22 })],
    beasts: [{ kind: 'medusa', position: [-4.77, 2.39, 0.37], size: 0.87, heading: 0.16 }],
  },
  {
    name: 'Zhang Lei',
    room: 'dining',
    label: 'Salle à manger',
    source: '362 · p. 6',
    camera: [6.9, 1.4, -1.3],
    target: [2.95, 1.59, -2.65],
    fov: 43,
    actors: [
      prince('zhanglei', [3.24, 0.07, -2.48], { heading: 1.0, pose: 'seated', gesture: 'toast' }),
    ],
    beasts: [{ kind: 'wheel', position: [2.12, 1.77, -2.02], size: 1.03, heading: 1.24 }],
  },
  {
    name: 'Tserriednich',
    room: 'living',
    label: 'Salon privé',
    source: '362 · p. 4',
    camera: [-3.05, 1.42, 5.2],
    target: [-1.95, 1.34, -0.43],
    fov: 45,
    actors: [prince('tserriednich', [-3.7, 0, 1.13], { heading: 0.14 })],
    beasts: [{ kind: 'chimera', position: [-1.11, 0, 0.76], size: 0.92, heading: -0.64 }],
  },
  {
    name: 'Tubeppa',
    room: 'living',
    label: 'Salon de travail',
    source: '362 · p. 4',
    camera: [6.1, 1.57, 5.3],
    target: [5.65, 1.43, 1.23],
    fov: 44,
    actors: [prince('tubeppa', [7.09, 0, 1.96], { heading: 2.35, gesture: 'raise' })],
    beasts: [{ kind: 'toad', position: [4.45, 1.04, 1.57], size: 1.03, heading: 0.42 }],
  },
  {
    name: 'Tyson',
    room: 'living',
    label: 'Salon de réception',
    source: '362 · p. 13 / 375 · p. 2',
    camera: [-5.98, 1.5, 5.14],
    target: [-5.98, 1.64, 0.62],
    fov: 42,
    actors: [prince('tyson', [-5.98, 0.15, 1.5], { pose: 'seated' })],
    beasts: [
      { kind: 'tyson-guardian', position: [-5.95, 2.32, 0.18], size: 0.7 },
      { kind: 'wog', position: [-7.12, 1.53, 2], size: 0.15 },
      { kind: 'wog', position: [-5.13, 1.88, 2], size: 0.14 },
      { kind: 'wog', position: [-6.7, 2.04, 0.64], size: 0.12 },
    ],
  },
  {
    name: 'Luzurus',
    room: 'living',
    label: 'Salon du narguilé',
    source: '362 · p. 12',
    camera: [-0.35, 0.9, 2.7],
    target: [3.6, 1.12, 2.02],
    fov: 47,
    actors: [
      prince('luzurus', [2.81, 0, 1.89], {
        heading: -1.02,
        gesture: 'floor-lounge',
      }),
    ],
    beasts: [{ kind: 'centipede', position: [5.5, 1.78, 1.82], size: 0.78, heading: 2.83 }],
  },
  {
    name: 'Salé-salé',
    room: 'bedroom',
    label: 'Chambre de réception',
    source: '362 · p. 14',
    camera: [-1.53, 1.78, 6.07],
    target: [-4.1, 1.7, 8.52],
    fov: 48,
    actors: [
      prince('salesale', [-4.32, 0.86, 8.39], {
        heading: 2.73,
        gesture: 'bed-lounge',
      }),
    ],
    beasts: [
      { kind: 'mouths', position: [-5.07, 2.83, 9.3], size: 0.68, heading: 2.4 },
      { kind: 'fume', position: [-5.4, 2.57, 8.75], size: 0.3 },
      { kind: 'fume', position: [-3.5, 2.63, 9.2], size: 0.27 },
    ],
  },
  {
    name: 'Halkenburg',
    room: 'living',
    label: 'Salon des bibliothèques',
    source: '361 · p. 21',
    camera: [4.5, 1.52, 5.5],
    target: [4.5, 1.89, 1.25],
    fov: 43,
    actors: [prince('halkenburg', [4.5, 0, 2.15])],
    beasts: [{ kind: 'halkenburg-guardian', position: [4.5, 1.01, 1.18], size: 0.72 }],
  },
  {
    name: 'Kacho',
    room: 'living',
    label: 'Salon d’étude',
    source: '358–359 / 383',
    camera: [-4.2, 1.42, 4.5],
    target: [-5.05, 1.25, 0.8],
    fov: 37,
    actors: [prince('kacho', [-5.65, 0, 1.5], { heading: 0.3, royalCostume: 'twins-banquet' })],
  },
  {
    name: 'Fugetsu',
    room: 'bedroom',
    label: 'Chambre privée',
    source: '374 · p. 9',
    camera: [-2.9, 1.72, 6.05],
    target: [-5.05, 1.14, 8.65],
    fov: 49,
    actors: [
      prince('fugetsu', [-4.04, 0, 7.64], {
        heading: -0.82,
        pose: 'kneeling',
        royalCostume: 'fugetsu-night',
      }),
    ],
    beasts: [
      { kind: 'portal', position: [-5.06, 1.25, 8.64], size: 0.97, heading: 2.46, stage: 1 },
    ],
  },
  {
    name: 'Momoze',
    room: 'living',
    label: 'Salon privé',
    source: '361 · p. 19',
    camera: [-5.15, 1.6, 4.7],
    target: [-3.09, 1.25, 1.55],
    fov: 45,
    actors: [prince('momoze', [-3.32, 0.3, 1.68], { heading: -0.47, pose: 'seated' })],
    beasts: [{ kind: 'sprite', position: [-2.21, 0, 0.35], size: 0.87, heading: -0.5 }],
  },
  {
    name: 'Marayam',
    room: 'living',
    label: 'Salon de jeux',
    source: '367 · p. 19',
    camera: [-4.38, 3.77, 4.92],
    target: [-0.7, 0.73, 2.19],
    fov: 46,
    actors: [
      prince('marayam', [-1.35, 0.042, 2.49], {
        heading: -0.8,
        gesture: 'play',
      }),
    ],
    beasts: [{ kind: 'dragon', position: [1.28, 0, 1.82], size: 1.05, heading: -1.0 }],
  },
  {
    name: 'Woble',
    room: 'living',
    label: 'Salon d’Oito',
    source: '349 · p. 5',
    camera: [-4.25, 1.58, 4.42],
    target: [-4.6, 1.28, 0.65],
    fov: 32,
    actors: [
      { id: 'queen-oito', position: [-4.63, 0, 1.16], heading: 0.12, gesture: 'cradle' },
      prince('woble', [-4.53, 1.23, 1.43], { heading: 0.12, pose: 'held' }),
    ],
  },
]

export const roomId = (index: number, shot: Shot) =>
  `tier-1-royal-residential-sector-room-${1001 + index}-${shot.room}`

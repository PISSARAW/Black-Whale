import type { Vec2 } from './types'
import type { Apparition } from './apparitions'

export interface MangaCastStaging {
  characterId: string
  at: Vec2
  heading?: number
  pose?: NonNullable<Apparition['human']>['pose']
}

export interface MangaView {
  /** The unique ID for this view */
  id: string
  /** The space this view belongs to */
  spaceId: string
  /** The position of the camera */
  at: Vec2
  /** The horizontal angle (yaw) of the camera in radians */
  heading: number
  /** The vertical angle (pitch) of the camera in radians */
  pitch: number
  /** The chapter this view is from, for the watermark */
  chapter: number
  /** Event order inside the chapter when the panel reproduces a populated scene. */
  eventSequence?: number
  /** Collected edition used to check the framing. */
  volume: number
  /** Printed page(s), when the edition exposes a stable reference. */
  pages?: string
  /** Description of the scene */
  label: string
  /** Description of the scene in French */
  labelFr: string
  /** Character blocking visible in the source panel, when it is explicit. */
  staging?: readonly MangaCastStaging[]
  /**
   * Other zones of the same continuous room from which this view is offered.
   * The cineplex hall, for example, is split into three navigation spaces even
   * though the manga draws it as one room in one establishing shot.
   */
  triggerSpaceIds?: readonly string[]
}

function headingTo(from: Vec2, target: Vec2): number {
  // Three.js' camera looks down local -Z; TourScene documents the resulting
  // ground-plane ray as (-sin(yaw), -cos(yaw)).
  return Math.atan2(from[0] - target[0], from[1] - target[1])
}

function view(input: Omit<MangaView, 'heading'> & { target: Vec2 }): MangaView {
  const { target, ...rest } = input
  return { ...rest, heading: headingTo(input.at, target) }
}

/**
 * A catalogue of specific camera angles that reproduce panels from the manga.
 * The walk can jump the visitor here so they see exactly what the drawing shows.
 */
export const MANGA_VIEWS: MangaView[] = [
  view({
    id: 'beyond-cell-bars',
    spaceId: 'tier-1-vvip-prison-beyond-cell',
    at: [-2.2, 0],
    target: [-6.3, 0.4],
    pitch: -0.03,
    chapter: 350,
    volume: 34,
    label: 'Beyond, seen through the bars of the high-security cell',
    labelFr: 'Beyond vu à travers les barreaux de la cellule de haute sécurité',
  }),
  view({
    id: 'woble-living-phone-wall',
    spaceId: 'tier-1-royal-residential-sector-room-1014-living',
    at: [1, 4.7],
    target: [8.9, 3.2],
    pitch: 0.01,
    chapter: 360,
    volume: 34,
    label: "Woble's living room, from the phone wall to the display furniture",
    labelFr: 'Le salon de Woble, du téléphone mural au mobilier de présentation',
  }),
  view({
    id: 'benjamin-living-guards',
    spaceId: 'tier-1-royal-residential-sector-room-1001-living',
    at: [0, 4.8],
    target: [-6.2, 1.8],
    pitch: -0.02,
    chapter: 362,
    volume: 35,
    label: "Benjamin's reception room and its guard line",
    labelFr: 'Le salon de réception de Benjamin et sa ligne de gardes',
  }),
  view({
    id: 'tserriednich-living-training',
    spaceId: 'tier-1-royal-residential-sector-room-1004-living',
    at: [0.2, 4.8],
    target: [-6.1, 1.7],
    pitch: -0.04,
    chapter: 362,
    volume: 35,
    label: "Tserriednich's Nen training room",
    labelFr: "La pièce d'entraînement au Nen de Tserriednich",
  }),
  view({
    id: 'tyson-living-audience',
    spaceId: 'tier-1-royal-residential-sector-room-1006-living',
    at: [0.4, 4.7],
    target: [-6, 1.7],
    pitch: -0.03,
    chapter: 362,
    volume: 35,
    label: "Tyson's audience room",
    labelFr: "Le salon d'audience de Tyson",
  }),
  view({
    id: 'luzurus-living-sofa',
    spaceId: 'tier-1-royal-residential-sector-room-1007-living',
    at: [-0.2, 4.8],
    target: [-6, 1.8],
    pitch: -0.03,
    chapter: 362,
    volume: 35,
    label: "Luzurus's sofa group",
    labelFr: 'Le groupe de canapés de Luzurus',
  }),
  view({
    id: 'zhang-lei-dining-oito',
    spaceId: 'tier-1-royal-residential-sector-room-1003-dining',
    at: [2.25, -0.65],
    target: [7.2, -2.8],
    pitch: -0.04,
    chapter: 365,
    volume: 35,
    label: 'Zhang Lei receiving Queen Oito across the long dining table',
    labelFr: 'Zhang Lei recevant la reine Oito devant la longue table sculptée',
  }),
  view({
    id: 'tubeppa-living-workstation',
    spaceId: 'tier-1-royal-residential-sector-room-1005-living',
    at: [2.8, 4.7],
    target: [9.3, 2.9],
    pitch: 0,
    chapter: 366,
    volume: 35,
    label: "Tubeppa's workstation and equation-covered boards",
    labelFr: 'Le poste de travail de Tubeppa et ses tableaux couverts d’équations',
  }),
  view({
    id: 'momoze-bedroom-vent',
    spaceId: 'tier-1-royal-residential-sector-room-1012-bedroom',
    at: [3.7, 6.35],
    target: [-7.5, 8.45],
    pitch: -0.07,
    chapter: 367,
    volume: 35,
    label: "Momoze's bed and the ventilation grille used by her attacker",
    labelFr: "Le lit de Momoze et la grille d'aération empruntée par son assassin",
  }),
  view({
    id: 'marayam-living-vent',
    spaceId: 'tier-1-royal-residential-sector-room-1013-living',
    at: [3.7, 4.7],
    target: [-9.5, -0.7],
    pitch: 0.03,
    chapter: 367,
    volume: 35,
    label: "Marayam's living room and the watched ventilation grille",
    labelFr: "Le salon de Marayam et la grille d'aération sous surveillance",
  }),
  view({
    id: 'woble-kitchen-counter',
    spaceId: 'tier-1-royal-residential-sector-room-1014-kitchen',
    at: [2.15, -6.3],
    target: [6.7, -9.65],
    pitch: -0.02,
    chapter: 367,
    volume: 35,
    label: "Woble's kitchen counter beneath the glass-fronted cupboards",
    labelFr: 'Le plan de travail de Woble sous les éléments hauts vitrés',
  }),
  view({
    id: 'burial-rotunda-caskets',
    spaceId: 'tier-1-princes-burial-chamber-rotunda',
    at: [0, -9.25],
    target: [0, 0],
    pitch: 0.08,
    chapter: 371,
    volume: 36,
    label: 'The fourteen radial caskets of the succession-war burial chamber',
    labelFr: 'Les quatorze cercueils en rayon de la chambre funéraire de la succession',
  }),
  view({
    id: 'supreme-court-bench-seal',
    spaceId: 'tier-1-supreme-court',
    at: [112, 38.5],
    target: [122.35, 38.5],
    pitch: 0.03,
    chapter: 371,
    volume: 36,
    pages: '9',
    label: 'The Supreme Court bench beneath the circular judicial seal',
    labelFr: 'Le banc de la Cour suprême sous le sceau judiciaire circulaire',
  }),
  view({
    id: 'woble-dining-guards',
    spaceId: 'tier-1-royal-residential-sector-room-1014-dining',
    at: [2.15, -4.95],
    target: [8.3, -2.6],
    pitch: -0.04,
    chapter: 371,
    volume: 36,
    label: "Woble's guards gathered around the two meal-covered tables",
    labelFr: 'Les gardes de Woble réunis autour des deux longues tables de repas',
  }),
  view({
    id: 'kacho-living-homework',
    spaceId: 'tier-1-royal-residential-sector-room-1010-living',
    at: [0.8, 4.75],
    target: [-7.8, -2.35],
    pitch: -0.01,
    chapter: 376,
    volume: 36,
    label: 'Kacho studying beneath the coffered ceiling',
    labelFr: 'Kacho travaillant sous le plafond à caissons',
  }),
  view({
    id: 'kacho-kitchen-cabinet',
    spaceId: 'tier-1-royal-residential-sector-room-1010-kitchen',
    at: [2.15, -6.3],
    target: [6.8, -9.65],
    pitch: -0.05,
    chapter: 376,
    volume: 36,
    label: "Kacho's kitchen and the lower cupboard named in Melody's Morse code",
    labelFr: 'La cuisine de Kacho et le placard bas désigné par le morse de Senritsu',
  }),
  view({
    id: 'nasubi-living-mantel',
    spaceId: 'tier-1-king-living-quarters-living',
    at: [0, 7.15],
    target: [0, -7.45],
    pitch: -0.07,
    chapter: 382,
    eventSequence: 1,
    volume: 37,
    pages: '29–30',
    label: "Nasubi's salon facing the monumental painting and ornamented mantel",
    labelFr: 'Le salon de Nasubi face au tableau monumental et au manteau ornementé',
    // Ch. 382, pp. 29–30: Nasubi occupies the left seating group,
    // Halkenburg crosses the open floor at right, while Nasubi's Guardian
    // Spirit Beast occupies the far edge. This blocking is part of the panel
    // just as much as the lens:
    // leaving the generic hashed stations in place put the King outside it.
    staging: [
      {
        characterId: 'nasubi-hui-guo-rou',
        at: [-5, -0.15],
        heading: 0,
        pose: 'seated',
      },
      {
        characterId: 'prince-halkenburg',
        at: [5.1, -1.35],
        heading: -1.45,
        pose: 'idle',
      },
    ],
  }),
  view({
    id: 'lifeboat-round-hatch',
    spaceId: 'tier-1-lifeboats-port-pod-cabin',
    at: [1.75, 1.25],
    target: [0, -1.7],
    pitch: 0.03,
    chapter: 383,
    volume: 37,
    pages: '60–65',
    label: 'The ribbed lifeboat cabin facing its round hatch and console',
    labelFr: 'La cabine nervurée de la capsule face à son écoutille ronde et sa console',
  }),
  view({
    id: 'cineplex-establishing-shot',
    spaceId: 'tier-3-cineplex-screen-corridor',
    triggerSpaceIds: ['tier-3-cineplex-concession', 'tier-3-cineplex-ticket-desk'],
    at: [0, -4.25],
    target: [0, 9.8],
    pitch: 0.02,
    chapter: 393,
    volume: 38,
    label: 'The cineplex hall between the concession stand, ticket desks and screens',
    labelFr: 'Le hall du cinéma entre la confiserie, les guichets et les salles',
  }),
  view({
    id: 'room-3101-bathroom-trap',
    spaceId: 'tier-3-residential-room-3101-living',
    at: [-4.7, 2.8],
    target: [2, 0],
    pitch: -0.03,
    chapter: 398,
    volume: 38,
    pages: '150–153',
    label: 'Room 3101 facing the Heil-Ly bathroom trap',
    labelFr: 'La chambre 3101 face au piège Heil-Ly de la salle de bains',
  }),
  view({
    id: 'unma-nursery-salon',
    spaceId: 'tier-1-queens-living-quarters-room-01',
    at: [-36.2, 7.9],
    target: [-33.6, 12.5],
    pitch: 0.01,
    chapter: 403,
    volume: 39,
    label: 'Queen Unma in her formal salon with the nursery visible behind her',
    labelFr: 'La reine Unma dans son salon d’apparat, avec la nursery visible derrière elle',
  }),
  view({
    id: 'morena-office-negotiation-game',
    spaceId: 'tier-2-heilly-secret-hideout-office',
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

export function viewsForSpace(spaceId: string | null): MangaView[] {
  if (!spaceId) return []
  return MANGA_VIEWS.filter(
    (view) => view.spaceId === spaceId || view.triggerSpaceIds?.includes(spaceId),
  )
}

export function mangaViewById(id: string | null): MangaView | null {
  if (!id) return null
  return MANGA_VIEWS.find((view) => view.id === id) ?? null
}

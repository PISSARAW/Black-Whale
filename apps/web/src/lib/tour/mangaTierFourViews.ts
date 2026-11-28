import { mangaView } from './mangaViewModel'

const deckPlan = { chapter: 349, volume: 33, staging: [] } as const
const chapter380 = { chapter: 380, volume: 36, staging: [] } as const

export const MANGA_TIER_FOUR_VIEWS = [
  mangaView({
    ...chapter380,
    id: 'tier-four-central-passage-tour',
    spaceId: 'tier-4-central-passage',
    at: [-73, -17.5],
    target: [-24, -17.5],
    pitch: 0.01,
    label: 'Tier 4 central passage — deck-plan reconstruction',
    labelFr: 'Passage central du pont 4 — reconstitution d’après le plan',
  }),
  mangaView({
    ...chapter380,
    id: 'tier-four-passenger-corridor-tour',
    spaceId: 'tier-4-general-area-east-corridor',
    at: [0, 2],
    target: [0, 22],
    pitch: 0.01,
    label: 'Passenger block corridor — layout reconstruction',
    labelFr: 'Coursive du bloc passagers — reconstitution de la disposition',
  }),
  mangaView({
    ...chapter380,
    id: 'tier-four-passenger-cabin-door-tour',
    spaceId: 'tier-4-general-area-east-corridor',
    at: [0.65, 4.1],
    target: [-2.5, 4.5],
    pitch: -0.03,
    label: 'Passenger cabin door from the corridor — layout reconstruction',
    labelFr: 'Porte de cabine passagers depuis la coursive — reconstitution de la disposition',
  }),
  mangaView({
    ...deckPlan,
    id: 'tier-four-recycling-tour',
    spaceId: 'tier-4-recycling-sewage-facilities',
    at: [-55, 76.5],
    target: [-3, 76.5],
    pitch: 0.01,
    label: 'Recycling and sewage facilities — functional reconstruction',
    labelFr: 'Installations de recyclage et d’assainissement — reconstitution fonctionnelle',
  }),
  mangaView({
    ...chapter380,
    id: 'tier-four-xiyu-office-tour',
    spaceId: 'tier-4-xi-yu-family-office-meeting-room',
    at: [-6.8, 0.8],
    target: [4.7, 0.2],
    eyeHeight: 2.05,
    pitch: -0.07,
    label: 'Xi-Yu meeting room facing the long table — deck-plan reconstruction',
    labelFr: 'Salle de réunion des Xi-Yu face à la longue table — reconstitution d’après le plan',
  }),
]

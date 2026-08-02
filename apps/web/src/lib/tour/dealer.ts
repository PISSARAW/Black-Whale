/** Morena, rendered through the shared articulated human system. */
import type { Group, MeshBasicMaterial } from 'three'
import type { Apparition } from './apparitions'
import { buildHumanFigure } from './humanFigure'

type Three = typeof import('three')

export interface DealerLook {
  size: number
  colour: number
  stage: number
}

export interface DealerBuild {
  THREE: Three
  glow: (colour: number, opacity: number) => MeshBasicMaterial
  seen: DealerLook
}

export function buildDealer({ THREE, glow, seen }: DealerBuild): Group {
  const apparition: Apparition & { kind: 'avatar' } = {
    id: 'morena-dealer-human',
    kind: 'avatar',
    spaceId: 'tier-2-heilly-secret-hideout-office',
    tierId: 'interior-heilly-hideout',
    at: [0, 0],
    y: 0,
    size: seen.size,
    colour: seen.colour,
    stage: seen.stage,
    hidden: false,
    human: {
      role: 'morena',
      identity: 'morena-prudo',
      pose: 'seated',
      aura: 'none',
    },
  }
  const human = buildHumanFigure({ THREE, glow, seen: apparition })
  const root = human.root

  // Preserve the negotiation's restrained body language while the articulated
  // seated pose keeps her hips, knees and forearms aligned with the chair/table.
  if (seen.stage === 1) human.turns.rotation.x = -0.08
  if (seen.stage === 2) human.turns.rotation.x = 0.06
  if (seen.stage === 3) human.turns.rotation.x = 0.1
  return root
}

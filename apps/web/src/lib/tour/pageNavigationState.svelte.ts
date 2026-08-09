import type { Ship } from '$lib/tour/blueprint'
import { entrySpace } from '$lib/tour/blueprint'
import type { Link, Space, Vec2 } from '$lib/tour/types'

export class TourNavigationState {
  tierId = $state('')
  currentSpace = $state<Space | null>(null)
  availableLink = $state<{ link: Link; to: string } | null>(null)
  jumpTo = $state<string | null>(null)
  jumpAt = $state<Vec2 | null>(null)
  engaged = $state(false)
  touch = $state(false)
  position = $state<Vec2>([0, 0])
  heading = $state(0)
  lookPitch = $state(0)
  aimedAt = $state<Space | null>(null)
  aimedSolidAt = $state<import('$lib/tour/types').Structure | null>(null)

  constructor(
    private readonly ship: Ship,
    initialTierId: string,
  ) {
    this.tierId = initialTierId
  }

  goToSpace = (space: Space, landing: Vec2 | null = null) => {
    if (space.tierId !== this.tierId) this.tierId = space.tierId
    this.jumpAt = landing
    this.jumpTo = space.id
  }

  selectTier = (id: string) => {
    if (id === this.tierId) return
    const plan = this.ship.plans.get(id)
    if (plan) this.goToSpace(entrySpace(plan))
  }

  honor(space: Space | null, deck: string | null) {
    if (space) this.goToSpace(space)
    else if (deck && this.ship.plans.has(deck)) this.selectTier(deck)
  }
}

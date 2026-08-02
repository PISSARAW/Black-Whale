import type { HatsuProfile } from '$lib/nen/hatsuRegistry'
import type { Ship } from '$lib/tour/blueprint'
import { aimsAtSolids, worksOnTheBody, type TourWorld } from '$lib/tour/hatsu'
import { groupSolidTargets, groupSpaceTargets } from '$lib/tour/pageTargets'
import type { Space } from '$lib/tour/types'

export type TourTargetMode = 'body' | 'solid' | 'relay' | 'space' | 'jump'

interface NamedTarget {
  id?: string
  name: string
  nameFr: string
}

interface TargetContext {
  technique: HatsuProfile | null
  world: TourWorld
  french: boolean
}

interface TargetViewOptions {
  ship: Ship
  read: () => TargetContext
  nameOf: (target: NamedTarget) => string
  named: (space: Space) => Space
}

export class TourTargetView {
  constructor(private readonly options: TargetViewOptions) {}

  get spaces() {
    const context = this.options.read()
    return context.technique
      ? groupSpaceTargets({
          ship: this.options.ship,
          nameOf: this.options.nameOf,
          locale: context.french ? 'fr' : 'en',
        })
      : []
  }

  get onSolids() {
    const { technique, world } = this.options.read()
    const relayIsPairing = technique?.kind === 'relay' && world.pairing
    return (
      (aimsAtSolids(technique) && !relayIsPairing) ||
      technique?.kind === 'mimicry' ||
      Boolean(technique && world.body.riding)
    )
  }

  get mode(): TourTargetMode {
    const { technique, world } = this.options.read()
    if (worksOnTheBody(technique) && !this.onSolids) return 'body'
    if (this.onSolids) return 'solid'
    if (technique?.kind === 'relay' && world.pairing) return 'relay'
    return technique ? 'space' : 'jump'
  }

  get solids() {
    const context = this.options.read()
    return this.onSolids
      ? groupSolidTargets({
          ship: this.options.ship,
          nameOf: this.options.nameOf,
          locale: context.french ? 'fr' : 'en',
        })
      : []
  }

  name = (item: NamedTarget) => {
    const space = item.id ? this.options.ship.spaces.get(item.id) : null
    return this.options.nameOf(space ? this.options.named(space) : item)
  }
}

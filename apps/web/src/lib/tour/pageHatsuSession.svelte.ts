import { untrack } from 'svelte'
import { get } from 'svelte/store'
import {
  canUseHatsu,
  createNenTechniqueState,
  transitionNen,
  type NenTechniqueAction,
  type NenTechniqueState,
  type NenTransition,
} from '@black-whale/nen-engine'
import type { HatsuInteractionKind } from '$lib/nen/hatsuRegistry'
import { activeHatsu, enterForcedZetsu, parallelFutureVisible } from '$lib/nen/hatsuState'
import type { Ship } from '$lib/tour/blueprint'
import { arriveInTour, EMPTY_WORLD, type TourReport, type TourWorld } from '$lib/tour/hatsu'
import { activateTourWorld, cycleTourMode, releaseTourWorld } from '$lib/tour/pageWorldCommands'
import type { Vec2 } from '$lib/tour/types'

interface ActivationContext {
  ship: Ship
  activeKind: HatsuInteractionKind | null
  hasAura: boolean
  position: Vec2
  spaceId: string | null
}

interface SessionContext extends ActivationContext {
  world: TourWorld
}

interface SessionOptions {
  readActivation: () => ActivationContext
  read: () => SessionContext
  updateWorld: (world: TourWorld) => void
  updateReport: (report: TourReport | null) => void
  resetHands: () => void
  show: (report: TourReport) => void
  goToSpace: (spaceId: string) => void
  reboundText: () => string
  vowText: (spaceId: string) => string
}

export class TourHatsuSession {
  penalty = $state<string | null>(null)
  /** TourSense reads and mutates the same Nen contract as every other surface. */
  nen = $state<NenTechniqueState>(createNenTechniqueState())
  private wasFutureVisible = false
  private unsubscribeFuture: (() => void) | null = null

  constructor(private readonly options: SessionOptions) {}

  watchActivation() {
    $effect(() => {
      const context = this.options.readActivation()
      if (!context.hasAura || !canUseHatsu(this.nen)) {
        this.options.updateWorld(EMPTY_WORLD)
        this.options.updateReport(null)
        return
      }
      this.penalty = null
      const world = untrack(() => this.options.read().world)
      const activated = activateTourWorld({
        world,
        kind: context.activeKind,
        ship: context.ship,
        position: context.position,
        spaceId: context.spaceId,
      })
      if (!activated) return
      this.options.resetHands()
      this.options.updateWorld(activated)
    })
  }

  watchFuture() {
    this.unsubscribeFuture = parallelFutureVisible.subscribe((isVisible) => {
      const active = get(activeHatsu)
      if (this.wasFutureVisible && !isVisible && active?.id === 'parallel-future') {
        const report: TourReport = { kind: 'vision-ended' }
        this.options.updateReport(report)
        this.options.show(report)
      }
      this.wasFutureVisible = isVisible
    })
  }

  dispose() {
    this.unsubscribeFuture?.()
    this.unsubscribeFuture = null
  }

  turn = (requested: HatsuInteractionKind) => {
    const context = this.options.read()
    const changed = cycleTourMode({ world: context.world, requested, active: context.activeKind })
    if (!changed) return
    this.options.updateWorld(changed.world)
    this.options.updateReport(changed.report)
    this.options.show(changed.report)
  }

  release = () => {
    const released = releaseTourWorld(this.options.read().world)
    this.options.updateWorld(released.world)
    this.options.updateReport(null)
    if (released.rebound) this.punish(this.options.reboundText())
  }

  useNen = (action: NenTechniqueAction): NenTransition => {
    const result = transitionNen(this.nen, action)
    if (result.accepted) this.nen = result.state
    if (!canUseHatsu(this.nen)) {
      this.options.updateWorld(EMPTY_WORLD)
      this.options.updateReport(null)
    }
    return result
  }

  arrived = (spaceId: string | null) => {
    const context = this.options.read()
    const arrival = arriveInTour(context.world, context.ship, spaceId)
    this.options.updateWorld(arrival.world)
    if (arrival.report) this.options.updateReport(arrival.report)
    if (arrival.travelTo) this.options.goToSpace(arrival.travelTo)
    if (arrival.punished && spaceId) this.punish(this.options.vowText(spaceId))
  }

  punish(said: string) {
    this.penalty = said
    this.useNen({ type: 'ZETSU' })
    enterForcedZetsu()
  }
}

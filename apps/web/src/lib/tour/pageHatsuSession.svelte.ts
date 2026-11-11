import { untrack } from 'svelte'
import { get } from 'svelte/store'
import {
  transitionNen,
  type NenTechniqueAction,
  type NenTechniqueState,
  type NenTransition,
} from '@black-whale/nen-engine'
import type { HatsuInteractionKind } from '$lib/nen/hatsuRegistry'
import { loadTourNen, saveTourNen } from '$lib/nen/persistence'
import { activeHatsu, enterForcedZetsu, parallelFutureVisible } from '$lib/nen/hatsuState'
import type { Ship } from '$lib/tour/blueprint'
import {
  arriveInTour,
  EMPTY_WORLD,
  selfInflictTourInjury,
  type TourInjurySeverity,
  type TourReport,
  type TourWorld,
} from '$lib/tour/hatsu'
import { activateTourWorld, cycleTourMode, releaseTourWorld } from '$lib/tour/pageWorldCommands'
import { bodyAfterAuraEnds } from '$lib/tour/cast/pain'
import { canUseTourHatsu } from '$lib/tour/hatsuMode'
import {
  breathe,
  exhaustionActions,
  refusedByReserve,
  reserveAvailability,
  RESERVE_MAX,
} from '$lib/tour/auraReserve'
import {
  awakeningAvailability,
  awakensWith,
  loadAwakened,
  refusedBeforeAwakening,
  saveAwakened,
} from '$lib/tour/awakening'
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
  nen = $state<NenTechniqueState>(loadTourNen())
  /** What the visitor has left to spend. See `auraReserve.ts`. */
  reserve = $state(RESERVE_MAX)
  /** Whether the visitor's nodes are open. See `awakening.ts`. */
  awakened = $state(loadAwakened())
  /** What the Nen panel greys out: shut nodes first, then what the reserve cannot pay. */
  availability = $derived({
    ...reserveAvailability(this.reserve, this.nen),
    ...awakeningAvailability(this.awakened),
  })

  /** The visitor as a perceiver: their Nen and whether it is open. */
  get perceiver() {
    return { nen: this.nen, awakened: this.awakened }
  }

  /** What the stage needs of the visitor's Nen, as one spread into `scene`. */
  get scene() {
    return {
      nen: this.nen,
      awakened: this.awakened,
      onNenChange: this.useNen,
      nenAvailability: this.availability,
      reserve: this.reserve,
    }
  }
  private wasFutureVisible = false
  private futureArmed = false
  private activationKind: HatsuInteractionKind | null = null
  private unsubscribeFuture: (() => void) | null = null

  constructor(private readonly options: SessionOptions) {}

  watchActivation() {
    $effect(() => {
      const context = this.options.readActivation()
      const changedKind = context.activeKind !== this.activationKind
      this.activationKind = context.activeKind
      if (changedKind && context.activeKind === 'future' && !this.futureArmed)
        parallelFutureVisible.set(false)
      if (!context.hasAura || !canUseTourHatsu(this.nen, context.activeKind)) {
        if (context.activeKind === 'future') parallelFutureVisible.set(false)
        const world = untrack(() => this.options.read().world)
        this.options.updateWorld({ ...EMPTY_WORLD, body: bodyAfterAuraEnds(world.body) })
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
      if (
        this.wasFutureVisible &&
        !isVisible &&
        this.futureArmed &&
        active?.id === 'parallel-future'
      ) {
        const report: TourReport = { kind: 'vision-ended' }
        this.options.updateReport(report)
        this.options.show(report)
      }
      if (!isVisible) this.futureArmed = false
      this.wasFutureVisible = isVisible
    })
  }

  /** Starts a fresh ten-second window only after a valid Tour cast in Zetsu. */
  armFutureVision() {
    this.futureArmed = false
    parallelFutureVisible.set(false)
    queueMicrotask(() => {
      if (
        !this.unsubscribeFuture ||
        get(activeHatsu)?.id !== 'parallel-future' ||
        !canUseTourHatsu(this.nen, 'future')
      )
        return
      this.futureArmed = true
      parallelFutureVisible.set(true)
    })
  }

  dispose() {
    this.unsubscribeFuture?.()
    this.unsubscribeFuture = null
    this.futureArmed = false
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

  selfInjure = (severity: TourInjurySeverity) => {
    const result = selfInflictTourInjury(this.options.read().world, severity)
    this.options.updateWorld(result.world)
    this.options.updateReport(result.report)
    this.options.show(result.report)
  }

  /** One second of the walk's beat: the reserve moves, and an empty body lets go. */
  breathe = () => {
    this.reserve = breathe(this.reserve, this.nen)
    if (this.reserve > 0) return
    for (const action of exhaustionActions(this.nen)) this.useNen(action)
  }

  useNen = (action: NenTechniqueAction): NenTransition => {
    if (
      refusedBeforeAwakening(this.awakened, action) ||
      refusedByReserve(this.reserve, this.nen, action)
    )
      return { state: this.nen, accepted: false }
    const result = transitionNen(this.nen, action)
    if (result.accepted) {
      this.nen = result.state
      saveTourNen(this.nen)
    }
    if (!this.awakened && awakensWith(action)) {
      this.awakened = true
      saveAwakened()
    }
    if (!canUseTourHatsu(this.nen, this.options.read().activeKind)) {
      if (this.options.read().activeKind === 'future') parallelFutureVisible.set(false)
      const world = this.options.read().world
      this.options.updateWorld({ ...EMPTY_WORLD, body: bodyAfterAuraEnds(world.body) })
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

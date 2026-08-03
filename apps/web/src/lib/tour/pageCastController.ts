import type { HatsuInteractionKind } from '$lib/nen/hatsuRegistry'
import type { Ship } from '$lib/tour/blueprint'
import { turnTheBook, type TourReport, type TourWorld } from '$lib/tour/hatsu'
import {
  advanceCastHand,
  performPageCast,
  performTourCast,
  type CastHand,
  type NenHand,
} from '$lib/tour/pageCasting'
import type { Space, Structure, Vec2 } from '$lib/tour/types'

type Pages = readonly [HatsuInteractionKind, HatsuInteractionKind] | null
type Hands = Record<CastHand, NenHand>

interface CastContext {
  world: TourWorld
  ship: Ship
  activeKind: HatsuInteractionKind | null
  pages: Pages
  hands: Hands
  currentSpace: Space | null
  aimedAt: Space | null
  aimedSolidAt: Structure | null
  position: Vec2
  heading: number
}

interface CastOptions {
  read: () => CastContext
  updateWorld: (world: TourWorld) => void
  updateReport: (report: TourReport) => void
  updateHands: (hands: Hands) => void
  show: (report: TourReport) => void
  goToSpace: (space: Space, landing?: Vec2 | null) => void
}

export class TourCastController {
  constructor(private readonly options: CastOptions) {}

  castOn = (spaceId: string | null, solidId: string | null = null, hand: CastHand = 'first') => {
    const context = this.options.read()
    const cast = performTourCast({
      world: context.world,
      ship: context.ship,
      activeKind: context.activeKind,
      pages: context.pages,
      hands: context.hands,
      hand,
      targetId: spaceId,
      targetSolidId: solidId,
      standingIn: context.currentSpace?.id ?? null,
      at: context.position,
      heading: context.heading,
    })
    if (!cast) return
    const { result, mark } = cast
    this.finish(result.world, result.report)
    this.options.updateHands(
      advanceCastHand({
        hands: context.hands,
        hand,
        mark,
        marked: result.report?.kind === 'marked',
      }),
    )
    if (!result.travelTo) return
    const landing = result.world.landed[result.travelTo] ?? null
    this.options.goToSpace(context.ship.spaces.get(result.travelTo)!, landing)
  }

  castPage = (kind: HatsuInteractionKind) => {
    const context = this.options.read()
    const result = performPageCast({
      world: context.world,
      kind,
      ship: context.ship,
      targetId: context.aimedAt?.id ?? context.currentSpace?.id ?? null,
      targetSolidId: context.aimedSolidAt?.id ?? null,
      standingIn: context.currentSpace?.id ?? null,
      at: context.position,
      heading: context.heading,
    })
    this.finish(result.world, result.report)
    if (result.travelTo) this.options.goToSpace(context.ship.spaces.get(result.travelTo)!)
  }

  castHand = (hand: CastHand) => {
    const context = this.options.read()
    this.castOn(
      context.aimedAt?.id ?? context.currentSpace?.id ?? null,
      context.aimedSolidAt?.id ?? null,
      hand,
    )
  }

  turnRibbon = () => {
    const { world } = this.options.read()
    this.options.updateWorld({ ...world, book: turnTheBook(world.book) })
  }

  private finish(world: TourWorld, report: TourReport) {
    this.options.updateWorld(world)
    this.options.updateReport(report)
    this.options.show(report)
  }
}

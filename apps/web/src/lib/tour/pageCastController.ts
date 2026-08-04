import type { HatsuInteractionKind } from '$lib/nen/hatsuRegistry'
import { turnTheBook, type TourReport, type TourWorld } from '$lib/tour/hatsu'
import {
  advanceCastHand,
  performPageCast,
  performTourCast,
  type CastHand,
} from '$lib/tour/pageCasting'
import type { Space, Vec2 } from '$lib/tour/types'
import {
  aimedSolidId,
  aimedTargetId,
  standingInId,
  vowRulesFor,
  type CastContext,
  type Hands,
} from '$lib/tour/castAim'

interface CastOptions {
  read: () => CastContext
  updateWorld: (world: TourWorld) => void
  updateReport: (report: TourReport) => void
  updateHands: (hands: Hands) => void
  show: (report: TourReport) => void
  goToSpace: (space: Space, landing?: Vec2 | null) => void
  /** The two rules spoken aloud by Judgment Chain for the given subject. */
  vowRules: (subjectId: string) => string[]
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
      standingIn: standingInId(context),
      at: context.position,
      heading: context.heading,
      rules: vowRulesFor(context.activeKind, spaceId, this.options.vowRules),
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
    const targetId = aimedTargetId(context)
    const result = performPageCast({
      world: context.world,
      kind,
      ship: context.ship,
      targetId,
      targetSolidId: aimedSolidId(context),
      standingIn: standingInId(context),
      at: context.position,
      heading: context.heading,
      rules: vowRulesFor(kind, targetId, this.options.vowRules),
    })
    this.finish(result.world, result.report)
    if (result.travelTo) this.options.goToSpace(context.ship.spaces.get(result.travelTo)!)
  }

  castHand = (hand: CastHand) => {
    const context = this.options.read()
    this.castOn(aimedTargetId(context), aimedSolidId(context), hand)
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

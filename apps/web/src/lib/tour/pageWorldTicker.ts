import type { Ship } from '$lib/tour/blueprint'
import { wormExit, type TourReport, type TourWorld } from '$lib/tour/hatsu'
import {
  stepBeast,
  stepCoin,
  stepFish,
  stepOwl,
  stepOwlAge,
  stepPolarity,
  stepScout,
  type WorldStep,
} from '$lib/tour/pageWorldSteps'
import type { Vec2 } from '$lib/tour/types'

interface TickerContext {
  world: TourWorld
  ship: Ship
  position: Vec2
}

interface TickerOptions {
  read: () => TickerContext
  updateWorld: (world: TourWorld) => void
  updateReport: (report: TourReport) => void
  show: (report: TourReport) => void
}

export class TourWorldTicker {
  constructor(private readonly options: TickerOptions) {}

  private apply(step: WorldStep | null, audible = false) {
    if (!step) return
    this.options.updateWorld(step.world)
    if (!step.report) return
    this.options.updateReport(step.report)
    if (audible) this.options.show(step.report)
  }

  fishEat = () => {
    const { world, ship } = this.options.read()
    this.apply(stepFish({ world, ship }))
  }

  beastStep = () => {
    const { world, ship, position } = this.options.read()
    this.apply(stepBeast({ world, ship, position }), true)
  }

  takeCoin = () => {
    this.apply(stepCoin(this.options.read().world), true)
  }

  polarityWalk = (seconds: number, delta: number) => {
    const { world, ship } = this.options.read()
    this.apply(stepPolarity({ world, ship, seconds, delta }), true)
  }

  owlFlight = () => {
    const { world, ship } = this.options.read()
    this.apply(stepOwl({ world, ship }))
  }

  scoutFlight = () => {
    const { world, ship } = this.options.read()
    this.apply(stepScout({ world, ship }))
  }

  owlSecond = () => {
    this.apply(stepOwlAge(this.options.read().world), true)
  }

  crossWorm = (spaceId: string | null, arrivedFrom: string | null) => {
    const crossing = wormExit(this.options.read().world, spaceId, arrivedFrom)
    if (!crossing) return null
    this.options.updateWorld(crossing.world)
    this.options.updateReport(crossing.report)
    return crossing.to
  }
}

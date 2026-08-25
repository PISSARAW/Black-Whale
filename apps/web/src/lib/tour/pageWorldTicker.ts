import type { Ship } from '$lib/tour/blueprint'
import { wormExit, type TourReport, type TourWorld } from '$lib/tour/hatsu'
import {
  stepBeast,
  stepCoin,
  stepFish,
  stepOwl,
  stepConsole,
  stepOwlAge,
  stepCopies,
  stepPolarity,
  stepScarlet,
  stepScout,
  type WorldStep,
} from '$lib/tour/pageWorldSteps'
import type { Vec2 } from '$lib/tour/types'

interface TickerContext {
  world: TourWorld
  ship: Ship
  position: Vec2
  /** The room the visitor is standing in, which the console measures against. */
  standingIn: string | null
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
    const reports = Array.isArray(step.report) ? step.report : [step.report]
    for (const report of reports) {
      this.options.updateReport(report)
      if (audible) this.options.show(report)
    }
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

  /** One day of the walk on the console. See `stepConsole`. */
  consoleDay = () => {
    const { world, standingIn } = this.options.read()
    this.apply(stepConsole({ world, standingIn }), true)
  }

  owlSecond = () => {
    this.apply(stepOwlAge(this.options.read().world), true)
  }

  /** One hour of the walk on the copies, which last a day. */
  copyHour = () => {
    this.apply(stepCopies(this.options.read().world), true)
  }

  /**
   * One second of Emperor Time, and the hour of life it costs.
   *
   * The hour is spent every second and said nowhere: the ledger is already on
   * the panel, counted against the year, for as long as the eyes are red. Put
   * on the read-out as well it did something much worse than repeat itself —
   * the walk has one line for what just happened, and a technique that rewrites
   * it every second wipes the answer of every other cast made under it. Emperor
   * Time is the one ability meant to be *held while you work*, so it was the
   * one ability that made everything cast under it look like it had done
   * nothing at all.
   *
   * The three that are not a tick still speak: the year running out, the five
   * minutes counting down, and the Nen coming back are events, and an event is
   * exactly what that line is for.
   */
  scarletSecond = () => {
    const step = stepScarlet(this.options.read().world)
    if (!step) return
    const report = step.report
    // Emperor Time is held, not ticked: its own renewal stays silent, while
    // anything a step left behind still speaks.
    const renewsItself = !Array.isArray(report) && report?.kind === 'eyes-held'
    this.apply(renewsItself ? { ...step, report: null } : step)
  }

  crossWorm = (spaceId: string | null, arrivedFrom: string | null) => {
    const crossing = wormExit(this.options.read().world, spaceId, arrivedFrom)
    if (!crossing) return null
    this.apply(crossing)
    return crossing.to
  }
}

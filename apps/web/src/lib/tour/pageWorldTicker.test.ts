/**
 * What the beat is allowed to say out loud.
 *
 * The walk has one line for what just happened, and everything that ticks can
 * write to it. That is fine for the things that tick *rarely* — a coin taken, a
 * copy expiring — and it was ruinous for the one that ticks every second: while
 * Emperor Time was up, the answer of every other cast was wiped a second after
 * it appeared, which made the whole roster look broken from inside the one
 * ability that is meant to be held while you work.
 *
 * So this file asks the question the step's own tests cannot: not what the
 * ledger comes to, but what the visitor is told about it.
 */
import { describe, expect, it } from 'vitest'
import { EMPTY_WORLD, type TourReport, type TourWorld } from './cast/types'
import { eyesTurn, HOURS_IN_A_YEAR, ZETSU_SECONDS } from './emperor'
import { TourWorldTicker } from './pageWorldTicker'
import { theShip } from './blueprint'

const ship = theShip()

/** A ticker over one world, and everything it said while it ran. */
function beating(world: TourWorld) {
  const said: TourReport[] = []
  let now = world
  const ticker = new TourWorldTicker({
    read: () => ({ world: now, ship, position: [0, 0], standingIn: null }),
    updateWorld: (next) => (now = next),
    updateReport: (report) => said.push(report),
    show: () => {},
  })
  return { ticker, said, world: () => now }
}

describe('Emperor Time on the beat', () => {
  it('spends the hour without touching the read-out', () => {
    const run = beating({ ...EMPTY_WORLD, laidOpen: true, scarlet: eyesTurn() })
    run.ticker.scarletSecond()
    run.ticker.scarletSecond()

    // The price is paid — that half was never in doubt.
    expect(run.world().scarlet?.hours).toBe(2)
    // And nothing was written over the answer of whatever was cast last. The
    // panel carries the ledger already, counted against the year.
    expect(run.said).toEqual([])
  })

  // The three that are events rather than ticks. Each happens once, and each is
  // exactly what that line is for.
  it('still says the year running out, the Zetsu counting down and the Nen returning', () => {
    const brink = beating({
      ...EMPTY_WORLD,
      laidOpen: true,
      scarlet: { by: null, hours: HOURS_IN_A_YEAR - 1 },
    })
    brink.ticker.scarletSecond()
    expect(brink.said).toEqual([{ kind: 'zetsu-forced', seconds: ZETSU_SECONDS }])
    expect(brink.world().forcedZetsu).toBe(ZETSU_SECONDS)

    const ending = beating({ ...EMPTY_WORLD, forcedZetsu: 2 })
    ending.ticker.scarletSecond()
    ending.ticker.scarletSecond()
    expect(ending.said).toEqual([
      { kind: 'in-forced-zetsu', left: 1 },
      { kind: 'eyes-out', hours: 0 },
    ])
  })
})

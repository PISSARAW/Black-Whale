import type { HuntOutcome } from './outcome'
import { countOf, movementsIn, spentBy, type TelemetryEvent } from './telemetry'

export interface HuntRunMetrics {
  schemaVersion: 1
  duration: number
  outcome: HuntOutcome
  enSweeps: number
  hatsuUses: number
  entravesLaid: number
  entravesSprung: number
  inspections: number
  falseTrails: number
  roomsVisited: number
  playerAuraSpent: number
  hunterAuraSpent: number
  auraRecovered: number
  timeInZetsu: number
}

export function measureRun(
  log: readonly TelemetryEvent[],
  duration: number,
  outcome: HuntOutcome,
): HuntRunMetrics {
  return {
    schemaVersion: 1,
    duration,
    outcome,
    enSweeps: countOf(log, 'sweptEn'),
    hatsuUses: countOf(log, 'usedHatsu'),
    entravesLaid: countOf(log, 'laidEntrave'),
    entravesSprung: countOf(log, 'sprungEntrave'),
    inspections: countOf(log, 'inspected'),
    falseTrails: countOf(log, 'lostTheTrail'),
    roomsVisited: new Set(movementsIn(log, 'player').map((event) => event.where)).size,
    playerAuraSpent: Math.max(0, spentBy(log, 'player')),
    hunterAuraSpent: Math.max(0, spentBy(log, 'hunter')),
    auraRecovered: -log.reduce(
      (total, event) => total + (event.actor === 'player' && event.cost < 0 ? event.cost : 0),
      0,
    ),
    timeInZetsu: zetsuDuration(log, duration),
  }
}

function zetsuDuration(log: readonly TelemetryEvent[], duration: number): number {
  let entered: number | null = null
  let total = 0
  for (const event of log) {
    if (event.actor !== 'player') continue
    if (event.kind === 'wentZetsu' && entered === null) entered = event.at
    if (event.kind === 'wentTen' && entered !== null) {
      total += event.at - entered
      entered = null
    }
  }
  return total + (entered === null ? 0 : Math.max(0, duration - entered))
}

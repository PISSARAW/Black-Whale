import { EMPTY_INPUT, type ArcadeFighter, type FightSide, type FightState } from './types'
import type {
  FutureControls,
  FutureFrame,
  ParallelFutureState,
  SimulateFutureFrame,
} from './parallelFutureTypes'
import { FUTURE_WINDOW_FRAMES } from './parallelFutureTypes'
import { primeFutureFrameHash } from './fightReplayHash'
import { createImmutableFightSnapshots } from './immutableFightSnapshot'

type ForecastTail = Pick<ParallelFutureState, 'frames' | 'forecast'>
interface ForecastExtension {
  origin: FightState
  controls: FutureControls
  owner: FightSide
  simulate: SimulateFutureFrame
  end: number
  tail: ForecastTail
}
const extensions = new WeakMap<readonly FutureFrame[], ForecastExtension>()

interface ForecastSnapshots {
  copy: ReturnType<typeof createImmutableFightSnapshots>
  canonical: WeakMap<object, string>
}
const snapshotsByTail = new WeakMap<FightState, ForecastSnapshots>()

export function startFutureForecast(state: FightState): FightState {
  return {
    ...state,
    parallelFuture: undefined,
    futurePerception: undefined,
    forecastSimulation: true,
  }
}

/** Extend only as far as the next consumer needs. Earlier snapshots share the immutable prefix. */
export function extendFutureForecast(
  future: ParallelFutureState,
  needed: number,
  simulate: SimulateFutureFrame,
): ParallelFutureState {
  const end = Math.min(needed, FUTURE_WINDOW_FRAMES)
  if (end <= future.frames.length || !future.forecast || !future.controls) return future
  const extension = extensions.get(future.frames)
  if (extension && sameExtension(extension, { future, end, simulate }))
    return { ...future, ...extension.tail }
  const tail = generateTail({ future, end, simulate })
  extensions.set(future.frames, {
    origin: future.forecast,
    controls: future.controls,
    owner: future.owner,
    end,
    simulate,
    tail,
  })
  return { ...future, ...tail }
}

interface ForecastWork {
  future: ParallelFutureState
  end: number
  simulate: SimulateFutureFrame
}

function sameExtension(extension: ForecastExtension, { future, end, simulate }: ForecastWork) {
  return (
    extension.origin === future.forecast &&
    extension.controls === future.controls &&
    extension.owner === future.owner &&
    extension.end === end &&
    extension.simulate === simulate
  )
}

function generateTail({ future, end, simulate }: ForecastWork): ForecastTail {
  const held = predictionControls(future.controls!, future.owner)
  const frames: FutureFrame[] = [...future.frames]
  let predicted = future.forecast!
  const snapshots = snapshotsByTail.get(predicted) ?? {
    copy: createImmutableFightSnapshots(),
    canonical: new WeakMap(),
  }
  while (frames.length < end) {
    const before = predicted
    if (predicted.phase === 'fighting') predicted = simulate(predicted, held)
    const snapshot: FutureFrame = snapshots.copy({
      documentContext: predicted.battlefield?.entities.some((entry) => entry.document)
        ? { frame: predicted.frame }
        : undefined,
      scene: {
        rosterGuests: predicted.rosterGuests,
        bungeeGum: predicted.bungeeGum,
        gumNetwork: predicted.gumNetwork,
        catsName: predicted.catsName,
        catsNameConsumed: predicted.catsNameConsumed,
        moonlight: predicted.moonlight,
        lsdf: predicted.lsdf,
        expulsion: predicted.expulsion,
        score: predicted.score,
        knockdowns: predicted.knockdowns,
        winner: predicted.winner,
        finishReason: predicted.finishReason,
        hitstop: predicted.hitstop,
      },
      arena: predicted.arena,
      voconteDoors: predicted.voconteDoors,
      battlefield: predicted.battlefield,
      player: predicted.player,
      opponent: predicted.opponent,
      projectiles: predicted.projectiles,
      impact: predicted.impact,
      time: predicted.time,
      phase: predicted.phase,
      rng: predicted.rng,
      aiCooldown: predicted.aiCooldown,
      command: futureCommand(before, predicted),
    })
    primeFutureFrameHash(snapshot, snapshots.canonical)
    frames.push(snapshot)
  }
  if (end < FUTURE_WINDOW_FRAMES) snapshotsByTail.set(predicted, snapshots)
  return {
    frames: Object.freeze(frames),
    forecast: end < FUTURE_WINDOW_FRAMES ? predicted : undefined,
  }
}

function predictionControls(
  controls: FutureControls,
  owner: 'player' | 'opponent',
): FutureControls {
  const closed = { ...EMPTY_INPUT, aura: true, down: true }
  return owner === 'player'
    ? { ...controls, player: closed }
    : { ...controls, opponent: closed, ai: false }
}

function futureCommand(before: FightState, after: FightState): FutureFrame['command'] {
  const trace = after.arsenalTrace
  if (trace && trace !== before.arsenalTrace && trace.side === 'opponent')
    return {
      kind: 'special',
      auraCharged: false,
      arsenal: trace.command,
      rngBefore: trace.rngBefore,
    }
  return newAttack(before.opponent.attack, after.opponent)
}

function newAttack(
  before: ArcadeFighter['attack'],
  fighter: ArcadeFighter,
): FutureFrame['command'] {
  const attack = fighter.attack
  if (!attack || attack.frame !== 0) return null
  if (before?.frame === 0 && before.moveId === attack.moveId) return null
  return {
    kind: attack.kind,
    moveId: attack.moveId,
    variant: attack.variant,
    superThrow: attack.superThrow,
    auraCharged: attack.auraCharged,
  }
}

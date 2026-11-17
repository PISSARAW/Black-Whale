import { EMPTY_INPUT, type ArcadeFighter, type FightState } from './types'
import type { FutureControls, FutureFrame, SimulateFutureFrame } from './parallelFutureTypes'
import { FUTURE_WINDOW_FRAMES } from './parallelFutureTypes'
import { immutableFightSnapshot } from './immutableFightSnapshot'

/** Uses the same fixed step, projectiles, impacts, AI cadence and RNG as the real duel. */
export function forecastParallelFuture(
  state: FightState,
  controls: FutureControls,
  simulate: SimulateFutureFrame,
): readonly FutureFrame[] {
  const future = state.parallelFuture!
  let predicted: FightState = { ...state, parallelFuture: undefined, forecastSimulation: true }
  const held = predictionControls(controls, future.owner)
  const frames: FutureFrame[] = []
  for (let frame = 0; frame < FUTURE_WINDOW_FRAMES; frame++) {
    const before = predicted.opponent.attack
    if (predicted.phase === 'fighting') predicted = simulate(predicted, held)
    frames.push({
      scene: {
        bungeeGum: predicted.bungeeGum,
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
      command: newAttack(before, predicted.opponent),
    })
  }
  return immutableFightSnapshot(frames)
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
    auraCharged: attack.auraCharged,
  }
}

import type { CombatState } from '../../combat/types'

function rounded(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000
}

export function stateChecksum(state: CombatState): string {
  const stable = JSON.stringify({
    clock: rounded(state.clock),
    hitstop: rounded(state.hitstop),
    outcome: state.outcome,
    player: fighterDigest(state.player),
    opponent: fighterDigest(state.opponent),
    lastEvent: state.lastEvent,
    terrain: state.terrain.id,
    tethers: state.tethers.map((tether) => ({
      ...tether,
      restLength: rounded(tether.restLength),
      remaining: rounded(tether.remaining),
    })),
    nenEffects: state.nenEffects,
    physicalObjects: state.physicalObjects,
    lastHatsuBySide: state.lastHatsuBySide,
    environment: state.environment,
    opponentMemory: state.opponentMemory,
  })
  let hash = 0x811c9dc5
  for (let index = 0; index < stable.length; index += 1) {
    hash ^= stable.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function fighterDigest(fighter: CombatState['player']) {
  return {
    ...fighter,
    aura: rounded(fighter.aura),
    position: fighter.position.map(rounded),
    movement: fighter.movement.map(rounded),
    height: rounded(fighter.height),
    jump: fighter.jump ? { ...fighter.jump, elapsed: rounded(fighter.jump.elapsed) } : null,
    cooldown: rounded(fighter.cooldown),
    recovery: rounded(fighter.recovery),
  }
}

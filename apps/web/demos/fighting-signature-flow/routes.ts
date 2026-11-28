import { SIGNATURE_COMBOS, signatureHits } from '../../src/lib/fighting/signatureCombos'
import {
  createSignatureFight,
  playSignatureCombo,
} from '../../src/lib/fighting/signatureComboRunner'
import { COMBAT_FIGHTERS } from '../../src/lib/fighting/combatRoutes'
import { fighterDefinition } from '../../src/lib/fighting/roster'
import {
  activeHitbox,
  boxesOverlap,
  contactPoint,
  hurtboxes,
  type FightBox,
} from '../../src/lib/fighting/frameData'
import { fightWorldX, fightWorldY } from '../../src/lib/fighting/fightCoordinates'
import type { FightState } from '../../src/lib/fighting/types'

/** The first active frame of one strike, measured in scene units. */
export interface Strike {
  /** Simulation index of the first active frame. */
  sim: number
  /** Centre of the active hitbox. */
  hit: { x: number; y: number }
  /** Striker's root. */
  root: { x: number; y: number }
  facing: 1 | -1
  /** Root velocity over the two frames before the strike, scene units per simulation frame. */
  velocity: number
  /** Opponent root relative to the striker, signed along the striker's facing. */
  reach: number
  /** Where the camera frames the pair at this frame (`pairCentre`). */
  centre: number
  kind: string
}

export interface Route {
  id: string
  name: string
  title: string
  mirrored: boolean
  states: FightState[]
  from: number
  to: number
  strikes: Strike[]
  error?: string
}

/** Every fighter's real signature route, played by the real commands, in both facings. */
export function recordRoutes(only?: readonly string[]): Route[] {
  return COMBAT_FIGHTERS.filter((id) => !only || only.includes(id)).flatMap((id) => [
    recordRoute(id, false),
    recordRoute(id, true),
  ])
}

function recordRoute(id: string, mirrored: boolean): Route {
  const combo = SIGNATURE_COMBOS.find((c) => c.fighter === id)
  if (!combo) throw new Error(`No signature for ${id}`)
  const states: FightState[] = []
  const run = playSignatureCombo(combo, createSignatureFight(combo, { mirrored, gap: 5 }), {
    onFrame: (state) => states.push(state),
  })
  const active = states.flatMap((s, i) => (s.player.attack ? [i] : []))
  const expected = signatureHits(combo).length
  return {
    id,
    name: fighterDefinition(id).name,
    title: combo.title[1],
    mirrored,
    states,
    from: Math.max(0, (active[0] ?? 0) - 3),
    to: Math.min(states.length - 1, (active.at(-1) ?? states.length - 1) + 24),
    strikes: findStrikes(states),
    error:
      run.reached < combo.steps.length || run.contacts.length < expected
        ? `Route incomplete: ${run.reached}/${combo.steps.length} steps, ${run.contacts.length}/${expected} contacts`
        : undefined,
  }
}

/** A strike starts where a hitbox appears; ranged and utility moves have none and never cut. */
export function findStrikes(states: readonly FightState[]): Strike[] {
  const strikes: Strike[] = []
  for (let sim = 3; sim < states.length; sim++) {
    const box = activeHitbox(states[sim].player)
    if (!box || activeHitbox(states[sim - 1].player)) continue
    strikes.push(strikeAt(states, sim, box))
  }
  return strikes
}

function strikeAt(states: readonly FightState[], sim: number, box: FightBox): Strike {
  const { player, opponent } = states[sim]
  const before = states[sim - 2].player
  const point = sparkPoint(box, hurtboxes(opponent))
  return {
    sim,
    hit: { x: fightWorldX(point.x), y: fightWorldY(point.y) },
    root: { x: fightWorldX(player.x), y: fightWorldY(player.y) },
    facing: player.facing === -1 ? -1 : 1,
    velocity: (fightWorldX(player.x) - fightWorldX(before.x)) / 2,
    reach: (fightWorldX(opponent.x) - fightWorldX(player.x)) * player.facing,
    centre: pairCentre(fightWorldX(player.x), fightWorldX(opponent.x)),
    kind: player.attack?.kind ?? 'none',
  }
}

/** The impact spark sits where the hitbox meets the target; a whiff keeps the hitbox centre. */
function sparkPoint(box: FightBox, targets: readonly FightBox[]) {
  const touched = targets.find((t) => boxesOverlap(box, t))
  if (touched) return contactPoint(box, touched)
  return { x: (box.left + box.right) / 2, y: (box.bottom + box.top) / 2 }
}

/** Between the two bodies; a target knocked far away does not drag the striker off frame. */
export function pairCentre(player: number, opponent: number) {
  const half = (opponent - player) / 2
  // Too far apart for one portrait frame: follow the striker, looking slightly towards the target.
  if (Math.abs(half) > 0.9) return player + Math.sign(half) * 0.2
  return player + Math.max(-0.7, Math.min(0.7, half))
}

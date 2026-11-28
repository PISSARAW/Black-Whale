import { SIGNATURE_COMBOS, signatureHits } from '../../src/lib/fighting/signatureCombos'
import {
  createSignatureFight,
  playSignatureCombo,
} from '../../src/lib/fighting/signatureComboRunner'
import { COMBAT_FIGHTERS } from '../../src/lib/fighting/combatRoutes'
import { fighterDefinition } from '../../src/lib/fighting/roster'
import { fighterKeyedMove } from '../../src/lib/fighting/fighterKeyedMove'
import { attackData } from '../../src/lib/fighting/frameData'
import { moveById } from '../../src/lib/fighting/movesets'
import { sampleTimeline } from '../../src/lib/fighting/keyPoseTimeline'
import type { FightPose } from '../../src/lib/fighting/fightPose'
import type { FightState } from '../../src/lib/fighting/types'

export const FPS = 30
export const BEAT = 12
export const LENGTH = BEAT * 4
export interface Clip {
  id: string
  name: string
  title: string
  states: FightState[]
  from: number
  to: number
  entry: FightPose
  exit: FightPose
  reached: number
  expected: number
  contacts: number
  error?: string
}

/** Real commands, including each signature's preparation. Incomplete routes stay visible. */
export function recordClips(only?: string[]) {
  return COMBAT_FIGHTERS.filter((id) => !only || only.includes(id)).map((id) => {
    const combo = SIGNATURE_COMBOS.find((c) => c.fighter === id)
    if (!combo) throw new Error(`No signature for ${id}`)
    const states: FightState[] = []
    const run = playSignatureCombo(
      combo,
      createSignatureFight(combo, { mirrored: false, gap: 5 }),
      {
        onFrame: (state) => states.push(state),
      },
    )
    if (!states.length) throw new Error(`Empty signature: ${id}`)
    // Keep the whole performed route; skip only idle lead-in and trailing wait frames.
    const active = states.flatMap((s, i) => (s.player.attack ? [i] : []))
    const from = Math.max(0, (active[0] ?? 0) - 3)
    const to = Math.min(states.length - 1, (active.at(-1) ?? states.length - 1) + 3)
    const expected = signatureHits(combo).length
    return {
      id,
      name: fighterDefinition(id).name,
      title: combo.title[0],
      states,
      from,
      to,
      entry: pose(states[active[0] ?? from]),
      exit: pose(states[active.at(-1) ?? to]),
      reached: run.reached,
      expected,
      contacts: run.contacts.length,
      error:
        run.reached < combo.steps.length || run.contacts.length < expected
          ? `Route incomplete: ${run.reached}/${combo.steps.length} steps, ${run.contacts.length}/${expected} contacts`
          : undefined,
    } satisfies Clip
  })
}

function pose(state: FightState): FightPose {
  const fighter = state.player
  const attack = fighter.attack
  const move = moveById(attack?.moveId)
  if (!attack || !move) return {}
  return sampleTimeline(fighterKeyedMove(fighter, move.slot).timeline, {
    frame: attack.frame,
    frames: attackData(attack.kind, fighter),
    continuous: true,
  })
}

/** Joint-angle similarity of authored poses, plus motion direction and altitude. */
export function cutDistance(a: Clip, b: Clip) {
  const joints = [
    'body',
    'chest',
    'leadShoulder',
    'rearShoulder',
    'leadElbow',
    'rearElbow',
    'leadHip',
    'rearHip',
  ] as const
  let score = 0
  for (const joint of joints) {
    const first = a.exit[joint] ?? [0, 0, 0]
    const next = b.entry[joint] ?? [0, 0, 0]
    for (let axis = 0; axis < 3; axis++) score += (first[axis] - next[axis]) ** 2
  }
  const out = a.states[a.to].player
  const into = b.states[b.from].player
  return score + (out.facing === into.facing ? 0 : 6) + Math.min(4, Math.abs(out.y - into.y))
}

export function orderClips(clips: Clip[]) {
  const pool = [...clips]
  const ordered: Clip[] = []
  if (pool.length) ordered.push(pool.shift()!)
  while (pool.length) {
    const previous = ordered.at(-1)!
    let best = 0
    for (let i = 1; i < pool.length; i++)
      if (cutDistance(previous, pool[i]) < cutDistance(previous, pool[best])) best = i
    ordered.push(pool.splice(best, 1)[0])
  }
  return ordered
}

export function simulationFrame(clip: Clip, local: number) {
  // Preserve simulation order; sampling compresses the route to four musical beats.
  const progress = Math.min(1, Math.max(0, local / (LENGTH - 1)))
  return Math.round(clip.from + (clip.to - clip.from) * progress)
}

/** Impact sound cues follow real simulation contacts, including blocks. */
export function impactCues(clip: Clip, start: number) {
  let seen = clip.states[Math.max(0, clip.from - 1)].impact?.sequence ?? -1
  const cues: { at: number; kind: 'hit' | 'crit' }[] = []
  for (let sim = clip.from; sim <= clip.to; sim++) {
    const impact = clip.states[sim].impact
    if (!impact || impact.sequence === seen) continue
    seen = impact.sequence
    if (impact.attacker !== 'player') continue
    const local = Math.round(((sim - clip.from) / Math.max(1, clip.to - clip.from)) * (LENGTH - 1))
    cues.push({ at: start + local, kind: impact.critical ? 'crit' : 'hit' })
  }
  return cues
}

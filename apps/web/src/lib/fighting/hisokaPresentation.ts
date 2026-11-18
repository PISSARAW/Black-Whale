import { hisokaTechnique } from './hisokaTechnique'
import { selectedGumLink, ownedGumLinks } from './bungeeNetwork'
import type { ArcadeFighter, FightSide, FightState } from './types'

export const HISOKA_ACCENT_FRAMES = 18
export const HISOKA_ACCENTS = [
  'attach',
  'pull',
  'rebound',
  'release',
  'texture',
  'textureEnd',
] as const
type Accent = (typeof HISOKA_ACCENTS)[number]
export type HisokaFrames = Record<Accent, number | null> & { hidden: boolean }
const SIDES = ['player', 'opponent'] as const
const empty = (): HisokaFrames => ({
  attach: null,
  pull: null,
  rebound: null,
  release: null,
  texture: null,
  textureEnd: null,
  hidden: false,
})

function snapshot(state: FightState) {
  return {
    key: `${state.player.id}:${state.opponent.id}:${state.roundNumber}:${state.environment.stageId}`,
    frame: state.frame,
    phase: state.phase,
    impact: state.impact?.sequence,
    player: actor(state, 'player'),
    opponent: actor(state, 'opponent'),
  }
}
type Snapshot = ReturnType<typeof snapshot>
function resets(before: Snapshot, after: Snapshot) {
  return before.key !== after.key || after.frame < before.frame || after.phase !== 'fighting'
}
function actor(state: FightState, side: FightSide) {
  const gum = state.bungeeGum?.owner === side ? state.bungeeGum : null
  const link = selectedGumLink(state, side)
  return {
    linked: Boolean(link),
    newest: Math.max(-1, ...ownedGumLinks(state, side).map((entry) => entry.id)),
    target: gum?.target ?? '',
    hidden: Boolean(link?.hidden),
    pulling: Boolean(link && link.motion !== 'idle'),
    rebound: link?.motion === 'rebound',
    texture: Boolean(state[side].textureSurprise),
  }
}
type Actor = ReturnType<typeof actor>
function attachmentAttack(fighter: ArcadeFighter) {
  const a = fighter.attack
  return (
    a?.hatsuSource === 'hisoka' &&
    a.kind === 'special' &&
    hisokaTechnique(fighter, a.moveId) === 'attach'
  )
}
function freshContact(before: Snapshot, state: FightState, side: FightSide) {
  const hit = state.impact
  if (!hit || hit.sequence === before.impact || hit.attacker !== side) return false
  return !hit.blocked && !hit.avoided && !hit.invulnerable && attachmentAttack(state[side])
}
function changes(old: Actor, next: Actor, reattached: boolean): Accent[] {
  const events: Accent[] = []
  if (attachmentChanged(old, next, reattached)) events.push('attach')
  if (next.pulling && !old.pulling) events.push(next.rebound ? 'rebound' : 'pull')
  if (old.linked && !next.linked) events.push('release')
  if (old.texture !== next.texture) events.push(next.texture ? 'texture' : 'textureEnd')
  return events
}
function attachmentChanged(old: Actor, next: Actor, reattached: boolean) {
  return next.linked && (!old.linked || next.newest > old.newest || reattached)
}
function age(start: number | null, frame: number) {
  return start !== null && frame - start < HISOKA_ACCENT_FRAMES ? frame - start : null
}
function observeSide(
  before: Snapshot,
  after: Snapshot,
  c: { state: FightState; side: FightSide; held: HisokaFrames },
) {
  const { state, side, held } = c
  const old = before[side],
    next = after[side]
  for (const key of changes(old, next, freshContact(before, state, side))) held[key] = after.frame
  // Never continue an attachment or cloth reveal after the underlying effect has been removed.
  if (!next.linked) for (const key of ['attach', 'pull', 'rebound'] as const) held[key] = null
  if (!next.texture) held.texture = null
  if (old.linked && !next.linked) held.hidden = old.hidden
  if (next.linked) held.hidden = next.hidden
  return {
    ...Object.fromEntries(HISOKA_ACCENTS.map((key) => [key, age(held[key], after.frame)])),
    hidden: held.hidden,
  } as HisokaFrames
}

/** Observes confirmed results, never a button press; pauses and rebuilds cannot replay an accent. */
export function createHisokaPresentationClock() {
  let previous: Snapshot | null = null
  let held = { player: empty(), opponent: empty() }
  return (state: FightState): Record<FightSide, HisokaFrames> => {
    const next = snapshot(state)
    if (!previous || resets(previous, next)) {
      previous = next
      held = { player: empty(), opponent: empty() }
      return { player: empty(), opponent: empty() }
    }
    const shown = { player: empty(), opponent: empty() }
    for (const side of SIDES)
      shown[side] = observeSide(previous, next, { state, side, held: held[side] })
    previous = next
    return shown
  }
}

import { airRecoveryAvailable } from './airRecovery'
import type { FightImpact, FightSide, FightState } from './types'

export const PURSUIT_RECOVERY_SIDES = ['player', 'opponent'] as const
const DISPLAY_FRAMES = 24

type Cue = { kind: 'ready' | 'reply'; frame: number }
type Cues = Partial<Record<FightSide, Cue>>

/** Observe the playable state, then the next confirmed contact, using the replay clock. */
export function createPursuitRecoveryCues() {
  let last: FightState | undefined
  let openings: Cues = {}
  let cues: Cues = {}
  return (state: FightState): Cues => {
    if (last === state) return cues
    if (discontinuous(last, state)) {
      openings = {}
      last = undefined
    }
    const contact = newContact(last, state)
    for (const side of PURSUIT_RECOVERY_SIDES)
      openings[side] = nextCue(state, side, { cue: openings[side], contact })
    last = state
    cues = Object.fromEntries(
      Object.entries(openings).filter(([, cue]) => cue && state.frame - cue.frame < DISPLAY_FRAMES),
    )
    return cues
  }
}

function discontinuous(last: FightState | undefined, state: FightState) {
  return (
    !last ||
    state.frame < last.frame ||
    state.roundNumber !== last.roundNumber ||
    state.player.id !== last.player.id ||
    state.opponent.id !== last.opponent.id
  )
}

function newContact(last: FightState | undefined, state: FightState): FightImpact | undefined {
  const impact = state.impact
  if (!impact || impact.sequence === last?.impact?.sequence || impact.damage <= 0) return
  return impact
}

function nextCue(
  state: FightState,
  side: FightSide,
  options: { cue?: Cue; contact?: FightImpact },
): Cue | undefined {
  const { cue, contact } = options
  const fighter = state[side]
  if (contact && contact.attacker !== side) return
  if (!cue) return openingCue(state, side)
  if (cue.kind !== 'ready') return cue
  if (directContact(contact) && state.frame - cue.frame < DISPLAY_FRAMES)
    return { kind: 'reply', frame: state.frame }
  if (fighter.y > 0) return cue
}

function openingCue(state: FightState, side: FightSide): Cue | undefined {
  if (state.phase === 'fighting' && !state.hitstop && airRecoveryAvailable(state[side]))
    return { kind: 'ready', frame: state.frame }
}

function directContact(impact?: FightImpact): boolean {
  return Boolean(
    impact &&
    !impact.blocked &&
    !impact.parried &&
    !impact.avoided &&
    !impact.invulnerable &&
    impact.projectileId === null,
  )
}

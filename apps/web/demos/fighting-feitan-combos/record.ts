import { combatRoutesFor, type CombatRoute } from '../../src/lib/fighting/combatRoutes'
import { runBaselineRoute } from '../../src/lib/fighting/combatBaselineRoutes'
import { createReplayPlayer } from '../../src/lib/fighting/fightReplayPlayer'
import { combatRouteContacts } from '../../src/lib/fighting/combatRouteContacts'
import { moveForSlot } from '../../src/lib/fighting/movesets'
import { SIGNATURE_COMBOS } from '../../src/lib/fighting/signatureCombos'
import {
  createSignatureFight,
  playSignatureCombo,
} from '../../src/lib/fighting/signatureComboRunner'
import { tickFight } from '../../src/lib/fighting/engine'
import { EMPTY_INPUT, type FightState } from '../../src/lib/fighting/types'
import { recordAirRoute } from './airRoute'

export type Family = 'Basics' | 'Academy' | 'Whiff punish' | 'Wakeup' | 'Kameo' | 'Signature'

export interface Combo {
  id: string
  family: Family
  title: string
  kameo?: string
  /** Input and English name of each command, in order. */
  steps: { input: string; name: string }[]
  states: FightState[]
  from: number
  to: number
  hits: number
  damage: number
  error?: string
}

const FIGHTER = 'feitan'
const TAIL = 50

function family(route: CombatRoute): Family {
  if (route.kameo) return 'Kameo'
  if (route.whiff) return 'Whiff punish'
  if (route.wakeup || route.id.includes(':wakeup')) return 'Wakeup'
  if (['confirm', 'low', 'punish', 'air'].some((k) => route.id === `${FIGHTER}:${k}`))
    return 'Basics'
  return 'Academy'
}

function steps(route: CombatRoute) {
  return route.moves.map((slot) => {
    const move = moveForSlot(FIGHTER, slot)
    return { input: move?.input ?? slot, name: move?.nameEn ?? slot }
  })
}

/** Plays the recorded production replay back, keeping every simulated frame. */
function replayStates(replay: Parameters<typeof createReplayPlayer>[0]) {
  const states: FightState[] = []
  const player = createReplayPlayer(replay)
  states.push(player.state)
  for (let n = 0; !player.done && n < 4000; n++) states.push(player.advance(1 / 60))
  if (player.error) throw Error(`Replay ${player.error}`)
  return settle(states)
}

/** The recording stops at completion; keep simulating so the last hit reads on screen. */
function settle(states: FightState[]) {
  let state = states.at(-1)!
  for (let i = 0; i < TAIL + 10; i++) {
    state = tickFight(state, EMPTY_INPUT, {
      dt: 1 / 60,
      ai: false,
      opponentInput: { ...EMPTY_INPUT, guard: true },
    })
    states.push(state)
  }
  return states
}

/** The combo starts at the first command and ends once the target has been down a moment. */
function window(states: FightState[]) {
  const active = states.flatMap((s, i) => (s.player.attack ? [i] : []))
  const impacts = states.flatMap((s, i) =>
    s.impact && s.impact.sequence !== states[i - 1]?.impact?.sequence ? [i] : [],
  )
  const from = Math.max(0, (active[0] ?? 0) - 8)
  const to = Math.min(states.length - 1, Math.max(active.at(-1) ?? 0, impacts.at(-1) ?? 0) + TAIL)
  return { from, to }
}

function playerContacts(states: FightState[]) {
  return states.filter(
    (s, i) =>
      s.impact &&
      s.impact.attacker === 'player' &&
      s.impact.sequence !== states[i - 1]?.impact?.sequence,
  )
}

/** Same check as the route tests: every expected contact lands in one unbroken counter. */
function verify(route: CombatRoute, states: FightState[]) {
  const contacts = playerContacts(states).map((s) => s.impact!)
  const expected = combatRouteContacts(route).length
  const broken = contacts.some((c, i) => c.blocked || c.comboHits !== i + 1)
  if (contacts.length < expected || broken)
    return `${contacts.length}/${expected} contacts${broken ? ', counter broken' : ''}`
  return undefined
}

function recordRoute(route: CombatRoute): Combo {
  const states =
    route.kind === 'air'
      ? recordAirRoute(route)
      : replayStates(
          runBaselineRoute({ route, terrain: 'neutral', mirrored: false, corner: false, gap: 4 })
            .replay,
        )
  const contacts = playerContacts(states)
  return {
    id: route.id,
    family: family(route),
    title: route.title[1],
    kameo: route.kameo?.id,
    steps: steps(route),
    states,
    ...window(states),
    hits: contacts.length,
    damage: Math.max(0, ...states.map((s) => s.opponent.comboDamage ?? 0)),
    error: verify(route, states),
  }
}

function recordSignature(): Combo {
  const combo = SIGNATURE_COMBOS.find((c) => c.fighter === FIGHTER)!
  const states: FightState[] = []
  const run = playSignatureCombo(combo, createSignatureFight(combo, { mirrored: false, gap: 5 }), {
    onFrame: (state) => states.push(state),
  })
  let state = run.state
  for (let i = 0; i < TAIL; i++) {
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
    states.push(state)
  }
  const expected = combo.steps.length
  return {
    id: combo.id,
    family: 'Signature',
    title: combo.title[1],
    steps: [],
    states,
    ...window(states),
    hits: run.contacts.length,
    damage: Math.max(0, ...states.map((s) => s.opponent.comboDamage ?? 0)),
    error: run.reached < expected ? `${run.reached}/${expected} steps` : undefined,
  }
}

const ORDER: Family[] = ['Basics', 'Academy', 'Whiff punish', 'Wakeup', 'Kameo', 'Signature']

/** Every Feitan combo the game defines, played by real commands, signature last. */
export function recordFeitanCombos(): Combo[] {
  const combos = [...combatRoutesFor(FIGHTER).map(recordRoute), recordSignature()]
  return combos.sort((a, b) => ORDER.indexOf(a.family) - ORDER.indexOf(b.family))
}

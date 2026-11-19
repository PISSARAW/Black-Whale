import { beginFight, createFight } from '../../src/lib/fighting/engine'
import { initialReplayState } from '../../src/lib/fighting/fightReplayCommands'
import { FIXED_STEP } from '../../src/lib/fighting/fightClock'
import { packReplayInput } from '../../src/lib/fighting/fightReplayInput'
import { kameoOnStage, withKameos } from '../../src/lib/fighting/kameos/state'
import { ROSTER_TECHNIQUES } from '../../src/lib/fighting/rosterTechniqueDirection'
import { performanceTape } from '../fighting-performance/scenario'
import { stressManifested, type StressScenario } from '../fighting-performance/stressScenario'
import type { ReplayCommand, ReplayPacket } from '../../src/lib/fighting/fightReplayTypes'
import type { ChrolloPage } from '../../src/lib/fighting/chrolloBook'
import type { FightStageId } from '../../src/lib/fighting/stages'
import type { FightInput, FightState, FighterId } from '../../src/lib/fighting/types'

/** One measured duel: a start state and the packet the network would carry for each frame. */
export interface BudgetScenario {
  id: string
  group: 'roster' | 'worst-case'
  state: FightState
  frames: number
  packet(state: FightState, frame: number): ReplayPacket
  /** True on frames where the worst case the scenario exists for is really on stage. */
  manifested(state: FightState): boolean
}

export const ROSTER_IDS = Object.keys(ROSTER_TECHNIQUES) as FighterId[]
const FRAMES = 900

/** Deterministic, busy input pattern: movement, guard, jump, aura, Hatsu and kameo presses. */
export function busyInput(frame: number, seat: number): FightInput {
  const r = (frame * 7919 + seat * 104729) % 97
  return {
    left: r < 20,
    right: r > 70,
    jump: r % 31 === 0,
    down: r % 11 === 0,
    guard: r % 13 === 0,
    aura: r % 17 === 0,
    hatsu: r % 23 === 0,
    kameo: r % 89 === 0,
  }
}

/** Specials on both seats every 45 frames, so ordinary Hatsu really start. */
function specials(state: FightState, frame: number): ReplayCommand[] {
  if (state.phase === 'ready') return [{ kind: 'start' }]
  if (state.phase === 'finished') return [{ kind: 'round' }]
  if (frame % 45 === 0) return [{ kind: 'move', side: 'player', action: 'special', input: 0 }]
  if (frame % 45 === 22) return [{ kind: 'move', side: 'opponent', action: 'special', input: 0 }]
  return []
}

type Inputs = (frame: number) => { player: FightInput; opponent: FightInput }
const busy: Inputs = (frame) => ({ player: busyInput(frame, 0), opponent: busyInput(frame, 1) })

function live(inputs: Inputs = busy) {
  return (state: FightState, frame: number): ReplayPacket => {
    const { player, opponent } = inputs(frame)
    return [FIXED_STEP, packReplayInput(player), packReplayInput(opponent), specials(state, frame)]
  }
}

const versus = (a: FighterId, b: FighterId, arena = false) =>
  beginFight(
    createFight(a, b, {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: { arenaInteractions: arena },
    }),
  )

function rosterScenario(index: number): BudgetScenario {
  const player = ROSTER_IDS[index]
  const opponent = ROSTER_IDS[(index + 7) % ROSTER_IDS.length]
  return {
    id: `${player}-vs-${opponent}`,
    group: 'roster',
    state: versus(player, opponent),
    frames: FRAMES,
    packet: live(),
    manifested: (state) => state.phase === 'fighting',
  }
}

const STRESS: Array<{ fighter: FighterId; scenario: StressScenario; stage: FightStageId }> = [
  { fighter: 'tserriednich', scenario: 'future', stage: 'banquet-hall' },
  { fighter: 'franklin', scenario: 'projectiles', stage: 'banquet-hall' },
  { fighter: 'camilla', scenario: 'post-mortem', stage: 'whale-hold' },
  { fighter: 'yokotani', scenario: 'guards', stage: 'heilly-hideout' },
  { fighter: 'biscuit', scenario: 'transformation', stage: 'whale-hold' },
]

/** The performance bench's own stress tapes, replayed packet by packet. */
function stressScenario(entry: (typeof STRESS)[number]): BudgetScenario {
  const tape = performanceTape({ ...entry, effects: true })
  return {
    id: `stress-${entry.scenario}`,
    group: 'worst-case',
    state: initialReplayState(tape.setup),
    frames: tape.packets.length,
    packet: (_, frame) => tape.packets[frame],
    manifested: (state) => stressManifested(state, entry.scenario),
  }
}

const CHROLLO_PAGES: ChrolloPage[] = [
  'hisoka:neutralSpecial',
  'hisoka:downSpecial',
  'kurapika:neutralSpecial',
  'franklin:neutralSpecial',
  'machi:neutralSpecial',
  'feitan:neutralSpecial',
]

function chrolloBook(): BudgetScenario {
  const base = versus('chrollo', 'hisoka')
  const book = { pages: CHROLLO_PAGES, page: 0, open: true, bookmark: null }
  return {
    id: 'chrollo-six-pages',
    group: 'worst-case',
    state: { ...base, player: { ...base.player, aura: 100, chrolloBook: book } },
    frames: FRAMES,
    packet: live(),
    manifested: (state) => (state.player.chrolloBook?.pages.length ?? 0) >= CHROLLO_PAGES.length,
  }
}

function kameoDuel(): BudgetScenario {
  const state = withKameos(
    createFight('kurapika', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
    { player: 'tubeppa', opponent: 'luzurus' },
  )
  return {
    id: 'kameos-both-seats',
    group: 'worst-case',
    state: beginFight(state),
    frames: FRAMES,
    packet: live(),
    manifested: (state) =>
      kameoOnStage(state.kameos?.player) || kameoOnStage(state.kameos?.opponent),
  }
}

/** Hisoka's terrain application tethers gum to a cover: the arena's richest state. */
function arenaDuel(): BudgetScenario {
  return {
    id: 'arena-interactive',
    group: 'worst-case',
    state: versus('hisoka', 'machi', true),
    frames: FRAMES,
    packet: live((frame) => ({
      player: { ...busyInput(frame, 0), arena: frame % 50 < 3 },
      opponent: { ...busyInput(frame, 1), arena: frame % 50 >= 25 && frame % 50 < 28 },
    })),
    manifested: (state) =>
      Boolean(state.arena && Object.keys({ ...state.arena.pending, ...state.arena.tether }).length),
  }
}

export function budgetScenarios(): BudgetScenario[] {
  return [
    ...ROSTER_IDS.map((_, index) => rosterScenario(index)),
    ...STRESS.map(stressScenario),
    chrolloBook(),
    kameoDuel(),
    arenaDuel(),
  ]
}

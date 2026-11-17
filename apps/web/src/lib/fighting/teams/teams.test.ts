import { describe, expect, it } from 'vitest'
import {
  createTeamFight,
  startTeamFight,
  tickTeamFight,
  nextTeamRound,
  requestTeamAssist,
} from '../teamMatch'
import { performMove, performAuraAttack } from '../engine'
import { toggleEmperorTime } from '../kurapikaActions'
import { performArenaAction, arenaObjects } from '../arenaActions'
import { damageArenaObject } from '../arenaSimulation'
import { interactWithPreparation } from '../preparationSimulation'
import { teamRelayReady } from '../teamRelayRules'
import { fightReplayHash } from '../fightReplayHash'
import { FIGHTING_ROSTER } from '../roster'
import { teamAssistBlock, teamAssistOptions } from './availability'
import { teamWorldEngaged } from './commitments'
import { createTeamRuntime } from './runtime'
import { teamLivingForView } from './status'
import { carryTeamTerrain } from './terrain'
import {
  defaultTeamDraft,
  moveTeamSlot,
  readTeamDraft,
  saveTeamDraft,
  TEAM_DRAFT_KEY,
  validTeamDraft,
} from './draft'
import { EMPTY_INPUT, type FightState, type FighterId, type FightInput } from '../types'
const idle = { player: EMPTY_INPUT, opponent: EMPTY_INPUT }
function duel(id: FighterId = 'hisoka', interactive = true) {
  const player = [
    id,
    ...FIGHTING_ROSTER.map((f) => f.id)
      .filter((f) => f !== id)
      .slice(0, 2),
  ]
  return startTeamFight(
    createTeamFight(
      { player, opponent: ['theta', 'franklin', 'hanzo'] },
      { arenaInteractions: interactive },
    ),
  )
}
function frames(state: FightState, count: number, player: Partial<FightInput> = {}) {
  for (let i = 0; i < count; i++)
    state = tickTeamFight(state, { ...idle, player: { ...EMPTY_INPUT, ...player } }, 1 / 60)
  return state
}
function atGate(state: FightState): FightState {
  return { ...state, player: { ...state.player, x: 10 }, opponent: { ...state.opponent, x: 90 } }
}
const utility = (state: FightState) => performArenaAction(state, 'player', performAuraAttack)
function winPhysically(initial: FightState) {
  let state = initial
  for (let i = 0; i < 4000 && state.phase === 'fighting'; i++) {
    const gap = Math.abs(state.player.x - state.opponent.x)
    if (gap <= 7) state = performMove({ state, side: 'player', action: 'heavy' })
    state = frames(state, 1, { right: gap > 6 })
  }
  return state
}
function memory() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
  }
}

describe('team relay owns its world commitments', () => {
  it.each(FIGHTING_ROSTER.map((f) => f.id))(
    'keeps the ordinary starting relay available to %s',
    (id) => {
      const state = atGate(duel(id))
      expect(teamAssistBlock(state, 'player', 1)).toBeNull()
      expect(requestTeamAssist(state, 'player', 1).player.id).toBe(
        state.teamMatch!.seats.player.roster[1],
      )
    },
  )
  it('refuses Hisoka’s paid anchor until it is actually released, without refunding its cost', () => {
    const original = atGate(duel()),
      before = fightReplayHash(original)
    let state = utility(original)
    expect(state.player.aura).toBeLessThan(original.player.aura)
    expect(teamAssistBlock(state, 'player', 1)).toBe('body')
    state = frames(state, 20)
    expect(state.arena?.tether.player).toBeDefined()
    expect(teamWorldEngaged(state, 'player')).toBe(true)
    expect(teamWorldEngaged(state, 'opponent')).toBe(false)
    expect(teamAssistBlock(state, 'player', 1)).toBe('commitment')
    expect(requestTeamAssist(state, 'player', 1)).toBe(state)
    expect(fightReplayHash(original)).toBe(before)
    state = utility(utility(state))
    expect(state.arena?.tether.player).toBeUndefined()
    expect(teamAssistBlock(state, 'player', 1)).toBeNull()
    const aura = state.player.aura
    const entered = requestTeamAssist(state, 'player', 1)
    expect(entered.teamMatch!.seats.player.members[0].aura).toBe(aura)
    expect(entered.player.aura).toBe(entered.teamMatch!.seats.player.members[1].aura)
  })
  it.each(['machi', 'shizuku', 'chrollo'] as const)(
    'retains %s while a real terrain commitment remains',
    (id) => {
      let state = duel(id)
      state = { ...state, player: { ...state.player, x: 27 } }
      state = frames(utility(state), 20)
      expect(teamWorldEngaged(state, 'player')).toBe(true)
      for (let i = 0; i < 100 && state.player.x > 10; i++) state = frames(state, 1, { left: true })
      expect(state.player.x).toBeLessThanOrEqual(10)
      expect(teamAssistBlock(state, 'player', 1)).toBe('commitment')
      expect(requestTeamAssist(state, 'player', 1)).toBe(state)
    },
  )
  it('keeps an actual mark owned by Chrollo while the marked crate is inside the opponent’s Blinky', () => {
    let state = startTeamFight(
      createTeamFight(
        { player: ['chrollo', 'hisoka', 'kurapika'], opponent: ['shizuku', 'theta', 'franklin'] },
        { arenaInteractions: true },
      ),
    )
    state = { ...state, player: { ...state.player, x: 27 }, opponent: { ...state.opponent, x: 41 } }
    state = frames(utility(state), 20)
    expect(state.battlefield!.entities[0].arena!.sun).toBe('player')
    state = performArenaAction(state, 'opponent', performAuraAttack)
    state = frames(state, 20)
    expect(state.arena!.stored.opponent).toBe('arena:crate:34')
    expect(state.battlefield!.entities[0].present).toBe(false)
    for (let i = 0; i < 100 && state.player.x > 10; i++) state = frames(state, 1, { left: true })
    expect(teamWorldEngaged(state, 'player')).toBe(true)
    expect(teamAssistBlock(state, 'player', 1)).toBe('commitment')
  })
  it('does not retain an observer merely for actually seeing a manifestation', () => {
    let state = frames(utility(atGate(duel())), 20)
    expect(state.opponent.hatsuEffects.witnessedHatsu).toBe('hisoka')
    expect(teamAssistBlock(state, 'opponent', 1)).toBeNull()
    const witness = state.opponent.hatsuEffects.witnessedHatsu
    state = requestTeamAssist(state, 'opponent', 1)
    expect(state.opponent.hatsuEffects.witnessedHatsu).toBeNull()
    expect(state.teamMatch!.seats.opponent.members[0].hatsuEffects.witnessedHatsu).toBe(witness)
  })
  it('permits resting Kurapika to leave with actual lifespan already spent, never with Emperor Time active', () => {
    let state = atGate(duel('kurapika', false))
    state = toggleEmperorTime(state, 'player')
    state = frames(state, 20)
    expect(teamRelayReady(state, 'player')).toBe(false)
    state = toggleEmperorTime(state, 'player')
    expect(state.player.kurapika!.emperorTime).toBe(false)
    const cost = state.player.kurapika!.lifespanFrames
    expect(cost).toBeGreaterThan(0)
    expect(teamAssistBlock(state, 'player', 1)).toBeNull()
    state = requestTeamAssist(state, 'player', 1)
    expect(state.teamMatch!.seats.player.members[0].kurapika!.lifespanFrames).toBe(cost)
    expect(state.player.kurapika).toBeUndefined()
  })
  it('keeps previews public and rechecks Nen only when an actual relay is requested', () => {
    let state = atGate(duel('kurapika', false))
    expect(teamAssistOptions(state, 'player')).toEqual(
      [0, 1, 2].map((index) => teamAssistBlock(state, 'player', index)),
    )
    state = toggleEmperorTime(state, 'player')
    expect(teamAssistOptions(state, 'player')[1]).toBeNull()
    expect(teamAssistBlock(state, 'player', 1)).toBe('commitment')
    state = toggleEmperorTime(state, 'player')
    expect(teamAssistOptions(state, 'player')[1]).toBeNull()
    const hidden = {
      ...state,
      bungeeGum: {
        owner: 'opponent' as const,
        target: 'player' as const,
        hidden: true,
        retracting: false,
      },
    }
    expect(teamAssistOptions(hidden, 'player')).toEqual(teamAssistOptions(state, 'player'))
    expect(requestTeamAssist(hidden, 'player', 1)).toBe(hidden)
  })
  it('fails closed for invalid slots and unavailable phases', () => {
    const state = atGate(duel())
    for (const index of [-1, 3, 0, Number.NaN, 1.5]) {
      expect(teamAssistBlock(state, 'player', index)).toBe('reserve')
      expect(requestTeamAssist(state, 'player', index)).toBe(state)
    }
    expect(teamAssistBlock(createTeamFight(defaultTeamDraft().rosters), 'player', 1)).toBe('phase')
    expect(teamAssistBlock({ ...state, forecastSimulation: true }, 'player', 1)).toBe('commitment')
  })
})

describe('successive team bodies share physical terrain without inheriting Nen', () => {
  it('preserves a real destroyed crate through a real round victory and retains the survivor’s resources', () => {
    let state = duel('hisoka')
    state = { ...state, player: { ...state.player, x: 27 } }
    for (let i = 0; i < 240 && arenaObjects(state).some((e) => e.id === 'arena:crate:34'); i++) {
      state = performMove({ state, side: 'player', action: 'heavy' })
      state = frames(state, 1)
    }
    expect(state.battlefield!.entities.find((e) => e.id === 'arena:crate:34')!.health).toBe(0)
    state = frames(state, 40)
    state = { ...state, player: { ...state.player, x: 52 }, opponent: { ...state.opponent, x: 58 } }
    state = winPhysically(state)
    expect(state.winner).toBe('player')
    const body = state.player,
      eliminated = state.opponent.id
    const next = nextTeamRound(state)
    expect(next.opponent.id).not.toBe(eliminated)
    expect(next.previousPositions).toBeUndefined()
    expect(next.player.health).toBe(body.health)
    expect(next.player.aura).toBe(body.aura)
    expect(next.battlefield!.entities.find((e) => e.id === 'arena:crate:34')!.health).toBe(0)
    expect(next.arena!.pending).toEqual({})
    expect(next.arena!.tether).toEqual({})
  })
  it('waits for actual Cat’s Name before displaying a lost stock or replacing the murderer', () => {
    let state = startTeamFight(
      createTeamFight({
        player: ['hisoka', 'kurapika', 'theta'],
        opponent: ['camilla', 'franklin', 'hanzo'],
      }),
    )
    state = { ...state, player: { ...state.player, x: 44 }, opponent: { ...state.opponent, x: 50 } }
    for (let i = 0; i < 4000 && !state.catsName; i++) {
      const gap = Math.abs(state.player.x - state.opponent.x)
      if (gap <= 7) state = performMove({ state, side: 'player', action: 'heavy' })
      state = frames(state, 1, { right: gap > 6 })
    }
    expect(state.catsName).toBeDefined()
    expect(state.opponent.health).toBe(0)
    expect(teamLivingForView(state, 'opponent')).toBe(3)
    expect(nextTeamRound(state)).toBe(state)
    state = frames(state, 120)
    expect(state.winner).toBe('opponent')
    expect(teamLivingForView(state, 'player')).toBe(2)
    expect(teamLivingForView(state, 'opponent')).toBe(3)
    expect(nextTeamRound(state).player.id).toBe('kurapika')
  })
  it('retains actual physical crate displacement and resolves spawning inside it', () => {
    let previous = duel()
    previous = { ...previous, player: { ...previous.player, x: 27 } }
    previous = interactWithPreparation(previous, 'player')
    expect(arenaObjects(previous)[0].x).toBe(37)
    const fresh = createTeamFight(defaultTeamDraft().rosters, { arenaInteractions: true })
    const next = carryTeamTerrain(previous, fresh)
    expect(arenaObjects(next)[0].x).toBe(37)
    expect(arenaObjects(fresh)[0].x).toBe(34)
    const moved = { ...fresh, player: { ...fresh.player, x: 37 } }
    expect(carryTeamTerrain(previous, moved).player.x).toBeGreaterThan(42)
  })
  it.each([0, -10, Number.NaN, Number.POSITIVE_INFINITY])(
    'does not heal or poison physical matter with damage %s',
    (damage) => {
      const state = duel()
      expect(damageArenaObject(state, 'arena:crate:34', damage)).toBe(state)
    },
  )
})

describe('fixed-step team commands retain their actual body', () => {
  it('drops a strike queued for a leader after the preceding relay changes bodies', () => {
    const state = atGate(duel()),
      runtime = createTeamRuntime()
    runtime.queue(state, (current) => requestTeamAssist(current, 'player', 1))
    runtime.queue(state, (current) =>
      performMove({ state: current, side: 'player', action: 'heavy' }),
    )
    const next = runtime.advance(state, idle, 1 / 60)
    expect(next.player.id).not.toBe(state.player.id)
    expect(next.player.attack).toBeNull()
    expect(next.teamMatch!.seats.player.members[0].attack).toBeNull()
  })
  it('does not run commands without a simulation frame and clears paused or abandoned inputs', () => {
    const state = atGate(duel()),
      runtime = createTeamRuntime()
    runtime.queue(state, (current) =>
      performMove({ state: current, side: 'player', action: 'light' }),
    )
    expect(runtime.advance(state, idle, 0)).toBe(state)
    expect(runtime.advance(state, idle, Number.NaN)).toBe(state)
    runtime.clear()
    expect(runtime.advance(state, idle, 1 / 60).player.attack).toBeNull()
  })
  it('is invariant under a three-frame render batch', () => {
    const state = atGate(duel()),
      one = createTeamRuntime(),
      three = createTeamRuntime()
    one.queue(state, (current) => requestTeamAssist(current, 'player', 1))
    three.queue(state, (current) => requestTeamAssist(current, 'player', 1))
    let split = state
    for (let i = 0; i < 3; i++) split = one.advance(split, idle, 1 / 60)
    const batched = three.advance(state, idle, 0.05)
    expect(fightReplayHash(batched)).toBe(fightReplayHash(split))
  })
})

describe('ordered team drafts save no combat powers or resources', () => {
  it('reorders the actual next starters and persists only the local selection', () => {
    const draft = defaultTeamDraft(),
      storage = memory()
    draft.rosters.player = moveTeamSlot(draft.rosters.player, 0, 1)
    draft.interactive = true
    expect(saveTeamDraft(storage, draft)).toBe(true)
    expect(readTeamDraft(storage).draft).toEqual(draft)
    const state = createTeamFight(draft.rosters, { arenaInteractions: draft.interactive })
    expect(state.player.id).toBe('hisoka')
    expect(state.player.aura).toBe(55)
    expect(state.player.health).toBe(300)
    expect(arenaObjects(state)).toHaveLength(2)
  })
  it('rejects duplicate, foreign, corrupt and oversized selections without overwriting them', () => {
    const draft = defaultTeamDraft(),
      storage = memory()
    expect(
      validTeamDraft({
        ...draft,
        rosters: { ...draft.rosters, player: ['hisoka', 'hisoka', 'theta'] },
      }),
    ).toBe(false)
    expect(validTeamDraft({ ...draft, stage: 'foreign' })).toBe(false)
    storage.setItem(TEAM_DRAFT_KEY, '{broken')
    expect(readTeamDraft(storage).issue).toBe('unavailable')
    expect(storage.getItem(TEAM_DRAFT_KEY)).toBe('{broken')
    storage.setItem(TEAM_DRAFT_KEY, 'x'.repeat(4097))
    expect(readTeamDraft(storage).issue).toBe('unavailable')
    expect(moveTeamSlot(draft.rosters.player, -1, 2)).toBe(draft.rosters.player)
  })
  it('keeps the match available when browser persistence is denied', () => {
    const storage = {
      getItem: () => {
        throw Error('denied')
      },
      setItem: () => {
        throw Error('denied')
      },
    }
    expect(readTeamDraft(storage).draft).toEqual(defaultTeamDraft())
    expect(saveTeamDraft(storage, defaultTeamDraft())).toBe(false)
    expect(createTeamFight(defaultTeamDraft().rosters).phase).toBe('ready')
  })
})

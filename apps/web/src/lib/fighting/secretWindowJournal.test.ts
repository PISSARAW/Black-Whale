import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack, performAuraAttack, tickFight } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { speakPaperWords } from './kallutoListening'
import { musseHatsu } from './hatsu/musse'
import { privatePvpState } from './pvp/view'
import { WINDOW_JOURNAL_LIMIT } from './secretWindowJournal'
import type { PreparedEntity } from './preparationTypes'
import { EMPTY_INPUT, type FightState } from './types'

function duel(x = 42): FightState {
  const state = beginFight(
    createFight('musse', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, x, aura: 100 },
    opponent: { ...state.opponent, x: 48, aura: 100 },
  }
}

function frames(state: FightState, count: number): FightState {
  for (let n = 0; n < count; n++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}

const attach = (state = duel()) => frames(performAttack(state, 'player', 'special'), 35)

/** One owl frame with the target in a given pose, far away and behind real cover. */
function observe(state: FightState, frame: number, pose: 'walk' | 'guard' | 'idle') {
  return musseHatsu.onFrame({ ...state, frame, opponent: { ...state.opponent, pose, x: 80 } })
}

function hidden(state: FightState): FightState {
  const cover: PreparedEntity = {
    id: 'cover',
    kind: 'crate',
    material: 'real',
    owner: 'neutral',
    x: 70,
    y: 0,
    present: true,
    health: 100,
    arena: { width: 2, height: 20 },
  }
  return {
    ...state,
    battlefield: {
      entities: [cover],
      interactionHeld: { player: false, opponent: false },
      completed: { player: 0, opponent: 0 },
    },
  }
}

describe('Secret Window · private journal of relayed facts', () => {
  it('needs an actual touch before anything is journaled', () => {
    const missed = frames(performAttack(duel(20), 'player', 'special'), 35)
    expect(missed.player.secretWindow).toBeUndefined()
    expect(attach().player.secretWindow?.history?.length).toBeGreaterThan(0)
  })

  it('journals each change of bodily action, even while the target hides behind cover', () => {
    let state = hidden(attach())
    state = observe(state, 100, 'walk')
    state = observe(state, 101, 'walk')
    state = observe(state, 102, 'guard')
    const actions = state.player.secretWindow!.history!.map((entry) => entry.action)
    expect(actions.slice(-2)).toEqual(['walk', 'guard'])
    expect(actions.filter((action) => action === 'walk')).toHaveLength(1)
  })

  it('journals the marked body’s words, never thoughts or technique names', () => {
    const state = attach()
    const spoken = speakPaperWords(state, 'opponent', 'Through the door.')
    const feed = spoken.player.secretWindow!
    expect(feed.recordings?.map((words) => words.text)).toEqual(['Through the door.'])
    expect(JSON.stringify(feed)).not.toMatch(/moveId|hatsu|aura|intent/i)
  })

  it('keeps the journal bounded without inventing older entries', () => {
    let state = attach()
    for (let n = 0; n < WINDOW_JOURNAL_LIMIT + 10; n++)
      state = observe(state, 200 + n, n % 2 ? 'walk' : 'guard')
    expect(state.player.secretWindow!.history).toHaveLength(WINDOW_JOURNAL_LIMIT)
  })

  it('journals the shoulder owl separately, without a contact bird', () => {
    const base = duel(22)
    const listening = frames(
      performArsenalAction(
        { state: base, side: 'player', command: { action: 'window-listen' } },
        performAuraAttack,
      ),
      35,
    )
    const once = speakPaperWords(hidden(listening), 'opponent', 'First.')
    const twice = speakPaperWords({ ...once, frame: once.frame + 1 }, 'opponent', 'Second.')
    expect(twice.player.secretWindowListening?.log?.map((w) => w.text)).toEqual([
      'First.',
      'Second.',
    ])
    expect(twice.player.secretWindow).toBeUndefined()
  })

  it('stays private and costs the owner nothing to keep', () => {
    const state = observe(attach(), 100, 'walk')
    expect(privatePvpState(state, 'opponent').player.secretWindow).toBeUndefined()
    const plain = { ...state, player: { ...state.player, secretWindow: undefined } }
    const next = frames(state, 5)
    const without = frames(plain, 5)
    expect(next.player.x).toBe(without.player.x)
    expect(next.player.aura).toBe(without.player.aura)
    expect(next.player.hitStun).toBe(without.player.hitStun)
  })
})

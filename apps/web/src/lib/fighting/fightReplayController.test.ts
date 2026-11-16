import { describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import { createFight } from './engine'
import { createFightMatchRuntime } from './fightMatchRuntime'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { fightReplayHash } from './fightReplayHash'
import { REPLAY_FIGHTERS } from './fightReplayTypes'
import { EMPTY_INPUT } from './types'

describe.each(REPLAY_FIGHTERS)('%s complete-match persistence', (id) => {
  it('automatically saves a completed match and replays its winning frame', () => {
    const runtime = createFightMatchRuntime()
    const fresh = createFight(id, id === 'chrollo' ? 'hisoka' : 'chrollo', {
      mode: 'versus-local',
      formatId: 'knockout',
    })
    let state = {
      ...fresh,
      roundsWon: { player: 1, opponent: 0 },
      player: { ...fresh.player, x: 44 },
      opponent: { ...fresh.opponent, x: 50, health: 1 },
    }
    runtime.begin(state)
    state = runtime.apply(state, { kind: 'start' })
    runtime.enqueue(state, { kind: 'move', side: 'player', action: 'light', input: 0 })
    for (let i = 0; i < 80 && !state.matchWinner; i++)
      state = runtime.advance(state, EMPTY_INPUT, { dt: 1 / 60 })
    expect(state.matchWinner).toBe('player')
    const library = get(runtime.replays).library
    expect(library).toHaveLength(1)
    expect(library[0].replay.complete).toBe(true)
    const player = createReplayPlayer(decodeFightReplay(JSON.stringify(library[0].replay)))
    while (!player.done) player.advance(0.1, 2)
    expect(player.error).toBe('')
    expect(player.state.matchWinner).toBe('player')
    expect(fightReplayHash(player.state)).toBe(fightReplayHash(state))
  })
})

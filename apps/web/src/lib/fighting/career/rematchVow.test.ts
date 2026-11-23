import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performMove } from '../engine'
import { advanceRematchVow, applyRematchVow } from './rematchVow'
import { emptyCareer } from './types'

describe('career rematch vows', () => {
  it('activates only against the pledged opponent and punishes a retreat', () => {
    const profile = emptyCareer()
    profile.rematchVows.hisoka = {
      kind: 'no-retreat',
      opponent: 'hisoka',
      sourceMatchId: 'loss-1',
    }
    let state = applyRematchVow(
      beginFight(createFight('kurapika', 'hisoka', { mode: 'versus-ai' })),
      profile,
    )
    expect(state.rematchVow?.kind).toBe('no-retreat')
    for (let frame = 0; frame < 11; frame++) {
      state = { ...state, player: { ...state.player, x: state.player.x - 1 } }
      state = advanceRematchVow(state)
    }
    expect(state.rematchVow?.breached).toBe(true)
    expect(state.player.aura).toBe(0)
    expect(
      applyRematchVow(
        beginFight(createFight('kurapika', 'chrollo', { mode: 'versus-ai' })),
        profile,
      ).rematchVow,
    ).toBeUndefined()
  })

  it('locks single-Hatsu vows to the first manifested technique', () => {
    const profile = emptyCareer()
    profile.rematchVows.hisoka = {
      kind: 'single-hatsu',
      opponent: 'hisoka',
      sourceMatchId: 'loss-1',
    }
    let state = applyRematchVow(
      beginFight(createFight('kurapika', 'hisoka', { mode: 'versus-ai' })),
      profile,
    )
    state = performMove({ state, side: 'player', action: 'light' })
    state.player.attack = { ...state.player.attack!, hatsuSource: 'kurapika', moveId: 'first' }
    state = advanceRematchVow(state)
    state.player.attack = { ...state.player.attack!, moveId: 'second' }
    expect(advanceRematchVow(state).rematchVow?.breached).toBe(true)
  })
})

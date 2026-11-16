import { describe, expect, it, vi } from 'vitest'

describe('live Nen admission across AI and replay imports', () => {
  it.each(['./engine', './opponentHabits', './fightReplayPanels'])(
    'keeps Rihan’s finisher available after importing %s first',
    async (entry) => {
      vi.resetModules()
      await import(entry)
      const engine = await import('./engine')
      const { EMPTY_INPUT } = await import('./types')
      const { predatorReady, PREDATOR_ANALYSIS_FRAMES } = await import('./predator')
      const { finisherReady } = await import('./movesets')
      let state = engine.beginFight(
        engine.createFight('rihan', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
      )
      state = {
        ...state,
        player: { ...state.player, aura: 100 },
        opponent: { ...state.opponent, aura: 100 },
        bungeeGum: { owner: 'opponent', target: 'player', hidden: false, retracting: false },
      }
      state = engine.performMove({ state, side: 'player', action: 'special' })
      for (let i = 0; i < PREDATOR_ANALYSIS_FRAMES; i++)
        state = engine.tickFight(state, EMPTY_INPUT, {
          dt: 1 / 60,
          opponentInput: EMPTY_INPUT,
          ai: false,
        })
      expect(predatorReady(state, 'player')).toBe(true)
      expect(finisherReady(state, 'player')).toBe(true)
      const launched = engine.performMove({ state, side: 'player', action: 'finisher' })
      expect(launched.player.predator?.hunt?.preyId).toBe('bungee-gum')
    },
  )
})

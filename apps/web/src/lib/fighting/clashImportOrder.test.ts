import { describe, expect, it, vi } from 'vitest'

describe('live Nen admission across AI and replay imports', () => {
  it.each(['./engine', './opponentHabits', './fightReplayPanels'])(
    'keeps Rihan’s finisher available after importing %s first',
    async (entry) => {
      vi.resetModules()
      await import(entry)
      const engine = await import('./engine')
      const { investigatePredator } = await import('./predatorFixtures')
      let state = engine.beginFight(
        engine.createFight('rihan', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
      )
      state = {
        ...state,
        player: { ...state.player, aura: 100 },
        opponent: { ...state.opponent, aura: 100 },
      }
      const launched = investigatePredator({
        state,
        side: 'player',
        manifest: (s) => ({
          ...s,
          bungeeGum: { owner: 'opponent', target: 'player', hidden: false, retracting: false },
        }),
      })
      expect(launched.player.predator?.hunt?.preyId).toBe('bungee-gum')
    },
  )
})

import { describe, expect, it, vi } from 'vitest'

const entries = [
  { name: 'combat routes', load: () => import('./combatRoutes') },
  { name: 'Moonlight Contract', load: () => import('./moonlightContract') },
  { name: 'engine', load: () => import('./engine') },
]
describe('Hatsu hooks after cold cyclic imports', () => {
  it.each(entries)(
    'executes existing frame hooks when $name loads first',
    async ({ load }) => {
      vi.resetModules()
      await load()
      const { beginFight, createFight } = await import('./engine')
      const { hatsuFor, advanceHatsuFrames } = await import('./hatsu/registry')
      const state = beginFight(createFight('longhi', 'hisoka'))
      expect(typeof hatsuFor('longhi').onFrame).toBe('function')
      expect(hatsuFor('longhi').onFrame(state)).toBe(state)
      expect(() => advanceHatsuFrames(state)).not.toThrow()
      expect(state.moonlight).toBeUndefined()
    },
    20000,
  )
})

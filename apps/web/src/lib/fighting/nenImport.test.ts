import { describe, expect, it, vi } from 'vitest'

describe('Nen contracts do not depend on module initialization order', () => {
  it.each(['./engine', './movesets', './hatsu/registry', './preparationRequirements', './outsideDuelAbility'])(
    'retains hooks and the passive ability after importing %s first',
    async (entry) => {
      vi.resetModules()
      await import(entry)
      const { hatsuFor } = await import('./hatsu/registry')
      const { FIGHTING_ROSTER } = await import('./roster')
      for (const { id } of FIGHTING_ROSTER) {
        const hatsu = hatsuFor(id)
        expect(typeof hatsu.onTrigger, id).toBe('function')
        expect(typeof hatsu.onImpact, id).toBe('function')
        expect(typeof hatsu.onFrame, id).toBe('function')
      }
      expect(hatsuFor('camilla').stealableOutsideDuel?.id).toBe('camilla:catsName')
    },
  )
})

import { describe, expect, it } from 'vitest'
import type { HatsuProfile } from '../../nen/hatsuRegistry'
import { arenaDefinition } from './contract'
import { resolveHatsuInteraction } from './interaction'

describe('Arena V3 Hatsu contracts', () => {
  it.each(['bungee-gum', 'ripper-cyclotron', 'double-machine-gun', 'battle-cantabile-jupiter'])(
    '%s declares a condition and a risk',
    (id) => {
      expect(arenaDefinition({ id } as HatsuProfile)).toMatchObject({ id })
      expect(arenaDefinition({ id } as HatsuProfile)?.condition).toBeTruthy()
      expect(arenaDefinition({ id } as HatsuProfile)?.risk).toBeTruthy()
    },
  )

  it('explains mechanical counters instead of hiding resolution', () => {
    expect(resolveHatsuInteraction('impact', 'ken')).toMatchObject({ outcome: 'reduced' })
    expect(resolveHatsuInteraction('bind', 'distance')?.explanationFr).toContain('portée')
    expect(resolveHatsuInteraction('restore', 'gyo')).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import type { HatsuProfile } from '@black-whale/nen-engine'
import { emitLocaleSkeleton } from '../src/hatsu/skeleton'

const PROFILE: HatsuProfile = {
  id: 'bungee-gum',
  name: 'Bungee Gum',
  owner: 'Hisoka Morrow',
  kind: 'elastic',
  instruction: "Point at something, then don't let go.",
  rule: 'It snaps past ten metres.',
  cost: 'Aura',
  color: '#f06bb5',
  action: 'Attach',
}

describe('the locale skeleton', () => {
  it('says nothing when the catalogue is complete', () => {
    expect(emitLocaleSkeleton([PROFILE], new Set(['bungee-gum']))).toBe('')
  })

  it('writes the missing entry with the English text to translate', () => {
    const skeleton = emitLocaleSkeleton([PROFILE], new Set())

    expect(skeleton).toBe(
      [
        "  'bungee-gum': {",
        "    name: 'Bungee Gum',",
        "    action: 'Attach',",
        '    instruction: "Point at something, then don\'t let go.",',
        "    rule: 'It snaps past ten metres.',",
        "    cost: 'Aura',",
        '  },',
      ].join('\n'),
    )
  })

  it('offers no owner: a proper noun is not something a locale translates', () => {
    expect(emitLocaleSkeleton([PROFILE], new Set())).not.toContain('owner')
  })
})

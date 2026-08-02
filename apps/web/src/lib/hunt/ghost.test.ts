import { describe, expect, it } from 'vitest'
import { ghostAt } from './ghost'
import { createReplay } from './replay'

const replay = createReplay({
  schemaVersion: 3, contractId: 'royal-apartments', seed: 1, terrain: 'tserriednich',
  hatsu: 'bungee-gum', hunter: 'methodical',
  actions: [
    { at: 0, action: { type: 'WALKED', player: { position: [0, 0], heading: 0 } } },
    { at: 2, action: { type: 'ZETSU' } },
    { at: 4, action: { type: 'WALKED', player: { position: [4, 0], heading: 1 } } },
  ],
})

describe('replay ghost', () => {
  it('interpolates the recorded body without simulating hidden state', () => {
    expect(ghostAt(replay, 2)).toEqual({ position: [2, 0], heading: 0.5, nen: 'zetsu' })
  })

  it('does not appear before its first recorded frame', () => {
    expect(ghostAt({ ...replay, actions: replay.actions.slice(1) }, 1)).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import { appendReplayAction, createReplay, decodeReplay, encodeReplay } from './replay'

const replay = () => createReplay({
  schemaVersion: 3,
  contractId: 'royal-apartments',
  seed: 7,
  terrain: 'tserriednich',
  hatsu: 'bungee-gum',
  hunter: 'methodical',
  actions: [],
})

describe('Hunt V3 replay', () => {
  it('records typed commands and round-trips a share payload', () => {
    const recorded = appendReplayAction(replay(), 2.5, { type: 'ZETSU' })
    expect(decodeReplay(encodeReplay(recorded))).toEqual(recorded)
  })

  it('rejects a modified payload', () => {
    const encoded = encodeReplay(appendReplayAction(replay(), 1, { type: 'REN' }))
    const decoded = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encoded.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(encoded.length / 4) * 4, '=')), (c) => c.charCodeAt(0))))
    decoded.seed = 99
    const tampered = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(decoded))))
      .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
    expect(decodeReplay(tampered)).toBeNull()
  })
})

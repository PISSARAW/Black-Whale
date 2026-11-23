import { describe, expect, it } from 'vitest'
import { opaqueHudSides, rivalSide } from './hudLayout'

describe('opaqueHudSides', () => {
  it('keeps every side readable in omniscient mode or spectator view', () => {
    expect(opaqueHudSides({ state: { mode: 'versus-ai' }, mode: 'omniscient' })).toEqual([])
    expect(
      opaqueHudSides({ state: { mode: 'versus-ai', spectatorView: true }, mode: 'tactical' }),
    ).toEqual([])
  })

  it('masks only the opponent in tactical solo or online play', () => {
    expect(opaqueHudSides({ state: { mode: 'versus-ai' }, mode: 'tactical' })).toEqual([
      'opponent',
    ])
  })

  it('masks both sides in tactical local versus (shared screen)', () => {
    expect(opaqueHudSides({ state: { mode: 'versus-local' }, mode: 'tactical' })).toEqual([
      'player',
      'opponent',
    ])
  })

  it('maps each side to its rival', () => {
    expect(rivalSide('player')).toBe('opponent')
    expect(rivalSide('opponent')).toBe('player')
  })
})

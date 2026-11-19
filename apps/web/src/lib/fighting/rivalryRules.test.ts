import { describe, expect, it } from 'vitest'
import { beginCatsName } from './camillaCat'
import { createFight } from './engine'
import { canUseMovesetMove, moveForSlot } from './movesets'
import { activeRivalryRules } from './rivalryRules'

describe('canonical rivalry rules', () => {
  it('prepares Chrollo’s five Heavens Arena pages only against Hisoka', () => {
    const rivalry = createFight('chrollo', 'hisoka')
    expect(rivalry.player.chrolloBook?.pages).toEqual([
      'sun-and-moon',
      'black-voice',
      'gallery-fake',
      'order-stamp',
      'convert-hands',
    ])
    expect(activeRivalryRules(rivalry).map((rule) => rule.id)).toContain(
      'chrollo-hisoka-preparation',
    )
    expect(createFight('chrollo', 'kurapika').player.chrolloBook?.pages).toEqual([
      'sun-and-moon',
      'black-voice',
    ])
  })

  it('reports the same Chain Jail vow enforced by move admission', () => {
    const chainJail = moveForSlot('kurapika', 'neutralSpecial')!
    const spider = createFight('kurapika', 'chrollo')
    const outsider = createFight('kurapika', 'hisoka')
    expect(canUseMovesetMove(spider, 'player', chainJail)).toBe(true)
    expect(canUseMovesetMove(outsider, 'player', chainJail)).toBe(false)
    expect(activeRivalryRules(outsider).find((rule) => rule.id === 'chain-jail-vow')).toBeTruthy()
  })

  it('reports Camilla’s death trap and lets the existing post-mortem rule resolve it', () => {
    const state = createFight('camilla', 'hisoka')
    state.player.health = 0
    const trapped = beginCatsName(state, 'player', 'opponent')
    expect(activeRivalryRules(state).map((rule) => rule.id)).toContain('cats-name-trap')
    expect(trapped.catsName).toMatchObject({ victimSide: 'player', killerSide: 'opponent' })
  })
})

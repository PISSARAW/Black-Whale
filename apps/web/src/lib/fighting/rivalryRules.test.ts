import { describe, expect, it } from 'vitest'
import { beginCatsName } from './camillaCat'
import { beginFight, createFight } from './engine'
import { chrolloPageForMove } from './chrolloBook'
import { performArsenalCommand } from './retrospectiveArsenal'
import { canUseMovesetMove, moveForSlot } from './movesets'
import { activeRivalryRules } from './rivalryRules'

describe('canonical rivalry rules', () => {
  it('prepares Chrollo’s five Heavens Arena pages only against Hisoka', () => {
    const rivalry = createFight('chrollo', 'hisoka')
    expect([...rivalry.player.chrolloBook!.pages].sort()).toEqual([
      'black-voice',
      'convert-hands',
      'gallery-fake',
      'order-stamp',
      'sun-and-moon',
    ])
    const gallery = performArsenalCommand(beginFight(rivalry), 'player', {
      action: 'history-page',
      target: 'gallery-fake',
    })
    expect(chrolloPageForMove(gallery.player)).toBe('gallery-fake')
    expect(activeRivalryRules(rivalry).map((rule) => rule.id)).toContain(
      'chrollo-hisoka-preparation',
    )
    expect(createFight('chrollo', 'kurapika').player.chrolloBook?.pages).toEqual([
      'sun-and-moon',
      'black-voice',
      'order-stamp',
      'convert-hands',
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
    const trapped = beginCatsName(state, { victimSide: 'player', killerSide: 'opponent' })
    expect(activeRivalryRules(state).map((rule) => rule.id)).toContain('cats-name-trap')
    expect(trapped.catsName).toMatchObject({ victimSide: 'player', killerSide: 'opponent' })
  })
})

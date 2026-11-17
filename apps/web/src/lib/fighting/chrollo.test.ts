import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  nextRound,
  performAuraAttack,
  performMove,
  tickFight,
} from './engine'
import {
  createChrolloBook,
  chrolloHasActivePage,
  chrolloPageForMove,
  CHROLLO_USE,
  CHROLLO_STEAL,
  CHROLLO_TURN,
  CHROLLO_BOOKMARK,
  CHROLLO_SECONDARY,
} from './chrolloBook'
import { activeHitbox } from './frameData'
import { hatsuFor, hatsuSourceFor, triggerHatsu } from './hatsu'
import { chooseMovesetAttack } from './movesetAi'
import { performHunterInterview } from './skillHunterAcquisition'
import { forceZetsu } from './nen'
import { EMPTY_INPUT, type FightState } from './types'

function ready(): FightState {
  const base = beginFight(createFight('chrollo', 'illumi', { mode: 'training' }))
  return {
    ...base,
    player: { ...base.player, x: 44, aura: 100, equipment: ['book', 'needles'] },
    opponent: { ...base.opponent, x: 49, aura: 100 },
  }
}
function advance(state: FightState, frames = 20): FightState {
  let next = state
  for (let frame = 0; frame < frames; frame++)
    next = tickFight(next, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return next
}
function action(state: FightState, moveId: string): FightState {
  return performAuraAttack({ state, side: 'player', kind: 'special', moveId, auraCharged: false })
}
function impact(state: FightState, moveId: string): FightState {
  return hatsuFor('chrollo').onImpact({
    state,
    side: 'player',
    defenderSide: 'opponent',
    source: 'chrollo',
    moveId,
    blocked: false,
    concealed: false,
  })
}
function stolen(): FightState {
  let state = triggerHatsu(ready(), 'opponent', 'illumi')
  state = performHunterInterview(state, 'player', { action: 'hunter-ask' })
  state = performHunterInterview(state, 'opponent', { action: 'hunter-answer' })
  return impact(state, CHROLLO_STEAL)
}

describe('Bandit’s Secret and Double Face', () => {
  it('starts with a historical pair of pages and no bookmark', () => {
    expect(ready().player.chrolloBook).toEqual(createChrolloBook())
    expect(hatsuSourceFor(ready().player, CHROLLO_SECONDARY)).toBeNull()
  })
  it('plays the complete Sun, close-book, Moon route through real combat frames', () => {
    const sun = advance(action(ready(), CHROLLO_USE), 50)
    expect(sun.opponent.hatsuEffects.sunMark).toBe(1)
    const closed = advance(action(sun, CHROLLO_BOOKMARK))
    const moon = advance(action(closed, CHROLLO_SECONDARY), 25)
    expect(moon.opponent.hatsuEffects).toMatchObject({ sunMark: 0, moonMark: 0 })
    expect(moon.opponent.health).toBeLessThan(sun.opponent.health - 23)
    expect(moon.impact?.attacker).toBe('player')
  })
  it('turns pages without a hitbox, lunge, aura cost or free cancel', () => {
    const base = ready()
    const turning = action(base, CHROLLO_TURN)
    expect(turning.player.chrolloBook).toMatchObject({ page: 1, open: true })
    expect(turning.player.x).toBe(base.player.x)
    expect(turning.player.aura).toBe(base.player.aura)
    const active = { ...turning.player, attack: { ...turning.player.attack!, frame: 3 } }
    expect(activeHitbox(active)).toBeNull()
    expect(action(turning, CHROLLO_USE)).toBe(turning)
    const done = advance(turning)
    expect(done.opponent.health).toBe(base.opponent.health)
    expect(done.score).toEqual(base.score)
    expect(done.impact).toBeNull()
    expect(done.opponent.hatsuEffects.witnessedHatsu).toBeNull()
  })
  it('keeps the bookmarked ability while closed or while another page is open', () => {
    const closed = action(ready(), CHROLLO_BOOKMARK)
    expect(closed.player.chrolloBook).toMatchObject({ open: false, bookmark: 'sun-and-moon' })
    expect(chrolloHasActivePage(closed.player, 'sun-and-moon')).toBe(true)
    const opened = action(advance(closed), CHROLLO_TURN)
    expect(chrolloPageForMove(opened.player)).toBe('black-voice')
    expect(chrolloPageForMove(opened.player, CHROLLO_SECONDARY)).toBe('sun-and-moon')
    expect(chrolloHasActivePage(opened.player, 'black-voice')).toBe(true)
  })
  it('moves one bookmark rather than accumulating active pages', () => {
    const closed = action(ready(), CHROLLO_BOOKMARK)
    const turned = action(advance(closed), CHROLLO_TURN)
    const replaced = action(advance(turned), CHROLLO_BOOKMARK)
    expect(replaced.player.chrolloBook).toMatchObject({ open: false, bookmark: 'black-voice' })
    expect(chrolloHasActivePage(replaced.player, 'sun-and-moon')).toBe(false)
    expect(chrolloHasActivePage(replaced.player, 'black-voice')).toBe(true)
  })
  it('reopens the book and allows removing its bookmark', () => {
    const closed = action(ready(), CHROLLO_BOOKMARK)
    const reopened = action(advance(closed), CHROLLO_BOOKMARK)
    expect(reopened.player.chrolloBook?.open).toBe(true)
    const removed = action(advance(reopened), CHROLLO_BOOKMARK)
    expect(removed.player.chrolloBook?.bookmark).toBeNull()
    expect(advance(removed).impact).toBeNull()
  })
  it('retains acquired pages and revokes their owner even when turning away', () => {
    const acquired = stolen()
    expect(acquired.player.chrolloBook).toMatchObject({
      pages: ['sun-and-moon', 'black-voice', 'illumi:neutralSpecial'],
      page: 2,
      open: true,
    })
    expect(acquired.opponent.skillHunterStolen).toEqual([{ owner: 'player', moveId: 'illumi:neutralSpecial' }])
    expect(hatsuSourceFor(acquired.opponent)).toBeNull()
    expect(hatsuSourceFor(acquired.player, CHROLLO_USE)).toBe('illumi')
    const turned = action(acquired, CHROLLO_TURN)
    expect(turned.player.chrolloBook?.pages).toContain('illumi:neutralSpecial')
    expect(hatsuSourceFor(turned.player, CHROLLO_USE)).toBe('chrollo')
    expect(turned.opponent.skillHunterStolen).toEqual(acquired.opponent.skillHunterStolen)
    expect(impact(acquired, CHROLLO_STEAL)).toBe(acquired)
  })
  it('cannot steal an unseen ability or through guard', () => {
    const unseen = ready()
    expect(impact(unseen, CHROLLO_STEAL)).toBe(unseen)
    const seen = triggerHatsu(unseen, 'opponent', 'illumi')
    expect(
      hatsuFor('chrollo').onImpact({
        state: seen,
        side: 'player',
        defenderSide: 'opponent',
        source: 'chrollo',
        moveId: CHROLLO_STEAL,
        blocked: true,
        concealed: false,
      }),
    ).toBe(seen)
  })
  it('replays a bookmarked stolen Hatsu while another page is open', () => {
    const closed = action(stolen(), CHROLLO_BOOKMARK)
    const turned = action(advance(closed), CHROLLO_TURN)
    expect(hatsuSourceFor(turned.player, CHROLLO_USE)).toBe('chrollo')
    expect(hatsuSourceFor(turned.player, CHROLLO_SECONDARY)).toBe('illumi')
    const replayed = advance(action(advance(turned), CHROLLO_SECONDARY))
    expect(replayed.opponent.needlePuppet).toMatchObject({ owner: 'player', needleEmbedded: true })
    expect(replayed.opponent.hatsuEffects.sunMark).toBe(0)
  })
  it('ends effects of a lost page immediately and preserves effects of a bookmarked page', () => {
    const acquired = stolen()
    const controlled = {
      ...acquired,
      opponent: {
        ...acquired.opponent,
        needlePuppet: { owner: 'player' as const, order: 'stay' as const, needleEmbedded: true },
      },
    }
    expect(action(controlled, CHROLLO_TURN).opponent.needlePuppet).toMatchObject({ needleEmbedded: false })
    const closed = action(controlled, CHROLLO_BOOKMARK)
    const kept = action(advance(closed), CHROLLO_TURN)
    expect(kept.opponent.needlePuppet?.needleEmbedded).toBe(true)
  })
  it('keeps the right hand occupied while open and stamps Moon only after closing', () => {
    const base = ready()
    const open = {
      ...base,
      player: {
        ...base.player,
        chrolloBook: { ...base.player.chrolloBook!, bookmark: 'sun-and-moon' as const },
      },
    }
    const left = impact(open, CHROLLO_SECONDARY)
    expect(left.opponent.hatsuEffects).toMatchObject({ sunMark: 1, moonMark: 0 })
    expect(left.opponent.health).toBe(left.opponent.maxHealth)
    const closed = {
      ...left,
      player: { ...left.player, chrolloBook: { ...left.player.chrolloBook!, open: false } },
    }
    const right = impact(closed, CHROLLO_SECONDARY)
    expect(right.opponent.health).toBe(right.opponent.maxHealth - 24)
    expect(right.opponent.hatsuEffects).toMatchObject({ sunMark: 0, moonMark: 0 })
  })
  it('keeps post-mortem Sun/Moon marks through page changes and Zetsu', () => {
    const marked = impact(ready(), CHROLLO_USE)
    const turned = action(marked, CHROLLO_TURN)
    expect(turned.opponent.hatsuEffects.sunMark).toBe(1)
    const sealed = hatsuFor('chrollo').onFrame({ ...turned, player: forceZetsu(turned.player) })
    expect(sealed.player.chrolloBook).toMatchObject({ open: false, bookmark: null })
    expect(sealed.opponent.hatsuEffects.sunMark).toBe(1)
  })
  it('makes an antenna target retreat and stops controlling it when the page closes', () => {
    const base = ready()
    const voice = {
      ...base,
      player: { ...base.player, chrolloBook: { ...base.player.chrolloBook!, page: 1 } },
    }
    const planted = impact(voice, CHROLLO_USE)
    const ordered = hatsuFor('chrollo').onFrame(planted)
    expect(ordered.opponent.x).toBeGreaterThan(planted.opponent.x)
    expect(ordered.opponent.blocking).toBe(false)
    expect(action(ordered, CHROLLO_TURN).opponent.hatsuEffects.manipulatedFrames).toBe(0)
  })
  it.each(['hitStun', 'blockStun', 'knockdownFrames'] as const)(
    'blocks book handling during %s',
    (field) => {
      const base = ready()
      const busy = { ...base, player: { ...base.player, [field]: 10 } }
      expect(action(busy, CHROLLO_TURN)).toBe(busy)
      expect(action(busy, CHROLLO_BOOKMARK)).toBe(busy)
    },
  )
  it('rejects casts and book handling in Zetsu and casts with no active page', () => {
    const base = ready()
    const sealed = { ...base, player: forceZetsu(base.player) }
    expect(action(sealed, CHROLLO_USE)).toBe(sealed)
    expect(action(sealed, CHROLLO_TURN)).toBe(sealed)
    const shut = {
      ...base,
      player: { ...base.player, chrolloBook: { ...base.player.chrolloBook!, open: false } },
    }
    expect(action(shut, CHROLLO_USE)).toBe(shut)
  })
  it('routes relative P2 inputs and lets the AI prepare Moon', () => {
    const base = beginFight(createFight('illumi', 'chrollo', { mode: 'versus-local' }))
    const turned = performMove({
      state: base,
      side: 'opponent',
      action: 'special',
      input: { ...EMPTY_INPUT, right: true },
    })
    expect(turned.opponent.attack?.moveId).toBe(CHROLLO_TURN)
    const ai = {
      ...base,
      player: { ...base.player, hatsuEffects: { ...base.player.hatsuEffects, sunMark: 1 } },
    }
    expect(chooseMovesetAttack(ai, 0.6, 5)?.id).toBe(CHROLLO_BOOKMARK)
  })
  it('resets retained pages, bookmark and theft each round, with separate mirror state', () => {
    const reset = nextRound({ ...stolen(), phase: 'finished', winner: 'player' })
    expect(reset.player.chrolloBook).toEqual(createChrolloBook())
    expect(reset.opponent.hatsuEffects.hatsuStolen).toBe(0)
    const mirror = createFight('chrollo', 'chrollo')
    expect(mirror.player.chrolloBook?.pages).not.toBe(mirror.opponent.chrolloBook?.pages)
  })
})

import { toggleEmperorTime } from './kurapikaActions'
import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { performArsenalCommand } from './retrospectiveArsenal'
import { attackData } from './frameData'
import { EMPTY_INPUT, type FightState } from './types'

function duel(page: 'hisoka:neutralSpecial' | 'hisoka:downSpecial'): FightState {
  const state = beginFight(
    createFight('chrollo', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: {
      ...state.player,
      x: 44,
      aura: 100,
      chrolloBook: { pages: [page], page: 0, open: true, bookmark: null },
    },
    opponent: { ...state.opponent, x: 49 },
  }
}
function frames(state: FightState, count = 60): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
const use = (state: FightState, target: string) =>
  performArsenalAction(
    { state, side: 'player', command: { action: 'copied-move', target } },
    performAuraAttack,
  )

describe('one loaded Dolphin Hatsu', () => {
  it('can retract its existing rubber without starting a second attachment', () => {
    const base = beginFight(
      createFight('kurapika', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
    )
    let state = {
      ...base,
      player: { ...base.player, x: 44, aura: 100 },
      opponent: { ...base.opponent, x: 49, aura: 100 },
    }
    const steal = (s: FightState) =>
      performAuraAttack({
        state: s,
        side: 'player',
        kind: 'special',
        moveId: 'kurapika:backSpecial',
        auraCharged: false,
      })
    state = frames(steal(state), 220)
    expect(state.player.kurapika?.held?.source).toBe('hisoka')
    state = toggleEmperorTime(state, 'player')
    state = steal(state)
    const application = (s: FightState, target: string) =>
      performArsenalAction(
        { state: s, side: 'player', command: { action: 'dolphin-move', target } },
        performAuraAttack,
      )
    state = frames(application(state, 'hisoka:neutralSpecial'))
    expect(state.bungeeGum?.owner).toBe('player')
    state = { ...state, opponent: { ...state.opponent, x: 65 } }
    expect(application(state, 'hisoka:neutralSpecial')).toBe(state)
    const recalled = application(state, 'hisoka:forwardSpecial')
    expect(recalled.player.attack?.moveId).toBe('hisoka:forwardSpecial')
    expect(frames(recalled).opponent.x).toBeLessThan(65)
    expect(recalled.player.kurapika?.held?.used).toBe(true)
  })
})

describe('applications of an acquired Hatsu remain separate from other Hatsu of its owner', () => {
  it('executes Texture Surprise as a surface disguise, without a Bungee Gum attachment', () => {
    const state = duel('hisoka:downSpecial')
    expect(use(state, 'hisoka:neutralSpecial')).toBe(state)
    const cast = use(state, 'hisoka:downSpecial')
    expect(cast.player.attack?.moveId).toBe('hisoka:downSpecial')
    const result = frames(cast)
    expect(result.player.textureSurprise).toBeTruthy()
    expect(result.bungeeGum).toBeNull()
    expect(result.opponent.health).toBe(state.opponent.health)
    expect(result.player.id).toBe('chrollo')
  })
  it('allows recall from an acquired Bungee Gum page, preserving its native frame data and link condition', () => {
    let state = duel('hisoka:neutralSpecial')
    expect(use(state, 'hisoka:forwardSpecial')).toBe(state)
    state = frames(use(state, 'hisoka:neutralSpecial'))
    expect(state.bungeeGum?.owner).toBe('player')
    state = { ...state, opponent: { ...state.opponent, x: 65 } }
    const recall = use(state, 'hisoka:forwardSpecial')
    expect(recall.player.attack?.copiedPage).toBe('hisoka:neutralSpecial')
    expect(recall.player.attack?.moveId).toBe('hisoka:forwardSpecial')
    expect(attackData('special', recall.player).startup).toBe(
      attackData('special', {
        ...recall.player,
        id: 'hisoka',
        nenOwner: 'chrollo',
      }).startup,
    )
    expect(frames(recall).opponent.x).toBeLessThan(65)
  })
  it('ends maintained rubber when its page is lost, without turning Texture Surprise into that Hatsu', () => {
    const linked = frames(use(duel('hisoka:neutralSpecial'), 'hisoka:neutralSpecial'))
    const turned = performArsenalCommand(linked, 'player', {
      action: 'history-page',
      target: 'sun-and-moon',
    })
    expect(frames(turned, 1).bungeeGum).toBeNull()
  })
})

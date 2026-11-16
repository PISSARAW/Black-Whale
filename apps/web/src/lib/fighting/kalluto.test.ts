import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight, nextRound } from './engine'
import { activeHitbox, attackData } from './frameData'
import { resolveFightImpacts } from './combatImpact'
import { advanceKallutoPaper } from './kallutoFrames'
import { launchKallutoPaper, travelKallutoPaper } from './kallutoFlight'
import {
  paperState,
  paperAvailable,
  selectPaperTarget,
  selectPaperCommand,
  hasPlantedPaper,
} from './kallutoPaper'
import { paperListening, speakPaperWords } from './kallutoListening'
import { speakBattleWords } from './battleConversation'
import { finisherReady } from './movesets'
import { hatsuFor } from './hatsu'
import { addChrolloPage, createChrolloBook, CHROLLO_USE } from './chrolloBook'
import { EMPTY_INPUT, type FightState, type FightSide, type FightNenZone } from './types'

function duel(side: FightSide = 'player'): FightState {
  const state = beginFight(
    createFight(
      side === 'player' ? 'kalluto' : 'hisoka',
      side === 'player' ? 'hisoka' : 'kalluto',
      { mode: 'versus-local', formatId: 'knockout' },
    ),
  )
  return {
    ...state,
    player: { ...state.player, x: 30, aura: 100 },
    opponent: { ...state.opponent, x: 48, aura: 100 },
  }
}
function step(state: FightState, frames: number): FightState {
  for (let i = 0; i < frames; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function marked(
  state = duel(),
  zone: FightNenZone = 'torso',
  owner: FightSide = 'player',
): FightState {
  const target = owner === 'player' ? 'opponent' : 'player'
  return { ...state, [target]: { ...state[target], plantedPaper: [{ owner, zone }] } }
}
function cast(state: FightState, slot: string, side: FightSide = 'player'): FightState {
  return performAuraAttack({
    state,
    side,
    kind: 'special',
    moveId: `kalluto:${slot}`,
    auraCharged: false,
  })
}
function impactPaper(state: FightState): FightState {
  const flight = launchKallutoPaper(state, 'player', 'plant')
  const shot = flight.projectiles.at(-1)!
  return resolveFightImpacts(flight, [
    { projectile: shot, defenderSide: 'opponent', position: { x: state.opponent.x, y: shot.y } },
  ])
}

describe('Kalluto paper and surveillance dolls', () => {
  it.each(['head', 'torso', 'hands', 'feet'] as const)(
    'plants a physical fragment in %s through the engine',
    (zone) => {
      const state = step(cast(selectPaperTarget(duel(), 'player', zone), 'neutralSpecial'), 55)
      expect(state.opponent.plantedPaper).toEqual([{ owner: 'player', zone }])
      expect(state.opponent.health).toBeLessThan(state.opponent.maxHealth)
      expect(state.player.x).toBe(30)
    },
  )
  it('does not plant on guard or avoidance', () => {
    const state = duel()
    for (const defence of [{ blocking: true, guardFrames: 20 }, { wakeupInvulnerableFrames: 10 }]) {
      expect(
        impactPaper({ ...state, opponent: { ...state.opponent, ...defence } }).opponent
          .plantedPaper,
      ).toBeUndefined()
    }
  })
  it('ordinary impacts never add paper or detonate on the third hit', () => {
    let state = duel()
    for (let i = 0; i < 6; i++)
      state = hatsuFor('kalluto').onImpact({
        state,
        side: 'player',
        defenderSide: 'opponent',
        source: 'kalluto',
        blocked: false,
        concealed: false,
      })
    expect(state.opponent.health).toBe(state.opponent.maxHealth)
    expect(state.opponent.plantedPaper).toBeUndefined()
  })
  it('requires its own paper in the chosen zone, without any HP or hit-count threshold', () => {
    let state = duel()
    expect(cast(state, 'forwardSpecial')).toBe(state)
    state = marked(state, 'head')
    expect(finisherReady(state, 'player')).toBe(false)
    state = selectPaperTarget(state, 'player', 'head')
    expect(finisherReady(state, 'player')).toBe(true)
    expect(cast(state, 'finisher').player.attack?.moveId).toBe('kalluto:finisher')
    const wrongOwner = {
      ...state,
      opponent: {
        ...state.opponent,
        plantedPaper: [{ owner: 'opponent' as const, zone: 'head' as const }],
      },
    }
    expect(finisherReady(wrongOwner, 'player')).toBe(false)
  })
  it('follows a moving marked zone and deals normal damage without consuming paper', () => {
    const state = step(cast(marked(), 'forwardSpecial'), 15)
    const shot = state.projectiles.find((shot) => shot.kallutoPaper === 'serpent')!
    expect(shot).toBeDefined()
    const moving = { ...state, opponent: { ...state.opponent, y: 12 } }
    expect(travelKallutoPaper(moving, shot, 1 / 60).y).toBeGreaterThan(shot.y)
    const next = step(state, 45)
    expect(next.opponent.health).toBeLessThan(state.opponent.health)
    expect(hasPlantedPaper(next, 'player', 'torso')).toBe(true)
    expect(next.impact?.zone).toBe('torso')
    expect(next.phase).toBe('fighting')
  })
  it('specials never duplicate their projectile with a generic melee hitbox', () => {
    for (const slot of ['neutralSpecial', 'forwardSpecial', 'backSpecial', 'finisher']) {
      const state = cast(marked(), slot)
      const fighter = {
        ...state.player,
        attack: { ...state.player.attack!, frame: attackData('special', state.player).startup },
      }
      expect(activeHitbox(fighter)).toBeNull()
    }
  })
  it('stops on startup interruption and loses steering in Zetsu while paper remains physical', () => {
    let state = cast(marked(), 'forwardSpecial')
    state = advanceKallutoPaper({
      ...state,
      player: { ...state.player, attack: null, hitStun: 10 },
    })
    expect(state.projectiles).toHaveLength(0)
    const shot = launchKallutoPaper(marked(), 'player', 'serpent').projectiles[0]
    state = {
      ...marked(),
      player: { ...state.player, nen: { ...state.player.nen, mode: 'zetsu' } },
    }
    expect(paperAvailable(state.player)).toBe(false)
    expect(travelKallutoPaper(state, shot, 1 / 60).y).toBe(shot.y)
    expect(state.opponent.plantedPaper).toHaveLength(1)
  })
  it('ranged confetti plants too; the low command explicitly aims at feet', () => {
    let state = selectPaperTarget(duel(), 'player', 'head')
    expect(step(cast(state, 'downSpecial'), 55).opponent.plantedPaper?.[0].zone).toBe('feet')
    state = performAuraAttack({ state, side: 'player', kind: 'ranged', auraCharged: false })
    expect(step(state, 55).opponent.plantedPaper?.[0].zone).toBe('head')
  })
  it('supports P2 and preserves paper ownership', () => {
    const state = step(cast(duel('opponent'), 'neutralSpecial', 'opponent'), 55)
    expect(state.player.plantedPaper).toEqual([{ owner: 'opponent', zone: 'torso' }])
    expect(finisherReady(state, 'opponent')).toBe(true)
  })
  it('requires attached paper for a doll, then hears actual remote speech', () => {
    let state = duel()
    expect(cast(state, 'backSpecial')).toBe(state)
    state = step(cast(marked(state), 'backSpecial'), 35)
    expect(paperState(state.player).doll?.target).toBe('opponent')
    state = { ...state, player: { ...state.player, x: 7 }, opponent: { ...state.opponent, x: 93 } }
    expect(paperListening(state, 'player')).toBe(true)
    expect(paperState(state.player).heard).toBeUndefined()
    const heard = speakBattleWords(state, 'opponent')
    expect(paperState(heard.player).heard).toMatchObject({
      speaker: 'opponent',
      text: 'I am here.',
    })
    expect(heard.opponent.health).toBe(state.opponent.health)
    expect(heard.opponent.aura).toBe(state.opponent.aura)
    expect(speakPaperWords(state, 'player')).toBe(state)
  })
  it('hears words near the marked subject, but no silence or silenced speech', () => {
    let state = step(cast(marked(), 'backSpecial'), 35)
    expect(paperState(step(state, 10).player).heard).toBeUndefined()
    expect(paperState(speakPaperWords(state, 'player').player).heard?.speaker).toBe('player')
    state = {
      ...state,
      opponent: {
        ...state.opponent,
        hatsuEffects: { ...state.opponent.hatsuEffects, senseSeals: 4 },
      },
    }
    expect(speakPaperWords(state, 'opponent')).toBe(state)
  })
  it('requires hearing and active Nen for the relay', () => {
    const state = step(cast(marked(), 'backSpecial'), 35)
    for (const player of [
      { ...state.player, coveringEars: true },
      { ...state.player, nen: { ...state.player.nen, mode: 'zetsu' as const } },
      { ...state.player, hatsuEffects: { ...state.player.hatsuEffects, senseSeals: 2 } },
      { ...state.player, hatsuEffects: { ...state.player.hatsuEffects, hatsuStolen: 1 } },
    ]) {
      const muted = { ...state, player }
      expect(paperListening(muted, 'player')).toBe(false)
      expect(speakPaperWords(muted, 'opponent')).toBe(muted)
    }
  })
  it('copies the same conditions through Skill Hunter', () => {
    let state = duel()
    state = {
      ...state,
      player: {
        ...state.player,
        id: 'chrollo',
        chrolloBook: addChrolloPage(createChrolloBook(), 'kalluto'),
      },
    }
    state = selectPaperCommand(state, 'player', 'serpent')
    expect(
      performAuraAttack({
        state,
        side: 'player',
        kind: 'special',
        moveId: CHROLLO_USE,
        auraCharged: false,
      }),
    ).toBe(state)
    state = selectPaperCommand(state, 'player', 'plant')
    state = step(
      performAuraAttack({
        state,
        side: 'player',
        kind: 'special',
        moveId: CHROLLO_USE,
        auraCharged: false,
      }),
      70,
    )
    expect(state.opponent.plantedPaper?.[0]).toEqual({ owner: 'player', zone: 'torso' })
  })
  it('clears paper and dolls for the next round', () => {
    const state = step(cast(marked(), 'backSpecial'), 35)
    const next = nextRound({ ...state, phase: 'finished', winner: 'player' })
    expect(next.opponent.plantedPaper).toBeUndefined()
    expect(next.player.kallutoPaper).toBeUndefined()
  })
})

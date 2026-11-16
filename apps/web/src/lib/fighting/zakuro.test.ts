import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  performAttack,
  performAuraAttack,
  performMove,
  tickFight,
  nextRound,
} from './engine'
import { commandMary } from './bloodyMaryAction'
import { advanceBloodyMary } from './bloodyMaryFrame'
import { MARY_SCOUT_LIFE, maryState, type MaryCommand } from './bloodyMary'
import { activeHitbox, attackData } from './frameData'
import { preyIsLive, predatorPrey } from './predatorPrey'
import { hatsuFor } from './hatsu/registry'
import { finisherReady, movesetFor } from './movesets'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'

function duel(): FightState {
  const base = beginFight(
    createFight('zakuro', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return { ...base, player: { ...base.player, x: 42 }, opponent: { ...base.opponent, x: 51 } }
}
function command(state: FightState, action: MaryCommand, side: FightSide = 'player'): FightState {
  return commandMary({ state, side, command: action }, performAuraAttack)
}
function advance(state: FightState, frames: number): FightState {
  let next = state
  for (let i = 0; i < frames; i++)
    next = tickFight(next, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return next
}
function deployed(base = duel()): FightState {
  return command(command(base, 'bleed'), 'bind')
}
function captured(base = duel()): FightState {
  let state = deployed(base)
  for (let i = 0; i < 70 && !state.opponent.maryCapture; i++) state = advance(state, 1)
  expect(state.opponent.maryCapture).toBeDefined()
  return state
}

describe('Zakuro’s physical Bloody Mary', () => {
  it('lets the AI finish a finite infusion without walking away or receiving health', () => {
    const base = beginFight(
      createFight('hisoka', 'zakuro', { mode: 'versus-ai', formatId: 'knockout' }),
    )
    const depleted = {
      ...base,
      opponent: {
        ...base.opponent,
        bloodyMary: { ...maryState(base.opponent), available: 0, bags: 1 },
      },
    }
    let state = command(depleted, 'infuse', 'opponent')
    for (let i = 0; i < 120; i++) state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: true })
    expect(state.opponent.bloodyMary).toMatchObject({ available: 1, bags: 0 })
    expect(state.opponent.x).toBe(base.opponent.x)
    expect(state.opponent.health).toBe(base.opponent.health)
  })

  it('keeps scouting blood a real Predator target and consumes the deployed material, not the body', () => {
    const state = command(command(duel(), 'bleed'), 'scout')
    expect(preyIsLive(state, 'player', 'bloody-mary')).toBe(true)
    const consumed = predatorPrey('bloody-mary').consume(state, 'player')
    expect(consumed.player.bloodyMary?.drops).toHaveLength(2)
    expect(consumed.player.health).toBe(state.player.health)
    expect(preyIsLive(duel(), 'player', 'bloody-mary')).toBe(false)
  })

  it('lets a physically crushed eyed droplet reform without creating extra blood', () => {
    const state = command(command(duel(), 'bleed'), 'scout')
    const kicked = performMove({
      state,
      side: 'opponent',
      action: 'light',
      input: { ...EMPTY_INPUT, down: true },
    })
    const enemy = {
      ...kicked.opponent,
      attack: { ...kicked.opponent.attack!, frame: attackData('light', kicked.opponent).startup },
    }
    const box = activeHitbox(enemy)!
    expect(box).not.toBeNull()
    const drop = {
      ...state.player.bloodyMary!.drops[0],
      x: (box.left + box.right) / 2,
      y: (box.bottom + box.top) / 2,
    }
    const ready = {
      ...kicked,
      opponent: enemy,
      player: { ...state.player, bloodyMary: { ...state.player.bloodyMary!, drops: [drop] } },
    }
    const crushed = advanceBloodyMary(ready)
    expect(crushed.player.bloodyMary?.drops[0].reformFrames).toBe(30)
    const reformed = advance({ ...crushed, opponent: { ...crushed.opponent, attack: null } }, 30)
    expect(reformed.player.bloodyMary?.drops[0].reformFrames).toBe(0)
    expect(reformed.player.bloodyMary?.available).toBe(3)
  })

  it('lets a prepared Stealth Dolphin borrower control one batch using its own wound and kit', () => {
    const base = duel()
    const actor = createFight('kurapika', 'zakuro').player
    const prepared = {
      ...base,
      player: {
        ...actor,
        x: 42,
        openWounds: 1,
        equipment: ['blood-infusion' as const],
        kurapika: {
          ...actor.kurapika!,
          emperorTime: true,
          held: {
            source: 'zakuro' as const,
            moveId: 'zakuro:neutralSpecial',
            victim: 'opponent' as const,
            loaded: true,
            used: false,
            sustainedKeys: [],
          },
        },
      },
    }
    const used = performMove({
      state: prepared,
      side: 'player',
      action: 'special',
      input: { ...EMPTY_INPUT, left: true },
    })
    expect(used.player.id).toBe('kurapika')
    expect(used.player.bloodyMary?.tendril).toBeDefined()
    expect(used.player.kurapika?.held?.used).toBe(true)
    const recalled = command(used, 'recall')
    const returned = advance(recalled, 60)
    const ended = performMove({
      state: returned,
      side: 'player',
      action: 'special',
      input: { ...EMPTY_INPUT, left: true },
    })
    expect(ended.player.kurapika?.held).toBeNull()
    expect(ended.player.bloodyMary?.tendril).toBeUndefined()
  })

  it('requires the user’s wound and actual infusion equipment before spending blood or aura', () => {
    const base = duel()
    expect(base.player.equipment).toContain('blood-infusion')
    expect(command(base, 'bind')).toBe(base)
    const wounded = command(base, 'bleed')
    expect(wounded.player.health).toBe(base.player.health - 2)
    expect(wounded.player.openWounds).toBe(1)
    expect(wounded.opponent.health).toBe(base.opponent.health)
    const missing = { ...wounded, player: { ...wounded.player, equipment: [] } }
    expect(command(missing, 'bind')).toBe(missing)
  })

  it('deploys a travelling blood mass, never a damaging carrier or instant on-hit paralysis', () => {
    const state = deployed()
    expect(state.player.bloodyMary?.available).toBe(3)
    expect(state.player.bloodyMary?.tendril?.phase).toBe('flying')
    expect(state.player.attack).toBeNull()
    expect(state.opponent.maryCapture).toBeUndefined()
    expect(advance(state, 15).opponent.maryCapture).toBeUndefined()
    const hit = hatsuFor('zakuro').onImpact({
      state,
      side: 'player',
      defenderSide: 'opponent',
      source: 'zakuro',
      blocked: false,
      concealed: false,
    })
    expect(hit).toBe(state)
  })

  it('captures only after collision, holds the body without hitstun or forced Zetsu, and allows basic Nen', () => {
    const state = captured()
    expect(state.opponent.hitStun).toBe(0)
    expect(state.opponent.hatsuEffects.forcedZetsuFrames).toBe(0)
    expect(state.opponent.nen.mode).toBe('ten')
    expect(performAttack(state, 'opponent', 'light')).toBe(state)
    const resisted = tickFight(state, EMPTY_INPUT, {
      dt: 1 / 60,
      opponentInput: { ...EMPTY_INPUT, left: true, jump: true, aura: true, guard: true },
    })
    expect(resisted.opponent.x).toBe(state.opponent.x)
    expect(resisted.opponent.y).toBe(state.opponent.y)
    expect(resisted.opponent.nen.ken).toBe(true)
    expect(resisted.opponent.maryCapture?.resistance).toBe(1)
  })

  it('allows evasion, guard and sufficiently sustained Ren/Ken to defeat the capture', () => {
    const prepared = deployed()
    const evaded = { ...prepared, opponent: { ...prepared.opponent, x: 80 } }
    expect(advance(evaded, 80).opponent.maryCapture).toBeUndefined()
    const ready = command(duel(), 'bleed')
    const guarded = {
      ...ready,
      opponent: {
        ...ready.opponent,
        nen: { ...ready.opponent.nen, mode: 'ren' as const, ken: true },
      },
    }
    let state = command(guarded, 'bind')
    for (let i = 0; i < 70; i++)
      state = tickFight(state, EMPTY_INPUT, {
        dt: 1 / 60,
        opponentInput: { ...EMPTY_INPUT, aura: true, guard: true },
      })
    expect(state.opponent.maryCapture).toBeUndefined()
    state = captured()
    for (let i = 0; i < 24; i++)
      state = tickFight(state, EMPTY_INPUT, {
        dt: 1 / 60,
        opponentInput: { ...EMPTY_INPUT, aura: true, guard: true },
      })
    expect(state.opponent.maryCapture).toBeUndefined()
    expect(state.opponent.hitStun).toBe(0)
  })

  it('releases when the owner is hit, loses Nen, changes copied page, or exceeds tether reach', () => {
    const held = captured()
    for (const patch of [
      { hitStun: 20 },
      { moonlightZetsu: true },
      { x: 8 },
      { hatsuEffects: { ...held.player.hatsuEffects, hatsuStolen: 1 } },
    ]) {
      const next = advance({ ...held, player: { ...held.player, ...patch } }, 1)
      expect(next.opponent.maryCapture).toBeUndefined()
    }
  })

  it('requires an established capture and a reaction window before the actual ground slam', () => {
    const base = duel()
    expect(command(base, 'slam')).toBe(base)
    const held = captured()
    expect(command(held, 'slam')).toBe(held)
    const ready = advance(held, 31)
    const slammed = command(ready, 'slam')
    expect(slammed.opponent.health).toBeLessThan(ready.opponent.health)
    expect(slammed.opponent.health).toBeGreaterThan(0)
    expect(slammed.opponent.knockdownFrames).toBe(48)
    expect(slammed.opponent.maryCapture).toBeUndefined()
    expect(slammed.impact?.knockdown).toBe(true)
    expect(slammed.player.bloodyMary?.tendril?.phase).toBe('returning')
  })

  it('recalls only its own deployed blood without healing either fighter or filling the bags', () => {
    const held = captured()
    const recalled = advance(command(held, 'recall'), 60)
    expect(recalled.player.bloodyMary?.available).toBe(6)
    expect(recalled.player.bloodyMary?.bags).toBe(6)
    expect(recalled.player.health).toBe(held.player.health)
    expect(recalled.opponent.health).toBe(held.opponent.health)
    expect(recalled.opponent.maryCapture).toBeUndefined()
  })

  it('uses a finite stationary infusion to replenish one unit, without healing or infinite material', () => {
    const base = duel()
    const depleted = {
      ...base,
      player: { ...base.player, bloodyMary: { ...maryState(base.player), available: 0, bags: 1 } },
    }
    const begun = command(depleted, 'infuse')
    expect(advance(begun, 119).player.bloodyMary?.available).toBe(0)
    const done = advance(begun, 120)
    expect(done.player.bloodyMary).toMatchObject({ available: 1, bags: 0 })
    expect(done.player.health).toBe(base.player.health)
    expect(command(done, 'infuse')).toBe(done)
  })

  it('sends autonomous visible scouts that do not damage, bind or know a distant target', () => {
    const base = duel()
    const distant = { ...base, opponent: { ...base.opponent, x: 88 } }
    const scouts = command(command(distant, 'bleed'), 'scout')
    expect(scouts.player.bloodyMary?.drops).toHaveLength(3)
    expect(scouts.player.bloodyMary?.drops[0].remainingFrames).toBe(MARY_SCOUT_LIFE)
    expect(advance(scouts, 30).player.bloodyMary?.lastSeen).toBeUndefined()
    const found = advance(scouts, 320)
    expect(found.player.bloodyMary?.lastSeen?.x).toBe(88)
    expect(found.opponent.health).toBe(base.opponent.health)
    expect(found.opponent.maryCapture).toBeUndefined()
    const expired = {
      ...scouts,
      player: {
        ...scouts.player,
        bloodyMary: {
          ...scouts.player.bloodyMary!,
          drops: scouts.player.bloodyMary!.drops.map((drop) => ({ ...drop, remainingFrames: 1 })),
        },
      },
    }
    expect(advanceBloodyMary(expired).player.bloodyMary?.drops).toHaveLength(0)
  })

  it('never conjures a transfusion kit or borrows the victim’s wound through Skill Hunter', () => {
    const base = duel()
    const copy = createFight('chrollo', 'hisoka').player
    const state = {
      ...base,
      player: {
        ...copy,
        x: 42,
        chrolloBook: { pages: ['zakuro' as const], page: 0, open: true, bookmark: null },
      },
    }
    expect(command(state, 'bind')).toBe(state)
    const equipped = {
      ...state,
      player: { ...state.player, equipment: ['blood-infusion' as const, 'book' as const] },
    }
    expect(command(equipped, 'bind')).toBe(equipped)
    const prepared = command(equipped, 'bleed')
    const held = captured(prepared)
    const closed = {
      ...held,
      player: { ...held.player, chrolloBook: { ...held.player.chrolloBook!, open: false } },
    }
    expect(advance(closed, 1).opponent.maryCapture).toBeUndefined()
  })

  it('removes the invented exsanguination and shield and resets materials and restraints next round', () => {
    const state = captured()
    const next = nextRound({ ...state, phase: 'finished', winner: 'player', matchWinner: null })
    expect(next.player.bloodyMary).toBeUndefined()
    expect(next.opponent.maryCapture).toBeUndefined()
    const moves = movesetFor('zakuro')!.moves
    expect(moves).toHaveLength(14)
    expect(
      moves.some((move) => /Exsanguination|Écran de sang|Flaque captive/.test(move.nameFr)),
    ).toBe(false)
    expect(finisherReady(state, 'player')).toBe(false)
    expect(
      moves.filter((move) => move.category === 'special').every((move) => move.tuning.damage === 0),
    ).toBe(true)
    expect(performMove({ state, side: 'player', action: 'finisher' })).toBe(state)
  })
})

import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight, opponentAttack } from './engine'
import { bindBiohazard } from './biohazardCapture'
import { performArsenalAction } from './arsenalExecution'
import { EMPTY_INPUT, type FightState } from './types'

function captured(): FightState {
  const base = beginFight(createFight('padaille', 'hinrigh', { mode: 'versus-local' }))
  const state = {
    ...base,
    player: { ...base.player, aura: 100, x: 42 },
    opponent: { ...base.opponent, x: 70 },
  }
  const object = { ...state.opponent.biohazard!.objects[0], phase: 'bound' as const, x: 42 }
  const bound = {
    ...state,
    opponent: {
      ...state.opponent,
      biohazard: { objects: [object, ...state.opponent.biohazard!.objects.slice(1)] },
    },
  }
  return bindBiohazard(bound, 'opponent', object)
}
function escape(state: FightState, tool: 'drill' | 'axe' = 'drill') {
  return performArsenalAction(
    { state, side: 'player', command: { action: 'padaille-escape', target: tool } },
    performAuraAttack,
  )
}
function frames(state: FightState, count: number): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}

describe('Padaille’s shown handcuff applications', () => {
  it('pays for the drill transformation and slips a real cuff after an interruptible preparation', () => {
    const state = captured(),
      started = escape(state)
    expect(started.player.biohazardRestraint).toBeDefined()
    expect(started.player.padailleTool).toBe('drill')
    expect(started.player.aura).toBe(80)
    expect(started.player.attack).toBeNull()
    expect(started.player.x).toBe(state.player.x)
    expect(frames(started, 11).player.biohazardRestraint).toBeDefined()
    const freed = frames(started, 12)
    expect(freed.player.biohazardRestraint).toBeUndefined()
    expect(freed.opponent.biohazard!.objects[0]).toMatchObject({ phase: 'dropped', durability: 12 })
    expect(freed.opponent.health).toBe(state.opponent.health)
    expect(freed.score).toEqual(state.score)
  })

  it('accepts the ordinary drill input while cuffed, but no other physical attack', () => {
    const state = captured()
    const cast = performAuraAttack({
      state,
      side: 'player',
      kind: 'special',
      moveId: 'padaille:forwardSpecial',
      auraCharged: false,
    })
    expect(cast.player.padailleEscape?.tool).toBe('drill')
    expect(performAuraAttack({ state, side: 'player', kind: 'light', auraCharged: false })).toBe(
      state,
    )
  })

  it('cuts only if the axe overcomes actual material durability', () => {
    const state = captured()
    expect(frames(escape(state, 'axe'), 12).opponent.biohazard!.objects[0].phase).toBe('broken')
    const tough = {
      ...state,
      opponent: {
        ...state.opponent,
        biohazard: {
          objects: state.opponent.biohazard!.objects.map((object) => ({
            ...object,
            durability: 100,
          })),
        },
      },
    }
    const attempted = frames(escape(tough, 'axe'), 12)
    expect(attempted.player.biohazardRestraint).toBeDefined()
    expect(attempted.opponent.biohazard!.objects[0].durability).toBeLessThan(100)
    expect(attempted.opponent.biohazard!.objects[0].durability).toBeGreaterThan(0)
  })

  it('cannot escape without Nen and cancels unfinished preparation on interruption', () => {
    const state = captured()
    const sealed = {
      ...state,
      player: { ...state.player, hatsuEffects: { ...state.player.hatsuEffects, hatsuStolen: 1 } },
    }
    expect(escape(sealed)).toBe(sealed)
    const started = escape(state)
    const interrupted = frames({ ...started, player: { ...started.player, hitStun: 20 } }, 1)
    expect(interrupted.player.padailleEscape).toBeUndefined()
    expect(interrupted.player.biohazardRestraint).toBeDefined()
    expect(interrupted.player.aura).toBeLessThan(state.player.aura)
  })

  it('does not remove a different Nen restraint or confer a universal escape', () => {
    const state = captured()
    const other = {
      ...state,
      player: {
        ...state.player,
        biohazardRestraint: undefined,
        chainJail: { owner: 'opponent' as const, x: 42, y: 0 },
      },
    }
    expect(escape(other)).toBe(other)
    const chained = {
      ...state,
      player: { ...state.player, chainJail: { owner: 'opponent' as const, x: 42, y: 0 } },
    }
    expect(escape(chained)).toBe(chained)
  })

  it('makes the restrained AI try its own drill without giving other fighters the same escape', () => {
    const state = captured()
    const mirrored: FightState = {
      ...state,
      player: { ...state.opponent, x: 70 },
      opponent: {
        ...state.player,
        biohazardRestraint: { ...state.player.biohazardRestraint!, owner: 'player' },
      },
    }
    expect(opponentAttack(mirrored).opponent.padailleEscape?.tool).toBe('drill')
    const wrong = { ...state, player: { ...state.player, id: 'hisoka' as const } }
    expect(escape(wrong)).toBe(wrong)
  })

  it('uses the actual stolen page or single-use Dolphin without replacing the borrower’s body', () => {
    const state = captured()
    const chrollo = createFight('chrollo', 'hinrigh').player
    const copied = {
      ...state,
      player: {
        ...chrollo,
        x: 42,
        aura: 100,
        biohazardRestraint: state.player.biohazardRestraint,
        chrolloBook: {
          pages: ['padaille'] as const,
          page: 0,
          open: false,
          bookmark: 'padaille' as const,
        },
      },
    }
    const freed = frames(escape(copied), 12)
    expect(freed.player.id).toBe('chrollo')
    expect(freed.player.padailleTool).toBe('drill')
    expect(freed.player.biohazardRestraint).toBeUndefined()
    const unavailable = {
      ...copied,
      player: {
        ...copied.player,
        chrolloBook: { ...copied.player.chrolloBook, bookmark: null, pages: [] },
      },
    }
    expect(escape(unavailable)).toBe(unavailable)
    const kurapika = createFight('kurapika', 'hinrigh').player
    const loaded = {
      ...state,
      player: {
        ...kurapika,
        x: 42,
        aura: 100,
        biohazardRestraint: state.player.biohazardRestraint,
        kurapika: {
          ...kurapika.kurapika!,
          emperorTime: true,
          held: {
            source: 'padaille' as const,
            moveId: 'padaille:neutralSpecial',
            victim: 'opponent' as const,
            loaded: true,
            used: false,
            sustainedKeys: [],
          },
        },
      },
    }
    const borrowed = frames(escape(loaded), 12)
    expect(borrowed.player.id).toBe('kurapika')
    expect(borrowed.player.biohazardRestraint).toBeUndefined()
    expect(borrowed.player.kurapika?.held?.used).toBe(true)
    expect(borrowed.player.padailleTool).toBe('drill')
  })
})

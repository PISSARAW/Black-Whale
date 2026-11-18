import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performMove, tickFight } from './engine'
import { toggleEmperorTime } from './kurapikaActions'
import { createCinematicDirector } from './cinematicDirector'
import { EMPTY_INPUT, type FightImpact, type FightState } from './types'

function impact(patch: Partial<FightImpact> = {}): FightImpact {
  return {
    sequence: 1,
    attacker: 'player',
    kind: 'special',
    damage: 8,
    blocked: false,
    parried: false,
    critical: false,
    knockdown: false,
    counterHit: false,
    punish: false,
    antiAir: false,
    wallSplat: false,
    invulnerable: false,
    comboHits: 1,
    damageScale: 1,
    points: 1,
    zone: 'torso',
    concealed: false,
    avoided: false,
    projectileId: null,
    position: { x: 50, y: 7 },
    ...patch,
  }
}
const fresh = () => beginFight(createFight('kurapika', 'chrollo', { mode: 'versus-local' }))

describe('live cinematic direction', () => {
  it.each(['player', 'opponent'] as const)(
    'frames real Emperor Time activation for %s without changing combat',
    (side) => {
      let state = beginFight(createFight('kurapika', 'kurapika', { mode: 'versus-local' }))
      const director = createCinematicDirector()
      expect(director.update(state).detail).toBeNull()
      state = toggleEmperorTime(state, side)
      const saved = JSON.stringify(state)
      const direction = director.update(state)
      expect(direction.detail).toMatchObject({ kind: 'eyes', side })
      expect(direction.strength).toBe(1.2)
      for (let i = 0; i < 120; i++) expect(director.update(state)).toEqual(direction)
      expect(JSON.stringify(state)).toBe(saved)
      expect(director.update({ ...state, frame: 70 }).detail?.kind).toBe('eyes')
      expect(director.update({ ...state, frame: 85 }).detail).toBeNull()
    },
  )
  it('frames both Biscuit and Pain Packer transitions and Rising Sun', () => {
    for (const side of ['player', 'opponent'] as const) {
      for (const kind of ['biscuit', 'armour', 'sun'] as const) {
        const director = createCinematicDirector()
        const fighter = kind === 'biscuit' ? 'biscuit' : 'feitan'
        const state = beginFight(
          createFight(
            side === 'player' ? fighter : 'hisoka',
            side === 'opponent' ? fighter : 'hisoka',
          ),
        )
        director.update(state)
        const f = state[side]
        const next = {
          ...state,
          frame: 1,
          [side]:
            kind === 'biscuit'
              ? { ...f, biscuitTrueForm: true }
              : {
                  ...f,
                  hatsuEffects: {
                    ...f.hatsuEffects,
                    painPacker: {
                      injuries: 30,
                      packedDamage: 30,
                      armour: true,
                      sun:
                        kind === 'sun'
                          ? {
                              x: 50,
                              y: 20,
                              radius: 20,
                              damage: 30,
                              age: 0,
                              duration: 180,
                              scored: [],
                            }
                          : null,
                    },
                  },
                },
        }
        expect(director.update(next).detail).toMatchObject({
          kind: kind === 'biscuit' ? 'body' : kind,
          side,
        })
      }
    }
  })
  it('keeps an ordinary chain cast and its real contact in type 1 without an inset', () => {
    let state = fresh()
    state = {
      ...state,
      player: { ...state.player, x: 48, aura: 100 },
      opponent: { ...state.opponent, x: 53 },
    }
    const director = createCinematicDirector()
    director.update(state)
    state = performMove({
      state,
      side: 'player',
      action: 'special',
      input: { ...EMPTY_INPUT, right: true },
    })
    expect(director.update(state).detail).toBeNull()
    const directions = []
    for (let i = 0; i < 80; i++) {
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
      directions.push(director.update(state))
    }
    expect(directions.every((d) => d.detail === null)).toBe(true)
    expect(state.opponent.health).toBeLessThan(state.opponent.maxHealth)
  })
  it.each([{ blocked: true }, { avoided: true }, { invulnerable: true }])(
    'does not present a failed contact as a successful impact: %j',
    (patch) => {
      const state = fresh()
      const director = createCinematicDirector()
      director.update(state)
      expect(director.update({ ...state, frame: 1, impact: impact(patch) }).detail).toBeNull()
    },
  )
  it('follows a confirmed projectile contact for three seconds after the caster recovered', () => {
    const state = fresh()
    const director = createCinematicDirector()
    director.update(state)
    const struck = { ...state, frame: 150, impact: impact({ kind: 'ranged', projectileId: 7 }) }
    expect(director.update(struck).detail).toMatchObject({ kind: 'impact', side: 'opponent' })
    expect(director.update({ ...struck, frame: 300 }).detail?.kind).toBe('impact')
    expect(director.update({ ...struck, frame: 331 }).detail).toBeNull()
  })
  it('lets awakenings take priority over repeated contacts, and clears them when disabled or rewound', () => {
    const state = fresh()
    const director = createCinematicDirector()
    director.update(state)
    const awakened = { ...toggleEmperorTime(state, 'player'), frame: 1 }
    director.update(awakened)
    const contact: FightState = { ...awakened, frame: 2, impact: impact() }
    expect(director.update(contact).detail?.kind).toBe('eyes')
    expect(director.update(contact, 0)).toMatchObject({ detail: null, strength: 0 })
    expect(director.update(contact, 1).detail).toBeNull()
    director.update({ ...awakened, frame: 10 })
    expect(director.update(state).detail).toBeNull()
    expect(director.update({ ...awakened, roundNumber: 2 }).detail).toBeNull()
  })
  it('releases the detail and zoom after a verdict even when the simulation has stopped', () => {
    const director = createCinematicDirector()
    const state = fresh()
    director.update(state)
    const active = { ...toggleEmperorTime(state, 'player'), frame: 1 }
    director.update(active)
    const finished: FightState = { ...active, phase: 'finished', winner: 'player' }
    for (let i = 0; i < 300; i++) director.update(finished, 1, 1 / 60)
    expect(director.update(finished)).toMatchObject({ detail: null, strength: 0 })
    expect(finished.frame).toBe(1)
  })
})

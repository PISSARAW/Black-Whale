import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, performMove, tickFight } from './engine'
import { FIGHTING_ROSTER } from './roster'
import { hatsuFor, resolveDeathHatsu, resolveHatsuImpact } from './hatsu'
import { createChrolloBook, CHROLLO_USE } from './chrolloBook'
import { moveForSlot } from './movesets'
import { forceZetsu } from './nen'
import { advanceHatsuFrames } from './hatsu/registry'
import { advanceFighterAttack } from './fighterAttacks'
import { CATS_NAME } from './outsideDuelAbility'
import { attackAuraCost } from './fightAttackCost'
import { createKurapika } from './kurapika'
import { createPainPacker } from './feitanPain'
import { triggerHatsuAction } from './hatsu'
import { attackData } from './frameData'
import {
  EMPTY_INPUT,
  type ArcadeFighter,
  type FighterId,
  type FightSide,
  type FightState,
} from './types'

function duel(id: FighterId, side: FightSide = 'player'): FightState {
  const state = beginFight(
    createFight(side === 'player' ? id : 'hisoka', side === 'opponent' ? id : 'hisoka', {
      mode: 'training',
    }),
  )
  return {
    ...state,
    player: { ...state.player, aura: 100, x: 25 },
    opponent: { ...state.opponent, aura: 100, x: 75 },
  }
}

function cast(state: FightState, moveId?: string, side: FightSide = 'player') {
  return performAuraAttack({ state, side, kind: 'special', moveId, auraCharged: false })
}

function frame(state: FightState, count = 1): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}

const LOCKS: Array<[string, (fighter: ArcadeFighter) => ArcadeFighter]> = [
  ['death', (fighter) => ({ ...fighter, health: 0 })],
  ['Zetsu', forceZetsu],
  [
    'forced Zetsu before its next tick',
    (fighter) => ({
      ...fighter,
      hatsuEffects: { ...fighter.hatsuEffects, forcedZetsuFrames: 10 },
    }),
  ],
  ['zero aura', (fighter) => ({ ...fighter, aura: 0 })],
  ['exhaustion despite recovered aura', (fighter) => ({ ...fighter, auraExhausted: true })],
  [
    'Skill Hunter theft',
    (fighter) => ({
      ...fighter,
      hatsuEffects: { ...fighter.hatsuEffects, hatsuStolen: 1 },
    }),
  ],
  ['On seal', (fighter) => ({ ...fighter, on: { grudge: 0, sealFrames: 30 } })],
  ['active On', (fighter) => ({ ...fighter, nen: { ...fighter.nen, on: true } })],
  [
    'Predator price',
    (fighter) => ({
      ...fighter,
      predator: {
        watching: false,
        known: [],
        analysis: null,
        hunt: null,
        sealFrames: 60,
        successes: 0,
      },
    }),
  ],
  ['Moonlight sanction', (fighter) => ({ ...fighter, moonlightZetsu: true })],
  [
    'Chain Jail',
    (fighter) => ({
      ...fighter,
      chainJail: { owner: 'opponent', x: fighter.x, y: 0 },
    }),
  ],
]

describe('shared Clash Nen admission and execution contracts', () => {
  const activeRoster = FIGHTING_ROSTER.filter(({ id }) => !hatsuFor(id).martialOnly)

  for (const side of ['player', 'opponent'] as const) {
    for (const { id } of activeRoster) {
      it.each(LOCKS.filter(([label]) => id !== 'rihan' || label !== 'zero aura'))(
        `${id} / ${side} cannot activate under %s`,
        (_label, lock) => {
          const base = duel(id, side)
          const state = { ...base, [side]: lock(base[side]) }
          expect(cast(state, moveForSlot(id, 'neutralSpecial')?.id, side)).toBe(state)
        },
      )
    }
  }

  it.each(FIGHTING_ROSTER)('$id keeps callable lazy lifecycle hooks', ({ id }) => {
    const hatsu = hatsuFor(id)
    expect(typeof hatsu.onTrigger).toBe('function')
    expect(typeof hatsu.onImpact).toBe('function')
    expect(typeof hatsu.onFrame).toBe('function')
  })

  it('rejects another body’s move and a mismatched kind before any cost or effect', () => {
    const state = duel('hisoka')
    expect(cast(state, 'saiyu:neutralSpecial')).toBe(state)
    expect(
      performAuraAttack({
        state,
        side: 'player',
        kind: 'light',
        moveId: 'hisoka:neutralSpecial',
        auraCharged: false,
      }),
    ).toBe(state)
  })

  it('enforces finisher conditions for direct/AI actions as well as UI actions', () => {
    const state = duel('biscuit')
    expect(cast(state, 'biscuit:finisher')).toBe(state)
    expect(performMove({ state, side: 'player', action: 'finisher' })).toBe(state)
  })

  it('does not turn a bodily transformation into a Nen expenditure', () => {
    const base = duel('biscuit')
    const state = { ...base, player: { ...forceZetsu(base.player), aura: 0 } }
    const next = cast(state, 'biscuit:neutralSpecial')
    expect(next.player.biscuitTrueForm).toBe(true)
    expect(next.player.aura).toBe(0)
    expect(next.opponent.health).toBe(state.opponent.health)
  })

  it.each(['theta', 'camilla', 'benjamin', 'musse'] as const)(
    '%s keeps its physical firearm in Zetsu without aura',
    (id) => {
      const base = duel(id)
      const state = { ...base, player: { ...forceZetsu(base.player), aura: 0 } }
      const next = performAuraAttack({ state, side: 'player', kind: 'ranged', auraCharged: false })
      expect(next.player.attack?.kind).toBe('ranged')
      expect(next.player.aura).toBe(0)
    },
  )

  it('pays the actual copied neutral cost exactly once', () => {
    const base = duel('chrollo')
    const cost = moveForSlot('saiyu', 'neutralSpecial')!.auraCost
    const state = {
      ...base,
      player: {
        ...base.player,
        aura: cost,
        chrolloBook: {
          ...createChrolloBook(),
          pages: ['saiyu'] as const,
        },
      },
    }
    const next = cast(state, CHROLLO_USE)
    expect(next.player.attack?.hatsuSource).toBe('saiyu')
    expect(next.player.aura).toBe(0)
    expect(state.player.aura).toBe(cost)
    expect(
      cast({ ...state, player: { ...state.player, aura: cost - 1 } }, CHROLLO_USE).player.attack,
    ).toBeNull()
  })

  it('charges copied Pain Packer before its state changes, then pays Rising Sun separately', () => {
    const base = duel('chrollo')
    const state = {
      ...base,
      player: {
        ...base.player,
        aura: 46,
        chrolloBook: { ...createChrolloBook(), pages: ['feitan'] as const },
        hatsuEffects: {
          ...base.player.hatsuEffects,
          painPacker: { ...createPainPacker(), injuries: 15 },
        },
      },
    }
    const started = cast(state, CHROLLO_USE)
    expect(started.player.aura).toBe(40)
    const armour = advanceHatsuFrames({
      ...started,
      player: {
        ...started.player,
        attack: { ...started.player.attack!, frame: attackData('special', started.player).startup },
      },
    })
    expect(armour.player.hatsuEffects.painPacker?.armour).toBe(true)
    const ready = { ...armour, player: { ...armour.player, attack: null } }
    expect(attackAuraCost({ fighter: ready.player, kind: 'special', moveId: CHROLLO_USE })).toBe(40)
    const sun = cast(ready, CHROLLO_USE)
    expect(sun.player.aura).toBe(0)
    const released = advanceHatsuFrames({
      ...sun,
      player: {
        ...sun.player,
        attack: { ...sun.player.attack!, frame: attackData('special', sun.player).startup },
      },
    })
    expect(released.player.hatsuEffects.painPacker?.sun).not.toBeNull()
  })

  it('requires visual witnessing for Skill Hunter and lets Gyo reveal In', () => {
    const base = duel('saiyu')
    const blind = {
      ...base,
      opponent: {
        ...base.opponent,
        hatsuEffects: { ...base.opponent.hatsuEffects, senseSeals: 1 },
      },
    }
    expect(
      triggerHatsuAction({ state: blind, side: 'player', source: 'saiyu' }).opponent.hatsuEffects
        .witnessedHatsu,
    ).toBeNull()
    expect(
      triggerHatsuAction({ state: base, side: 'player', source: 'saiyu', concealed: true }).opponent
        .hatsuEffects.witnessedHatsu,
    ).toBeNull()
    const gyo = {
      ...base,
      opponent: { ...base.opponent, nen: { ...base.opponent.nen, gyo: true } },
    }
    expect(
      triggerHatsuAction({ state: gyo, side: 'player', source: 'saiyu', concealed: true }).opponent
        .hatsuEffects.witnessedHatsu,
    ).toBe('saiyu')
  })

  it('does not disclose a bespoke activation to a blinded opponent', () => {
    const base = duel('basho')
    const state = {
      ...base,
      opponent: {
        ...base.opponent,
        hatsuEffects: { ...base.opponent.hatsuEffects, senseSeals: 1 },
      },
    }
    const written = cast(state, 'basho:neutralSpecial')
    expect(written.player.bashoPoem?.writingFrames).toBeGreaterThan(0)
    expect(written.opponent.hatsuEffects.witnessedHatsu).toBeNull()
  })

  it('does not hide physical supports merely because the caster is maintaining In', () => {
    const base = duel('basho')
    const state = { ...base, player: { ...base.player, nen: { ...base.player.nen, in: true } } }
    expect(cast(state, 'basho:neutralSpecial').opponent.hatsuEffects.witnessedHatsu).toBe('basho')
  })

  it('pays the surcharge for the selected move and never produces negative aura', () => {
    const base = duel('saiyu')
    const moveId = 'saiyu:forwardSpecial'
    const cost = moveForSlot('saiyu', 'forwardSpecial')!.auraCost
    const state = {
      ...base,
      player: {
        ...base.player,
        aura: cost + 12,
        nen: { ...base.player.nen, in: true },
      },
    }
    const next = cast(state, moveId)
    expect(next.player.attack?.concealed).toBe(true)
    expect(next.player.aura).toBe(0)
    expect(
      attackAuraCost({ fighter: state.player, kind: 'special', moveId, concealed: true }),
    ).toBe(cost + 12)
  })

  it.each(LOCKS.filter(([name]) => name !== 'zero aura'))(
    'revalidates a buffered Hatsu after %s',
    (_label, lock) => {
      const base = duel('saiyu')
      let state = cast({ ...base, player: { ...base.player, hitStun: 3 } }, 'saiyu:neutralSpecial')
      expect(state.player.bufferedAttack).not.toBeNull()
      state = { ...state, player: lock({ ...state.player, hitStun: 0 }) }
      if (_label === 'exhaustion despite recovered aura') state.player.aura = 1
      // Aura input is neutralized under imposed seals; voluntary Zetsu uses held input below.
      if (_label === 'Zetsu') {
        state = tickFight(
          state,
          { ...EMPTY_INPUT, aura: true, down: true },
          {
            dt: 1 / 60,
            opponentInput: EMPTY_INPUT,
          },
        )
      } else state = frame(state)
      expect(state.player.attack).toBeNull()
      expect(state.opponent.hatsuEffects.senseSeals).toBe(0)
    },
  )

  it('revalidates a buffered cost instead of debiting an unaffordable action', () => {
    const base = duel('saiyu')
    let state = cast({ ...base, player: { ...base.player, hitStun: 3 } }, 'saiyu:neutralSpecial')
    state = frame({ ...state, player: { ...state.player, aura: 1, hitStun: 0 } })
    expect(state.player.attack).toBeNull()
    expect(state.player.aura).toBeGreaterThanOrEqual(0)
  })

  it('interrupts a lost Hatsu before active frames without refunding its startup cost', () => {
    const started = cast(duel('saiyu'), 'saiyu:neutralSpecial')
    const lost = {
      ...started.player,
      stolenChainAbility: {
        owner: 'opponent' as const,
        moveId: 'saiyu:neutralSpecial',
      },
    }
    const stopped = advanceFighterAttack(lost)
    expect(stopped.attack).toBeNull()
    expect(stopped.aura).toBe(started.player.aura)
    expect(
      resolveHatsuImpact({
        state: { ...started, player: lost },
        side: 'player',
        defenderSide: 'opponent',
        source: 'saiyu',
        moveId: 'saiyu:neutralSpecial',
        blocked: false,
        concealed: false,
      }).opponent.hatsuEffects.senseSeals,
    ).toBe(0)
  })

  it('drops an in-progress copied cast if the page is no longer active', () => {
    const base = duel('chrollo')
    const started = cast(
      {
        ...base,
        player: {
          ...base.player,
          chrolloBook: {
            ...createChrolloBook(),
            pages: ['saiyu'] as const,
          },
        },
      },
      CHROLLO_USE,
    )
    const stopped = advanceFighterAttack({
      ...started.player,
      chrolloBook: {
        ...started.player.chrolloBook!,
        open: false,
      },
    })
    expect(stopped.attack).toBeNull()
  })

  it.each(['hisoka', 'hanzo', 'melody'] as const)(
    '%s loses a maintained effect under a contractual Zetsu sanction',
    (id) => {
      let state = duel(id)
      if (id === 'hisoka') state.opponent.x = state.player.x + 5
      state = cast(state, `${id}:neutralSpecial`)
      state = frame(state, 45)
      if (id === 'hisoka') expect(state.bungeeGum).not.toBeNull()
      if (id === 'hanzo') expect(state.player.hanzoProjection).toBeDefined()
      if (id === 'melody') expect(state.player.melodyPerformance).toBeDefined()
      const sanctioned = { ...state, player: { ...state.player, moonlightZetsu: true } }
      const next = advanceHatsuFrames(sanctioned)
      if (id === 'hisoka') expect(next.bungeeGum).toBeNull()
      if (id === 'hanzo') expect(next.player.hanzoProjection).toBeUndefined()
      if (id === 'melody') expect(next.player.melodyPerformance).toBeUndefined()
    },
  )

  it('does not heal Needle People’s destroyed autonomy when the owner loses Nen', () => {
    const base = duel('illumi')
    const state = {
      ...base,
      player: { ...base.player, moonlightZetsu: true },
      opponent: {
        ...base.opponent,
        needlePuppet: {
          owner: 'player' as const,
          order: 'stay' as const,
          needleEmbedded: true,
        },
      },
    }
    const next = frame(state)
    expect(next.opponent.needlePuppet).toEqual(state.opponent.needlePuppet)
    expect(next.opponent.attack).toBeNull()
  })

  it('keeps post-mortem activation separate from voluntary Nen, including single-technique theft', () => {
    const base = duel('camilla')
    const dead = { ...base, player: { ...forceZetsu(base.player), health: 0, aura: 0 } }
    expect(resolveDeathHatsu(dead, 'opponent', 'player')?.catsName).toBeDefined()
    expect(
      resolveDeathHatsu(
        {
          ...dead,
          player: {
            ...dead.player,
            stolenChainAbility: {
              owner: 'opponent',
              moveId: CATS_NAME.id,
            },
          },
        },
        'opponent',
        'player',
      ),
    ).toBeNull()
  })

  it('steals the actual passive Cat’s Name without inventing a living activation', () => {
    const base = beginFight(createFight('kurapika', 'camilla', { mode: 'training' }))
    const drained = frame({
      ...base,
      player: { ...base.player, aura: 100, x: 40 },
      opponent: { ...base.opponent, aura: 0, x: 45, drainingChain: { owner: 'player' } },
    })
    expect(drained.player.kurapika?.held?.moveId).toBe(CATS_NAME.id)
    expect(drained.opponent.stolenChainAbility?.moveId).toBe(CATS_NAME.id)
    const emperor = {
      ...drained,
      player: {
        ...drained.player,
        kurapika: {
          ...drained.player.kurapika!,
          emperorTime: true,
        },
      },
    }
    expect(cast(emperor, 'kurapika:backSpecial')).toBe(emperor)
    expect(emperor.player.kurapika?.held?.loaded).toBe(false)
  })

  it('does not clone equipment, affinity or targets when Dolphin is prepared', () => {
    const base = duel('kurapika')
    const state = {
      ...base,
      player: {
        ...base.player,
        kurapika: {
          ...createKurapika(),
          emperorTime: true,
          held: {
            victim: 'opponent' as const,
            source: 'melody' as const,
            moveId: 'melody:neutralSpecial',
            loaded: true,
            used: false,
            sustainedKeys: [],
          },
        },
      },
    }
    expect(cast(state, 'kurapika:backSpecial')).toBe(state)
    expect(state.player.equipment).not.toContain('flute')
    expect(state.player.kurapika?.held?.used).toBe(false)
  })

  it('can tick every lifecycle hook regardless of import order', () => {
    expect(() => advanceHatsuFrames(duel('kalluto'))).not.toThrow()
  })
})

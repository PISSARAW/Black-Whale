import { describe, expect, it, vi } from 'vitest'
import { render } from 'svelte/server'
import Guide from '$lib/components/fighting/FightStyleGuide.svelte'
import Hint from '$lib/components/fighting/FightCounterplayHint.svelte'
import { beginFight, createFight, tickFight } from './engine'
import { styleMobility } from './styleMobility'
import { STYLE_MATCHUPS, styleMatchup } from './styleMatchups'
import { FIGHTING_ROSTER } from './roster'
import { FIXED_STEP } from './fightClock'
import { resolveFightImpacts } from './combatImpact'
import { EMPTY_INPUT, type FightInput, type FightState, type FighterId } from './types'

vi.mock('$app/stores', async () => {
  const { readable } = await import('svelte/store')
  return { page: readable({ url: new URL('http://localhost/fr/fighting'), data: {} }) }
})
function fight(id: FighterId = 'hisoka'): FightState {
  const state = beginFight(
    createFight(id, 'kurapika', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return { ...state, player: { ...state.player, x: 44 }, opponent: { ...state.opponent, x: 80 } }
}
function frames(state: FightState, count: number, input: Partial<FightInput> = {}): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(
      state,
      { ...EMPTY_INPUT, ...input },
      { dt: FIXED_STEP, opponentInput: EMPTY_INPUT, ai: false },
    )
  return state
}
function backdash(state: FightState): FightState {
  return frames(frames(frames(state, 1, { left: true }), 1), 1, { left: true })
}

describe('authored body mobility and counterplay for every playable fighter', () => {
  it.each(FIGHTING_ROSTER.map(({ id }) => id))(
    '%s has an explicit bilingual plan, response and finite mobility',
    (id) => {
      expect(STYLE_MATCHUPS[id]).toBeDefined()
      const matchup = styleMatchup(id)
      expect(matchup.plan.every((text) => text.length > 20)).toBe(true)
      expect(matchup.counter.every((text) => text.length > 20)).toBe(true)
      const mobility = styleMobility(fight(id).player)
      expect(mobility.forwardDash.frames).toBeGreaterThan(0)
      expect(mobility.backDash.frames).toBeGreaterThan(0)
      expect(mobility.backWalk).toBeGreaterThan(0)
      expect(mobility.backWalk).toBeLessThan(1)
      expect(Number.isFinite(mobility.walkScale)).toBe(true)
    },
  )
  it('gives a mobile fighter a faster backstep than a committed pressure fighter', () => {
    const mobile = backdash(fight('hisoka'))
    const pressure = backdash(fight('benjamin'))
    expect(mobile.player.motion!.dash!.frames).toBeLessThan(pressure.player.motion!.dash!.frames)
    expect(44 - mobile.player.x).toBeGreaterThan(44 - pressure.player.x)
    expect(mobile.player.wakeupInvulnerableFrames).toBe(0)
    expect(pressure.player.wakeupInvulnerableFrames).toBe(0)
  })
  it('makes natural Biscuit commit more to retreat while preserving her actual body state', () => {
    const small = fight('biscuit')
    const natural = { ...small, player: { ...small.player, biscuitTrueForm: true } }
    expect(styleMobility(natural.player).backWalk).toBeLessThan(
      styleMobility(small.player).backWalk,
    )
    expect(frames(natural, 10, { left: true }).player.x).toBeGreaterThan(
      frames(small, 10, { left: true }).player.x,
    )
    expect(natural.player.health).toBe(small.player.health)
    expect(natural.player.aura).toBe(small.player.aura)
  })
  it('does not copy the other body’s footwork with a borrowed Nen execution identity', () => {
    const state = fight('chrollo')
    const borrowed = {
      ...state,
      player: {
        ...state.player,
        nenOwner: 'hanzo' as const,
        hatsuEffects: { ...state.player.hatsuEffects, stolenHatsu: 'hanzo' as const },
      },
    }
    expect(styleMobility(borrowed.player)).toEqual(styleMobility(state.player))
    expect(backdash(borrowed).player.x).toBe(backdash(state).player.x)
    expect(styleMobility(borrowed.player)).not.toEqual(styleMobility(fight('hanzo').player))
  })
  it('keeps physical movement available in Zetsu and does not gain an aura-free Hatsu', () => {
    const state = fight('hisoka')
    const zetsu = {
      ...state,
      player: { ...state.player, aura: 0, nen: { ...state.player.nen, mode: 'zetsu' as const } },
    }
    expect(styleMobility(zetsu.player)).toEqual(styleMobility(state.player))
    expect(backdash(zetsu).player.x).toBe(backdash(state).player.x)
    expect(backdash(zetsu).player.hatsuEffects.stolenHatsu).toBeNull()
  })
  it('does not attach invulnerability to an ordinary backdash', () => {
    const state = backdash(fight('hisoka'))
    const before = state.player.health
    const result = resolveFightImpacts(state, [
      {
        defenderSide: 'player',
        position: { x: state.player.x, y: 6 },
        projectile: {
          id: 1,
          owner: 'opponent',
          fighterId: 'theta',
          x: state.player.x,
          y: 6,
          velocityX: -76,
          width: 0.5,
          height: 0.2,
          damage: 10,
          hitstun: 12,
          blockstun: 8,
          hitstop: 4,
          knockback: 1,
          targetZone: 'torso',
          shape: 'bullet',
          colour: '#fff',
          age: 1,
          lifetime: 100,
          matter: 'object',
          guard: 'mid',
        },
      },
    ])
    expect(result.impact).toMatchObject({ avoided: false, invulnerable: false })
    expect(result.player.health).toBeLessThan(before)
  })
  it('uses the same body mobility on either controlled side', () => {
    const left = fight('hisoka')
    const right: FightState = {
      ...left,
      player: { ...left.opponent, x: 20 },
      opponent: { ...left.player, x: 56, facing: -1 },
    }
    const movedLeft = frames(left, 10, { right: true })
    let movedRight = right
    for (let i = 0; i < 10; i++)
      movedRight = tickFight(movedRight, EMPTY_INPUT, {
        dt: FIXED_STEP,
        opponentInput: { ...EMPTY_INPUT, left: true },
        ai: false,
      })
    expect(movedLeft.player.x - left.player.x).toBeCloseTo(right.opponent.x - movedRight.opponent.x)
  })
})

describe('the manual explains counterplay without revealing private live state', () => {
  it.each(['fr', 'en'] as const)('renders both the game plan and answer in %s', (language) => {
    for (const { id } of FIGHTING_ROSTER) {
      const body = render(Guide, { props: { fighterId: id, language } }).body
      expect(body).toContain(language === 'fr' ? 'Y répondre' : 'Responding to it')
      expect(body).not.toContain('undefined')
    }
  })
  it('does not turn an unobserved hidden projectile into a public hint', () => {
    const state = fight('kurapika')
    state.projectiles = [
      {
        id: 1,
        owner: 'opponent',
        fighterId: 'franklin',
        x: 60,
        y: 6,
        velocityX: -82,
        width: 0.5,
        height: 0.2,
        damage: 10,
        hitstun: 12,
        blockstun: 8,
        hitstop: 4,
        knockback: 1,
        targetZone: 'torso',
        shape: 'bullet',
        colour: '#fff',
        age: 1,
        lifetime: 100,
        matter: 'nen',
        concealed: true,
      },
    ]
    const hidden = render(Hint, { props: { state, language: 'fr' } }).body
    expect(hidden).toContain('Aucune ouverture repérée')
    expect(hidden).not.toContain('Projectile repéré')
    state.player.nen = { ...state.player.nen, gyo: true }
    const revealed = render(Hint, { props: { state, language: 'fr' } }).body
    expect(revealed).toContain('Projectile repéré')
  })
})

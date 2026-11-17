import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight } from '../engine'
import { applyAuraContext, auraFlowRate } from '../nen'
import { EMPTY_INPUT, type FighterId, type FightState } from '../types'
import { FIGHTING_ROSTER } from '../roster'
import { EN_PROFILES, enProfile, enRadius } from './profiles'
import { activeEnRadius, enContains } from './access'
import { enContactPoints } from './contacts'
import { interruptUnstableEn } from './interruptions'
import { speakPaperWords } from '../kallutoListening'
import { privatePvpState } from '../pvp/view'
import { spectatorSnapshot } from '../pvp/spectator'
import { decodeReplay } from '../clashReplayCodec'
import { perceivesAura, perceivesProjectile, nenReadBonus } from '../nenPerception'
import { fightReplayHash } from '../fightReplayHash'
import { enDescription } from './presentation'
function duel(id: FighterId = 'hinrigh'): FightState {
  const state = beginFight(createFight(id, 'hisoka'))
  return {
    ...state,
    player: { ...state.player, x: 45, aura: 100 },
    opponent: { ...state.opponent, x: 51, aura: 100 },
  }
}
function activate(state: FightState): FightState {
  return { ...state, player: applyAuraContext(state.player, { ...EMPTY_INPUT, en: true }) }
}
const shot = {
  id: 8,
  owner: 'opponent' as const,
  fighterId: 'franklin' as const,
  x: 50,
  y: 2,
  velocityX: -10,
  width: 1,
  height: 1,
  damage: 7,
  hitstun: 10,
  blockstun: 7,
  hitstop: 2,
  knockback: 1,
  targetZone: 'torso' as const,
  shape: 'orb' as const,
  colour: '#ff00aa',
  age: 0,
  lifetime: 120,
  concealed: true,
  matter: 'nen' as const,
}
describe('En evidence for all forty bodies', () => {
  it('keeps a measured minimum distinct from unknown canonical maxima and arcade ranges', () => {
    expect(Object.keys(EN_PROFILES).sort()).toEqual(FIGHTING_ROSTER.map((f) => f.id).sort())
    expect(
      Object.values(EN_PROFILES).filter((p) => p?.observedMinimumMetres !== undefined),
    ).toHaveLength(1)
    expect(EN_PROFILES.hinrigh).toMatchObject({
      evidence: 'observed-minimum',
      observedMinimumMetres: 5,
      chapters: [398],
      radiusUnits: 20,
    })
    expect(EN_PROFILES.phinks).toMatchObject({
      evidence: 'documented-unmeasured',
      chapters: [400],
      unstable: true,
    })
    for (const id of ['kurapika', 'chrollo'] as const)
      expect(EN_PROFILES[id]?.evidence).toBe('catalogue-unmeasured')
  })
  it.each(FIGHTING_ROSTER)(
    '$id gets no En from an affinity, ranking or guessed radius',
    ({ id }) => {
      const state = duel(id),
        hash = fightReplayHash(state),
        next = activate(state)
      expect(next.player.nen.en?.radius ?? null).toBe(EN_PROFILES[id]!.radiusUnits)
      expect(fightReplayHash(state)).toBe(hash)
      for (const language of ['fr', 'en'] as const)
        expect(enDescription(state.player, language).length).toBeGreaterThan(10)
      if (EN_PROFILES[id]!.radiusUnits === null)
        expect(
          enContains(
            { ...state.player, nen: { ...state.player.nen, mode: 'ren', en: { radius: 999 } } },
            state.opponent,
          ),
        ).toBe(false)
    },
  )
  it('retains the real owner’s training through a borrowed execution identity', () => {
    const actor = duel('hisoka').player
    expect(enRadius({ ...actor, id: 'hinrigh', nenOwner: 'hisoka' })).toBeNull()
    expect(enRadius({ ...actor, id: 'hisoka', nenOwner: 'hinrigh' })).toBe(20)
    expect(
      enProfile({ ...actor, id: 'hinrigh', nenOwner: 'chrollo' }).observedMinimumMetres,
    ).toBeUndefined()
  })
  it('bounds stale radii and enforces living voluntary Nen, not a stored flag', () => {
    const actor = activate(duel()).player
    expect(activeEnRadius({ ...actor, nen: { ...actor.nen, en: { radius: 999 } } })).toBe(20)
    for (const radius of [0, -1, NaN, Infinity])
      expect(activeEnRadius({ ...actor, nen: { ...actor.nen, en: { radius } } })).toBe(0)
    expect(activeEnRadius({ ...actor, aura: 0 })).toBe(0)
    expect(activeEnRadius({ ...actor, health: 0 })).toBe(0)
    expect(
      activeEnRadius({ ...actor, hatsuEffects: { ...actor.hatsuEffects, forcedZetsuFrames: 20 } }),
    ).toBe(0)
    expect(
      activeEnRadius({ ...actor, hatsuEffects: { ...actor.hatsuEffects, hatsuStolen: 20 } }),
    ).toBe(20)
    expect(auraFlowRate(actor)).toBe(-13)
    expect(enContains(actor, { x: 65, y: 0 })).toBe(true)
    expect(enContains(actor, { x: 65.001, y: 0 })).toBe(false)
  })
})
describe('contact is distinct from visual aura inspection', () => {
  function concealed() {
    const state = activate(duel())
    return {
      ...state,
      opponent: {
        ...state.opponent,
        nen: { ...state.opponent.nen, mode: 'zetsu' as const, in: true },
      },
      projectiles: [shot],
      bungeeGum: {
        owner: 'opponent' as const,
        target: 'player' as const,
        hidden: true,
        retracting: false,
      },
    }
  }
  it('senses static Zetsu bodies, hidden projectiles and hidden tethers, with no identity or timing bonus', () => {
    const state = concealed(),
      hash = fightReplayHash(state),
      points = enContactPoints(state, 'player')
    expect(points).toHaveLength(3)
    expect(points.every((p) => Object.keys(p).sort().join(',') === 'x,y')).toBe(true)
    expect(perceivesProjectile(state.player, shot)).toBe(false)
    expect(perceivesAura(state.player, state.opponent)).toBe(false)
    expect(nenReadBonus(state.player, state.opponent)).toBe(0)
    const gyo = applyAuraContext(state.player, { ...EMPTY_INPUT, gyo: true })
    expect(perceivesProjectile(gyo, shot)).toBe(true)
    expect(nenReadBonus(gyo, state.opponent)).toBe(2)
    expect(fightReplayHash(state)).toBe(hash)
  })
  it('sends anonymous points to one private seat and no En data to spectators', () => {
    const state = concealed(),
      view = privatePvpState(state, 'player')
    expect(view.projectiles).toHaveLength(0)
    expect(view.bungeeGum).toBeNull()
    expect(view.enReadings).toHaveLength(3)
    expect(enContactPoints(view, 'player')).toEqual(view.enReadings)
    expect(JSON.stringify(view.enReadings)).not.toMatch(/franklin|orb|damage|colour|tether|id/)
    expect(
      (decodeReplay(spectatorSnapshot(state).snapshot) as FightState).enReadings,
    ).toBeUndefined()
    const other = { ...state, player: state.opponent, opponent: state.player }
    expect(privatePvpState(other, 'opponent').enReadings?.length).toBeGreaterThan(0)
  })
  it('rejects out-of-field and invalid cached points, and clears the reading in Zetsu', () => {
    const state = {
      ...activate(duel()),
      pvpSeat: 'player' as const,
      enReadings: [
        { x: 48, y: 0 },
        { x: Infinity, y: 0 },
      ],
    }
    expect(enContactPoints(state, 'player')).toEqual([{ x: 48, y: 0 }])
    expect(
      enContactPoints(
        { ...state, player: { ...state.player, nen: { ...state.player.nen, mode: 'zetsu' } } },
        'player',
      ),
    ).toEqual([])
  })
})
describe('Phinks’s limited concentration', () => {
  it('allows stationary presence but ends on movement, including a contact leaving the field', () => {
    const before = activate(duel('phinks'))
    expect(activeEnRadius(before.player)).toBe(12)
    expect(interruptUnstableEn(before, before).player.nen.en).not.toBeNull()
    for (const x of [52, 80])
      expect(
        interruptUnstableEn(before, { ...before, opponent: { ...before.opponent, x } }).player.nen
          .en,
      ).toBeNull()
    expect(
      interruptUnstableEn(before, { ...before, player: { ...before.player, x: 46 } }).player.nen.en,
    ).toBeNull()
    expect(
      applyAuraContext(before.player, { ...EMPTY_INPUT, en: true, right: true }).nen.en,
    ).toBeNull()
  })
  it('reacts to actual audible speech and movement without granting stun or a new effect', () => {
    const before = activate(duel('phinks')),
      spoken = speakPaperWords(before, 'opponent', 'Bonjour.')
    expect(spoken.player.nen.en).toBeNull()
    expect(spoken.player.hitStun).toBe(0)
    expect(
      speakPaperWords(
        { ...before, opponent: { ...before.opponent, x: 90 } },
        'opponent',
        'Bonjour.',
      ).player.nen.en,
    ).not.toBeNull()
    expect(
      tickFight(
        before,
        { ...EMPTY_INPUT, en: true },
        { dt: 1 / 60, ai: false, opponentInput: { ...EMPTY_INPUT, right: true } },
      ).player.nen.en,
    ).toBeNull()
    const stable = activate(duel())
    expect(
      interruptUnstableEn(stable, { ...stable, opponent: { ...stable.opponent, x: 52 } }).player.nen
        .en,
    ).not.toBeNull()
  })
})

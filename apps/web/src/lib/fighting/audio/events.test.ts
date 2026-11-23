import { describe, expect, it } from 'vitest'
import { transitionNen, type NenTechniqueAction } from '@black-whale/nen-engine'
import { beginFight, createFight, nextRound, performAttack, tickFight } from '../engine'
import { advanceEmperorClock, toggleEmperorTime } from '../kurapikaActions'
import { FIGHTING_ROSTER } from '../roster'
import { FIGHT_STAGES } from '../stages'
import { EMPTY_INPUT, type ArcadeFighter, type FightState, type FightNenZone } from '../types'
import { fightSoundEvents } from './events'
import { HATSU_RECIPES } from './hatsu'
import { FIGHTER_SOUNDS } from './profiles'
import { combatPressure, STAGE_SOUNDS } from './stages'

const fighting = () => beginFight(createFight('kurapika', 'hisoka'))
const kinds = (before: FightState, after: FightState) =>
  fightSoundEvents(before, after).map((event) => event.kind)

describe('combat sound coverage', () => {
  it('carries the authored move id into an impact cue', () => {
    const before = fighting()
    const impact = {
      kind: 'heavy' as const,
      blocked: false,
      critical: false,
      knockdown: false,
      wallSplat: false,
      parried: false,
      avoided: false,
      invulnerable: false,
      counterHit: false,
      punish: false,
      antiAir: false,
      damage: 12,
      comboHits: 1,
      damageScale: 1,
      points: 0,
      concealed: false,
      projectileId: null,
      sequence: 1,
      attacker: 'player' as const,
      position: { x: 50, y: 50 },
      zone: 'torso' as const,
    }
    const after = {
      ...before,
      impact,
      player: {
        ...before.player,
        attack: {
          kind: 'heavy' as const,
          variant: 'standing' as const,
          moveId: 'kurapika:standingHeavy',
          frame: 8,
          impacted: true,
          auraCharged: false,
          concealed: false,
          hatsuSource: null,
          projectileSpawned: false,
          reversal: false,
        },
      },
    }
    expect(fightSoundEvents(before, after)).toContainEqual(
      expect.objectContaining({ kind: 'impact', moveId: 'kurapika:standingHeavy' }),
    )
  })

  it('gives every playable fighter an authored identity and an existing sound recipe', () => {
    const profiles = FIGHTING_ROSTER.map(({ id }) => FIGHTER_SOUNDS[id])
    expect(
      profiles.every((profile) => profile && typeof HATSU_RECIPES[profile.hatsu] === 'function'),
    ).toBe(true)
    expect(new Set(profiles.map((profile) => profile.identity)).size).toBe(profiles.length)
    expect(
      new Set(profiles.map((profile) => `${profile.material}:${profile.root}:${profile.motif}`))
        .size,
    ).toBe(profiles.length)
  })

  it('covers every stage with its own ambience, floor and acoustic response', () => {
    const profiles = FIGHT_STAGES.map(({ id }) => STAGE_SOUNDS[id])
    expect(profiles.every((profile) => profile.room > 0 && profile.motif.length > 0)).toBe(true)
    expect(new Set(profiles.map((profile) => profile.identity)).size).toBe(FIGHT_STAGES.length)
    expect(STAGE_SOUNDS['whale-hold'].room).toBeGreaterThan(STAGE_SOUNDS['observation-deck'].room)
  })

  it.each<NenTechniqueAction<FightNenZone>>([
    { type: 'REN' },
    { type: 'KEN', on: true },
    { type: 'GYO', on: true },
    { type: 'IN', on: true },
    { type: 'KO', zone: 'hands' },
    { type: 'ON', on: true, distribution: { hands: 40, feet: 30, torso: 20, head: 10 } },
    { type: 'EN', radius: 10 },
    { type: 'SHU', objectId: 'chain', on: true },
    { type: 'RYU', distribution: { hands: 70, torso: 10, head: 10, feet: 10 } },
    { type: 'ZETSU' },
  ])('hears $type even when the basic Nen mode stays the same', (action) => {
    const before = action.type === 'EN' ? beginFight(createFight('hinrigh', 'hisoka')) : fighting()
    if (action.type === 'EN') before.player.nen.mode = 'ren'
    const result = transitionNen(before.player.nen, action)
    const after = { ...before, player: { ...before.player, nen: result.state } }
    expect(fightSoundEvents(before, after).filter((event) => event.kind === 'nen')).toHaveLength(1)
    expect(fightSoundEvents(after, after)).toEqual([])
  })

  it('does not announce En from a stale flag on an unqualified body', () => {
    const before = fighting()
    const after = {
      ...before,
      player: { ...before.player, nen: { ...before.player.nen, en: { radius: 22 } } },
    }
    expect(fightSoundEvents(before, after).filter((event) => event.kind === 'nen')).toHaveLength(0)
  })

  it('plays an attack swish on its active frame, including a miss, once through hitstop', () => {
    const idle = fighting()
    let state = performAttack(idle, 'player', 'light')
    const events = fightSoundEvents(idle, state)
    for (let frame = 0; frame < 35; frame++) {
      const next = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
      events.push(...fightSoundEvents(state, next))
      state = next
    }
    expect(
      events.filter((event) => event.side === 'player' && event.kind === 'windup'),
    ).toHaveLength(1)
    expect(
      events.filter((event) => event.side === 'player' && event.kind === 'swing'),
    ).toHaveLength(1)
    expect(events.filter((event) => event.kind === 'impact')).toHaveLength(0)
    expect(fightSoundEvents(state, { ...state, hitstop: 4 })).toEqual([])
  })

  it('gives Emperor Time one activation and a heartbeat for every spent second, including hitstop', () => {
    const before = fighting()
    let state = toggleEmperorTime(before, 'player')
    expect(kinds(before, state)).toContain('emperor-on')
    const events = []
    for (let frame = 0; frame < 120; frame++) {
      const after = advanceEmperorClock({ ...state, hitstop: 4 })
      events.push(...fightSoundEvents(state, after))
      state = after
    }
    expect(events.filter((event) => event.kind === 'heartbeat')).toHaveLength(2)
    expect(events.filter((event) => event.kind === 'emperor-on')).toHaveLength(0)
    expect(kinds(state, toggleEmperorTime(state, 'player'))).toContain('emperor-off')
  })

  it('ticks throughout a timed round, tightens at the deadline and never ticks in training', () => {
    const before = { ...fighting(), remainingFrames: 3601, time: 3601 / 60 }
    const after = { ...before, remainingFrames: 3600, time: 60 }
    expect(kinds(before, after)).toContain('clock')
    const late = { ...before, remainingFrames: 241, time: 241 / 60 }
    const next = { ...late, remainingFrames: 240, time: 4 }
    expect(kinds(late, next)).toContain('clock')
    expect(kinds({ ...late, mode: 'training' }, { ...next, mode: 'training' })).not.toContain(
      'clock',
    )
    expect(kinds(after, after)).not.toContain('clock')
  })

  it('rings at timeout once and resets deduplication for a rematch or a new round', () => {
    const before = fighting()
    const finished: FightState = {
      ...before,
      phase: 'finished',
      finishReason: 'time',
      winner: 'player',
    }
    expect(fightSoundEvents(before, finished)).toContainEqual(
      expect.objectContaining({ kind: 'finish', value: 1 }),
    )
    expect(fightSoundEvents(finished, finished)).toEqual([])
    expect(kinds(finished, beginFight(nextRound(finished)))).toEqual(['intro', 'start'])
  })

  it('does not repeat footsteps on every rendered frame or on each frame around an appui', () => {
    const before = fighting()
    const walk = (frame: number): FightState => ({
      ...before,
      frame,
      player: { ...before.player, pose: 'walk', x: 22 + frame / 10 },
    })
    const events = []
    for (let frame = 1; frame <= 60; frame++)
      events.push(...fightSoundEvents(walk(frame - 1), walk(frame)))
    expect(events.filter((event) => event.kind === 'step')).toHaveLength(3)
    expect(fightSoundEvents(walk(36), walk(36))).toEqual([])
  })

  it('announces utility transformations and actual armour/sun transitions without an impact', () => {
    const before = fighting()
    const player: ArcadeFighter = {
      ...before.player,
      biscuitTrueForm: true,
      hatsuEffects: {
        ...before.player.hatsuEffects,
        painPacker: { injuries: 20, packedDamage: 20, armour: true, sun: null },
      },
    }
    const after = { ...before, player }
    expect(kinds(before, after)).toEqual(expect.arrayContaining(['transform', 'armour']))
    expect(fightSoundEvents(after, after)).toEqual([])
  })

  it('raises pressure with time, damage, combos, points and the approaching verdict', () => {
    const state = fighting()
    const baseline = combatPressure(state)
    expect(combatPressure({ ...state, frame: 4000 })).toBeGreaterThan(baseline)
    expect(combatPressure({ ...state, player: { ...state.player, health: 15 } })).toBeGreaterThan(
      baseline,
    )
    expect(
      combatPressure({ ...state, formatId: 'heavens-arena', score: { player: 9, opponent: 8 } }),
    ).toBeGreaterThan(baseline)
    expect(combatPressure({ ...state, time: 4 })).toBeGreaterThan(baseline)
    expect(combatPressure({ ...state, phase: 'finished' })).toBe(0)
    expect(
      combatPressure({
        ...state,
        time: 0,
        frame: 100000,
        player: { ...state.player, health: 0, comboHits: 100 },
      }),
    ).toBeLessThanOrEqual(1)
  })
})

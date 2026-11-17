import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performAttack, tickFight } from '../engine'
import {
  applyAuraContext,
  auraFlowRate,
  nenAttackFactor,
  nenDamageFactor,
  nenTacticalState,
} from '../nen'
import { EMPTY_INPUT, type FightState } from '../types'
import { bodyGyoZone } from './bodyGyo'
import { gyoSight } from './sight'
import { readAura } from './reading'
import { readableImpact } from './impactRead'
import { enContactReadings } from '../en/contacts'
import { interruptUnstableEn } from '../en/interruptions'
import { privatePvpState } from '../pvp/view'
import { fightReplayHash } from '../fightReplayHash'
import { createGyoReadingScene } from './gyoScene'
import { speakPaperWords } from '../kallutoListening'
import { projectHanzo } from '../hanzoProjection'
function duel(player: 'hinrigh' | 'kurapika' | 'phinks' = 'hinrigh'): FightState {
  const s = beginFight(
    createFight(player, 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...s,
    player: { ...s.player, x: 40, aura: 100 },
    opponent: { ...s.opponent, x: 47, aura: 100 },
  }
}
const apply = (f: FightState['player'], input: Partial<typeof EMPTY_INPUT>) =>
  applyAuraContext(f, { ...EMPTY_INPUT, ...input })
describe('Gyo is a tactical choice between observation and focused force', () => {
  it.each(['head', 'torso', 'hands', 'feet'] as const)(
    'focuses %s without keeping ocular In detection',
    (zone) => {
      const f = duel('kurapika').player,
        key = { head: 'focusHead', torso: 'focusTorso', hands: 'focusHands', feet: 'focusFeet' }[
          zone
        ]
      const next = apply(f, { gyo: true, [key]: true })
      expect(bodyGyoZone(next)).toBe(zone)
      expect(gyoSight(next)).toBe(false)
      expect(next.nen.ryu[zone]).toBe(0.7)
      expect(auraFlowRate(next)).toBeCloseTo(-6.4)
      expect(nenTacticalState(next)).toMatchObject({ technique: 'gyo', focusZone: zone })
      expect(nenDamageFactor(next, zone)).toBeLessThan(
        nenDamageFactor(next, zone === 'torso' ? 'head' : 'torso'),
      )
      expect(bodyGyoZone(apply(next, {}))).toBeNull()
      expect(gyoSight(apply(next, { gyo: true }))).toBe(true)
    },
  )
  it('changes an actual hand strike and leaves other body parts exposed', () => {
    const state = duel('kurapika'),
      hand = apply(state.player, { gyo: true, focusHands: true })
    expect(nenAttackFactor(hand, 'light')).toBeGreaterThan(nenAttackFactor(state.player, 'light'))
    expect(nenDamageFactor(hand, 'torso')).toBeGreaterThan(nenDamageFactor(state.player, 'torso'))
    let next = performAttack({ ...state, player: hand }, 'player', 'light')
    for (let i = 0; i < 15 && !next.impact; i++)
      next = tickFight(
        next,
        { ...EMPTY_INPUT, gyo: true, focusHands: true },
        { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT },
      )
    expect(next.impact).toMatchObject({ attacker: 'player', kind: 'light', blocked: false })
    expect(next.opponent.health).toBeLessThan(state.opponent.health)
  })
  it('does not retain an aura focus through forced Zetsu, On, depletion or Ko', () => {
    const focus = apply(duel().player, { gyo: true, focusHands: true })
    for (const blocked of [
      { ...focus, aura: 0 },
      { ...focus, nen: { ...focus.nen, on: true } },
      { ...focus, nen: { ...focus.nen, ko: 'hands' as const } },
      { ...focus, hatsuEffects: { ...focus.hatsuEffects, forcedZetsuFrames: 60 } },
    ])
      expect(bodyGyoZone(blocked)).toBeNull()
  })
  it('reads present distribution under In without predicting a move or exposing private conditions', () => {
    const state = duel(),
      observer = apply(state.player, { gyo: true }),
      target = apply(state.opponent, { focusHead: true, conceal: true })
    const before = fightReplayHash({ ...state, opponent: target })
    expect(readAura(state.player, target)).toBeNull()
    const reading = readAura(observer, target)!
    expect(reading.strong).toEqual(['head'])
    expect(reading.weak).toEqual(['torso', 'hands', 'feet'])
    expect(reading.shares?.head).toBe(0.76)
    expect(JSON.stringify(reading)).not.toMatch(/hisoka|bungee|conditions|moveId|buffer|affinity/)
    expect(fightReplayHash({ ...state, opponent: target })).toBe(before)
    expect(readAura({ ...observer, parallelEyesClosed: true }, target)).toBeNull()
    expect(readAura(observer, apply(target, { aura: true, down: true }))?.shares).toBeNull()
  })
})
describe('En, In and actual defense counterplay', () => {
  it('reports body contours and present motion while In conceals aura reactions and pure aura traps', () => {
    const state = duel()
    state.player = apply(state.player, { en: true })
    state.previousPositions = { player: { x: 40, y: 0 }, opponent: { x: 46, y: 0 } }
    let points = enContactReadings(state, 'player')
    expect(points[0].width).toBeCloseTo(4.1)
    expect(points[0]).toMatchObject({
      x: 47,
      y: 0,
      height: 11,
      dx: 1,
      auraReaction: true,
    })
    state.opponent = apply(state.opponent, { conceal: true })
    state.bungeeGum = { owner: 'opponent', target: 'player', hidden: true, retracting: false }
    points = enContactReadings(state, 'player')
    expect(points).toHaveLength(1)
    expect(points[0].auraReaction).toBe(false)
    expect(privatePvpState(state, 'player').enReadings).toEqual(points)
    state.player = apply(state.player, { en: true, gyo: true })
    expect(enContactReadings(state, 'player')).toHaveLength(2)
  })
  it('only reports an intersecting point when the full contour lies outside the field', () => {
    const state = duel()
    state.player = apply(state.player, { en: true })
    state.opponent.x = 60.5
    const reading = enContactReadings(state, 'player')[0]
    expect(reading).toMatchObject({ width: 0, height: 0 })
    expect(reading.x).toBeLessThanOrEqual(60)
    expect(Object.keys(reading).sort()).toEqual(
      ['auraReaction', 'dx', 'dy', 'height', 'width', 'x', 'y'].sort(),
    )
  })
  it('does not mistake a moving Hanzo double for movement of his resting physical body', () => {
    const state = beginFight(createFight('hinrigh', 'hanzo', { mode: 'versus-local' }))
    state.player = apply({ ...state.player, x: 40 }, { en: true })
    state.opponent = projectHanzo({ ...state.opponent, x: 47 })
    state.opponent.x = 53
    state.previousPositions = { player: { x: 40, y: 0 }, opponent: { x: 52, y: 0 } }
    const readings = enContactReadings(state, 'player')
    expect(readings.find((reading) => reading.x === 47)).toMatchObject({ dx: 0, dy: 0 })
    expect(readings.find((reading) => reading.x === 53)).toMatchObject({ dx: 1, dy: 0 })
  })
  it('allows a blind manual parry of an accessible contact but gives no universal counter to In', () => {
    const state = duel(),
      blind = { ...state.player, hatsuEffects: { ...state.player.hatsuEffects, senseSeals: 1 } }
    const read = { guard: 'mid' as const, concealed: false, position: state.opponent }
    expect(readableImpact(blind, read)).toBe(false)
    expect(readableImpact(apply(blind, { en: true }), read)).toBe(true)
    expect(readableImpact(apply(blind, { en: true }), { ...read, concealed: true })).toBe(false)
    expect(readableImpact(apply(state.player, { gyo: true }), { ...read, concealed: true })).toBe(
      true,
    )
  })
  it('maintains Hinrigh’s field during a physical attack, but respects Phinks’s concentration and actual speech', () => {
    const s = duel()
    s.player = apply(s.player, { en: true })
    expect(enContactReadings(performAttack(s, 'player', 'light'), 'player').length).toBeGreaterThan(
      0,
    )
    const p = duel('phinks')
    p.player = apply(p.player, { en: true })
    expect(performAttack(p, 'player', 'light').player.nen.en).toBeNull()
    expect(speakPaperWords(p, 'opponent', 'Attention.').player.nen.en).toBeNull()
    expect(
      interruptUnstableEn(p, { ...p, opponent: { ...p.opponent, crouching: true } }).player.nen.en,
    ).toBeNull()
  })
  it('redacts In-hidden bodily focus in private PvP until ocular Gyo is available', () => {
    const state = duel()
    state.opponent = apply(state.opponent, { gyo: true, focusHands: true, conceal: true })
    expect(privatePvpState(state, 'player').opponent.gyoFocus).toBeUndefined()
    state.player = apply(state.player, { gyo: true })
    expect(privatePvpState(state, 'player').opponent.gyoFocus).toBe('hands')
  })
})
describe('in-world Gyo aura reading', () => {
  it('draws only current inspected zones and releases all geometry when disposed', () => {
    const state = duel(),
      scene = new THREE.Scene()
    state.opponent = apply(state.opponent, { focusHead: true, conceal: true })
    const layer = createGyoReadingScene({ THREE, scene, worldX: (x) => x, worldY: (y) => y })
    layer.sync(state)
    expect(scene.children).toHaveLength(0)
    state.player = apply(state.player, { gyo: true })
    layer.sync(state)
    expect(scene.children).toHaveLength(4)
    expect(scene.children.every((mesh) => mesh.visible)).toBe(true)
    state.player = apply(state.player, { gyo: true, focusHands: true })
    layer.sync(state)
    expect(scene.children.every((mesh) => !mesh.visible)).toBe(true)
    layer.dispose()
    expect(scene.children).toHaveLength(0)
  })
})

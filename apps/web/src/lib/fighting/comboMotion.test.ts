import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performMove, tickFight } from './engine'
import { attackData } from './frameData'
import { bodyPlan, fightBodyMotion } from './fightBodyMotion'
import { buildFightFigure } from './fighterFigure'
import { duelBridge, flowThroughBridge } from './duelAttackBridges'
import { createFightReactionPresentation } from './fightReactionPresentation'
import { franklinBarrageMotion } from './franklinBarrageMotion'
import { EMPTY_INPUT, type FighterId, type FightState } from './types'

const glow = (color: number) => new THREE.MeshBasicMaterial({ color })
function duel(id: FighterId) {
  const state = beginFight(
    createFight(id, 'chrollo', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, x: 44, aura: 100 },
    opponent: { ...state.opponent, x: 50 },
  }
}
function step(state: FightState) {
  return tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
}

describe('authored combo motion', () => {
  it.each([1, -1] as const)(
    'carries Blinky in the actual right hand and freezes its arc facing %s',
    (facing) => {
      let state = duel('shizuku')
      state.player.facing = facing
      state = performMove({ state, side: 'player', action: 'heavy' })
      const model = buildFightFigure({ THREE, glow, fighter: state.player })
      new THREE.Group().add(model.root)
      const tool = model.root.getObjectByName('shizuku-blinky')!
      expect(tool.parent?.name).toBe('hand-right')
      const draw = (frame: number, seconds: number) => {
        const fighter = { ...state.player, attack: { ...state.player.attack!, frame } }
        model.animate(seconds, 'idle', {
          transitionSeconds: 0,
          motion: fightBodyMotion({ fighter, seconds, progress: 0 }),
        })
        model.root.updateWorldMatrix(true, true)
        return tool.getWorldQuaternion(new THREE.Quaternion())
      }
      const frames = attackData('heavy', state.player)
      const load = draw(Math.floor(frames.startup * 0.65), 1)
      const contact = draw(frames.startup, 2)
      expect(load.angleTo(contact)).toBeGreaterThan(0.6)
      expect(contact.angleTo(draw(frames.startup, 3))).toBeLessThan(1e-6)
      const forward = bodyPlan(state.player, { seconds: 1, progress: 0 })!
      expect(forward.attackFlow).toBeDefined()
    },
  )

  it('keeps the incoming contact fixed while Kurapika gathers his chain hand between strikes', () => {
    const from = { leadElbow: [1.1, 0, 0] as const }
    const contact = { leadElbow: [1.2, 0, 0] as const }
    for (const before of ['forwardLight', 'standingHeavy']) {
      const after = before === 'forwardLight' ? 'standingHeavy' : 'forwardSpecial'
      const load = duelBridge(`kurapika:${before}`, `kurapika:${after}`, 1)!
      const pose = (progress: number) => flowThroughBridge({ from, contact, load, progress })
      expect(pose(0).leadElbow).toEqual(from.leadElbow)
      expect(pose(0.5).leadElbow![0]).toBeLessThan(0.6)
      expect(pose(1).leadElbow).toEqual(contact.leadElbow)
    }
  })

  it('retains the actual hammer contact across a cancel, then clears it when replay rewinds', () => {
    const read = createFightReactionPresentation()
    let state = performMove({ state: duel('shizuku'), side: 'player', action: 'heavy' })
    const initial = structuredClone(state)
    for (let i = 0; i < 40 && !state.impact; i++) {
      state = step(state)
      read(state, 'opponent', { fighter: state.opponent, seconds: state.frame / 60 })
    }
    expect(state.impact?.blocked).toBe(false)
    const hit = read(state, 'opponent', { fighter: state.opponent, seconds: state.frame / 60 })
    expect(hit.strikeReaction).toBe('blinky-hammer')
    const next = { ...state, player: { ...state.player, attack: null } }
    expect(read(next, 'opponent', { fighter: next.opponent, seconds: 4 }).strikeReaction).toBe(
      'blinky-hammer',
    )
    expect(read(next, 'opponent', { fighter: next.opponent, seconds: 5 }).progress).toBe(
      hit.progress,
    )
    expect(
      read(initial, 'opponent', { fighter: initial.opponent, seconds: 0 }).strikeReaction,
    ).toBeUndefined()
  })

  it('moves Franklin’s shoulders only for emitted bullets, alternates hands and stops after interruption', () => {
    let state = duel('franklin')
    state.opponent.x = 85
    state = performMove({ state, side: 'player', action: 'special' })
    let count = 0
    const arms: string[] = []
    for (let i = 0; i < 95; i++) {
      state = step(state)
      if (!state.player.attack) break
      const frames = attackData(state.player.attack.kind, state.player)
      const options = { fighter: state.player, frames, authored: true }
      const motion = franklinBarrageMotion(options)!
      const emitted = state.player.attack.projectilesSpawned ?? 0
      if (!emitted) expect(motion).toEqual({})
      if (emitted > count) {
        arms.push(motion.leadElbow ? 'lead' : 'rear')
        expect(franklinBarrageMotion(options)).toEqual(motion)
        count = emitted
      }
    }
    expect(count).toBe(20)
    expect(arms.slice(0, 4)).toEqual(['lead', 'rear', 'lead', 'rear'])
    const fighter = { ...state.player, attack: null }
    expect(
      franklinBarrageMotion({ fighter, frames: attackData('special', fighter), authored: true }),
    ).toBeNull()
  })
})

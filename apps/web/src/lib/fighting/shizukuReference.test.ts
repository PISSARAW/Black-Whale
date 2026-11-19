import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { moveForSlot } from './movesets'
import { attackData } from './frameData'
import { blinkyStrikeArc } from './shizukuStrikeMotion'
import { shizukuCombatSlots } from './shizukuCombatAi'
import { moveShizukuOpponent } from './shizukuFootwork'
import { supportBlinkyGrip } from './shizukuGrip'
import { blinkyBloodReady } from './blinky'
import { buildFightFigure } from './fighterFigure'
import { fightBodyMotion } from './fightBodyMotion'
import { EMPTY_INPUT, type FightProjectile, type FightState, type MoveSlot } from './types'

const STRIKES: MoveSlot[] = [
  'standingLight',
  'standingHeavy',
  'lowLight',
  'lowHeavy',
  'airLight',
  'airHeavy',
  'forwardLight',
  'forwardHeavy',
  'backHeavy',
  'forwardSpecial',
]
function ready(): FightState {
  const s = beginFight(createFight('hisoka', 'shizuku', { mode: 'versus-local' }))
  return { ...s, player: { ...s.player, x: 40 }, opponent: { ...s.opponent, x: 54, aura: 100 } }
}
function cast(s: FightState, slot: MoveSlot) {
  const m = moveForSlot('shizuku', slot)!
  return performAuraAttack({
    state: s,
    side: 'opponent',
    kind: m.kind,
    moveId: m.id,
    auraCharged: false,
  })
}
function step(s: FightState, frames: number): FightState {
  for (let i = 0; i < frames; i++)
    s = tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return s
}
function bullet(): FightProjectile {
  return {
    id: 100,
    owner: 'player',
    fighterId: 'theta',
    x: 47,
    y: 6.1,
    velocityX: 50,
    shape: 'bullet',
    matter: 'object',
    colour: '#aaaaaa',
    width: 0.1,
    height: 0.1,
    damage: 10,
    hitstun: 10,
    blockstun: 5,
    hitstop: 3,
    knockback: 1,
    targetZone: 'torso',
    concealed: false,
    age: 0,
    lifetime: 120,
  }
}

describe('Shizuku · Pike reference', () => {
  it.each(STRIKES)('%s carries Blinky through a keyed arc on the actual active frames', (slot) => {
    const s = cast(ready(), slot)
    const actor = s.opponent
    expect(actor.attack).not.toBeNull()
    const data = attackData(actor.attack!.kind, actor)
    actor.attack!.frame = data.startup * 0.65
    const load = blinkyStrikeArc(actor)
    actor.attack!.frame = data.startup
    const contact = blinkyStrikeArc(actor)
    actor.attack!.frame = data.startup + data.active - 1
    expect(blinkyStrikeArc(actor)).toEqual(contact)
    expect(load).not.toEqual(contact)
    expect(contact!.every(Number.isFinite)).toBe(true)
  })
  it('opens a real wound before blood suction and stops drawing blood when wounds are covered', () => {
    let s = ready()
    s.opponent.x = 45
    s = step(cast(s, 'standingLight'), 45)
    expect(s.player.openWounds).toBeGreaterThan(0)
    s.opponent.x = 54
    expect(blinkyBloodReady(s, 'opponent')).toBe(true)
    expect(shizukuCombatSlots({ state: s, gap: 14, roll: 0.5 })[0]).toBe('finisher')
    const health = s.player.health
    s = step(cast(s, 'finisher'), 40)
    expect(s.player.health).toBeLessThan(health)
    s.player.pluggingWounds = true
    expect(blinkyBloodReady(s, 'opponent')).toBe(false)
    expect(shizukuCombatSlots({ state: s, gap: 14, roll: 0.5 })).not.toContain('finisher')
  })
  it('uses short checks close up, keeps distance after a wound and never moves through hitstun', () => {
    const s = ready()
    expect(shizukuCombatSlots({ state: s, gap: 5, roll: 0.1 })[0]).toBe('standingLight')
    expect(moveShizukuOpponent(s.opponent, s.player)).toBeNull()
    s.player.openWounds = 1
    const close = { ...s.opponent, x: 48 }
    expect(moveShizukuOpponent(close, s.player)!.x).toBeGreaterThan(close.x)
    expect(moveShizukuOpponent(s.opponent, s.player)!.x).toBe(s.opponent.x)
    expect(moveShizukuOpponent({ ...close, hitStun: 5 }, s.player)).toBeNull()
    expect(
      moveShizukuOpponent({ ...close, nen: { ...close.nen, mode: 'zetsu' } }, s.player),
    ).toBeNull()
    s.player.pluggingWounds = true
    expect(moveShizukuOpponent(close, s.player)).toBeNull()
  })
  it('sucks only an existing eligible projectile and does not waste a command on an empty lane', () => {
    const s = ready()
    const plan = () => shizukuCombatSlots({ state: s, gap: 14, roll: 0.2 })
    expect(plan()).not.toContain('neutralSpecial')
    for (const patch of [
      { matter: 'nen' },
      { living: true },
      { shape: 'card' },
      { x: 70 },
    ] as Partial<FightProjectile>[]) {
      s.projectiles = [{ ...bullet(), ...patch }]
      expect(plan()).not.toContain('neutralSpecial')
    }
    s.projectiles = [bullet()]
    expect(plan()[0]).toBe('neutralSpecial')
    s.opponent.blinky = { target: 'bullet', lastWasBlood: true }
    s.projectiles = []
    expect(plan()).not.toContain('backSpecial')
  })
  it.each([1, -1] as const)(
    'supports Blinky with the anatomical left hand when facing %s',
    (facing) => {
      const s = cast(ready(), 'standingLight')
      const actor = { ...s.opponent, facing }
      actor.attack!.frame = attackData('light', actor).startup
      const model = buildFightFigure({
        THREE,
        fighter: actor,
        glow: (color) => new THREE.MeshBasicMaterial({ color }),
      })
      model.animate(1, 'idle', {
        transitionSeconds: 0,
        motion: fightBodyMotion({ fighter: actor, seconds: 1, progress: 0.5 }),
      })
      const tool = model.root.getObjectByName('shizuku-blinky')!
      expect(tool.parent!.name).toBe('hand-right')
      const hand = model.root.getObjectByName('hand-left')!
      const shoulder = model.root.getObjectByName('shoulder-left')!
      shoulder.rotation.set(0, 0, 0)
      const support = tool.localToWorld(new THREE.Vector3(-0.08, 0.25, 0))
      const before = hand.getWorldPosition(new THREE.Vector3()).distanceTo(support)
      const mouth = tool.getObjectByName('open-mouth')!.getWorldPosition(new THREE.Vector3())
      supportBlinkyGrip(model.turns, tool, actor)
      const after = hand.getWorldPosition(new THREE.Vector3()).distanceTo(support)
      expect(after).toBeLessThan(before)
      expect(
        tool.getObjectByName('open-mouth')!.getWorldPosition(new THREE.Vector3()).distanceTo(mouth),
      ).toBeLessThan(1e-8)
    },
  )
})

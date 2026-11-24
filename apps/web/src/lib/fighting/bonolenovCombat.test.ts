import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performAuraAttack, performMove, tickFight } from './engine'
import { emptyBattleCantabile, BATTLE_MOVES } from './battleCantabileTypes'
import { bonolenovDancePlan } from './bonolenovPoses'
import { bodyPlan, fightBodyMotion } from './fightBodyMotion'
import { buildFightFigure } from './fighterFigure'
import { attackData } from './frameData'
import { moveBonolenovOpponent } from './bonolenovAi'
import { styleReactionFrames } from './styleMobility'
import { battleMusicEvents } from './audio/battleCantabile'
import { EMPTY_INPUT, type ArcadeFighter, type FightState } from './types'

const glow = (color: number, opacity = 1) => new THREE.MeshBasicMaterial({ color, opacity })
function duel(): FightState {
  const state = beginFight(
    createFight('bonolenov', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, x: 25, aura: 100 },
    opponent: { ...state.opponent, x: 65 },
  }
}
function command(state: FightState, moveId = BATTLE_MOVES.prologue as string): FightState {
  return performAuraAttack({ state, side: 'player', kind: 'special', moveId, auraCharged: false })
}
function frames(state: FightState, count: number): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function draw(fighter: ArcadeFighter, seconds = 1) {
  const model = buildFightFigure({ THREE, glow, fighter })
  model.animate(seconds, 'idle', {
    transitionSeconds: 0,
    motion: fightBodyMotion({ fighter, seconds, progress: 0 }),
  })
  model.root.updateWorldMatrix(true, true)
  return model
}
const position = (node: THREE.Object3D) => node.getWorldPosition(new THREE.Vector3())

describe('Bonolenov reference combat', () => {
  it('starts the same dance on every activation and freezes it when simulation counters freeze', () => {
    const state = frames(command(duel()), 15)
    const a = bodyPlan(state.player, { seconds: 0, progress: 0 })
    const b = bodyPlan(state.player, { seconds: 1000, progress: 0 })
    expect(a).toEqual(b)
    expect(a?.pose.body?.[1]).toBeCloseTo(Math.PI)
    expect(bonolenovDancePlan(command(duel()).player)).toEqual(
      bonolenovDancePlan(command({ ...duel(), frame: 2000 }).player),
    )
  })

  it.each([1, -1] as const)(
    'alternates a raised lead and rear knee above a planted support (facing %s)',
    (facing) => {
      const heights = [15, 45].map((elapsed) => {
        const state = frames(command(duel()), elapsed)
        const model = draw({ ...state.player, facing })
        return ['knee-left', 'knee-right'].map(
          (name) => position(model.root.getObjectByName(name)!.children[1]).y,
        )
      })
      expect(Math.abs(heights[0][0] - heights[0][1])).toBeGreaterThan(0.08)
      expect((heights[0][0] - heights[0][1]) * (heights[1][0] - heights[1][1])).toBeLessThan(0)
      expect(Math.min(...heights[0])).toBeCloseTo(Math.min(...heights[1]), 2)
    },
  )

  it('finishes the dance into a spear-ready posture and stops the idle musical loop', () => {
    const state = frames(command(duel()), 60)
    expect(bonolenovDancePlan(state.player)).toBeNull()
    expect(bodyPlan(state.player, { seconds: 1, progress: 0 })?.key).toBe(
      'bonolenov:prologue-ready',
    )
    expect(bodyPlan(state.player, { seconds: 1, progress: 0 })?.pose).toEqual(
      bodyPlan(state.player, { seconds: 100, progress: 0 })?.pose,
    )
    expect(battleMusicEvents({ ...state, frame: 14 }, { ...state, frame: 15 }, 'player')).toEqual(
      [],
    )
    const preparing = command(duel())
    expect(
      battleMusicEvents({ ...preparing, frame: 14 }, { ...preparing, frame: 15 }, 'player'),
    ).toHaveLength(0) // The continuous body instrument owns preparation now.
  })

  it.each([1, -1] as const)(
    'thrusts the physical right-hand spear downrange and holds it through active frames (facing %s)',
    (facing) => {
      const armed = frames(command(duel()), 60)
      const striking = command(armed, BATTLE_MOVES.spear).player
      const timing = attackData('special', striking)
      for (const offset of [0, Math.max(0, timing.active - 1)]) {
        const fighter = {
          ...striking,
          facing,
          attack: { ...striking.attack!, frame: timing.startup + offset },
        }
        const model = draw(fighter)
        const spear = model.root.getObjectByName('bonolenov-prologue-spear')!
        expect(spear.parent?.name).toBe('hand-right')
        const tip = spear.localToWorld(new THREE.Vector3(0, 1.59, 0))
        const axis = tip.sub(position(spear)).normalize()
        const forward = new THREE.Vector3(0, 0, 1).transformDirection(model.root.matrixWorld)
        expect(axis.dot(forward)).toBeGreaterThan(0.8)
        const hand = position(model.root.getObjectByName('hand-right')!)
        const shoulder = position(model.root.getObjectByName('shoulder-right')!)
        expect(hand.clone().sub(shoulder).dot(forward)).toBeGreaterThan(0.3)
      }
    },
  )

  it.each([1, -1] as const)('actually wields Prologue’s spear on J and K facing %s', (facing) => {
    const unarmed = duel()
    const armed = frames(command(unarmed), 60)
    const signatures: THREE.Vector3[] = []
    for (const action of ['light', 'heavy'] as const) {
      const armedAttack = performMove({ state: armed, side: 'player', action }).player
      const unarmedAttack = performMove({ state: unarmed, side: 'player', action }).player
      const data = attackData(action, armedAttack)
      expect(data.box.right).toBeGreaterThan(attackData(action, unarmedAttack).box.right + 2)
      expect(armedAttack.attack?.auraCharged).toBe(false)
      expect(armedAttack.attack?.hatsuSource).toBeNull()
      const fighter = {
        ...armedAttack,
        facing,
        attack: { ...armedAttack.attack!, frame: data.startup },
      }
      const model = draw(fighter)
      const spear = model.root.getObjectByName('bonolenov-prologue-spear')!
      expect(spear.parent?.name).toBe('hand-right')
      const forward = new THREE.Vector3(0, 0, 1).transformDirection(model.root.matrixWorld)
      const contact = spear.localToWorld(new THREE.Vector3(0, action === 'light' ? 1.59 : 1, 0))
      signatures.push(contact.clone().sub(position(spear)))
      expect(contact.clone().sub(position(spear)).dot(forward)).toBeGreaterThan(0.15)
    }
    expect(signatures[0].distanceTo(signatures[1])).toBeGreaterThan(0.45)
    expect(draw(unarmed.player).root.getObjectByName('bonolenov-prologue-spear')).toBeUndefined()
  })

  it('uses the point to hit beyond bare-knee range and loses that reach if disarmed', () => {
    const unarmed = duel()
    const armed = frames(command(unarmed), 60)
    const start = performMove({ state: unarmed, side: 'player', action: 'light' })
    const ordinary = attackData('light', start.player)
    const targetX = unarmed.player.x + ordinary.box.right + ordinary.lunge + 3.5
    const hitWithLight = (state: FightState) =>
      frames(
        performMove({
          state: { ...state, opponent: { ...state.opponent, x: targetX } },
          side: 'player',
          action: 'light',
        }),
        12,
      ).opponent.health
    expect(hitWithLight(unarmed)).toBe(unarmed.opponent.health)
    expect(hitWithLight(armed)).toBeLessThan(armed.opponent.health)
    const confiscated = { ...armed, player: { ...armed.player, weaponsConfiscated: true } }
    expect(hitWithLight(confiscated)).toBe(armed.opponent.health)
    expect(command(confiscated, BATTLE_MOVES.spear)).toBe(confiscated)
  })

  it('carries the real spear from the guard into a jumping normal', () => {
    const armed = frames(command(duel()), 60)
    const guarded = tickFight(
      armed,
      { ...EMPTY_INPUT, guard: true },
      { dt: 1 / 60, opponentInput: EMPTY_INPUT },
    )
    expect(guarded.player.battleCantabile?.prologue).toBe(true)
    let jumping = armed
    for (let i = 0; i < 7; i++)
      jumping = tickFight(
        jumping,
        { ...EMPTY_INPUT, jump: true },
        { dt: 1 / 60, opponentInput: EMPTY_INPUT },
      )
    expect(jumping.player.y).toBeGreaterThan(0)
    expect(jumping.player.battleCantabile?.prologue).toBe(true)
    const attack = performMove({ state: jumping, side: 'player', action: 'heavy' })
    expect(attack.player.attack?.moveId).toBe('bonolenov:airHeavy')
    expect(attackData('heavy', attack.player).auraZone).toBe('hands')
  })

  it('mounts the musical arm openings on their moving joints and restores bandages on rebuild', () => {
    const state = frames(command(duel()), 15)
    const model = draw(state.player)
    const holes = model.root
      .getObjectByName('shoulder-right')!
      .getObjectByName('bonolenov-exposed-body-holes')!
    expect(holes).toBeDefined()
    const before = position(holes.children[0])
    model.root.getObjectByName('shoulder-right')!.rotation.x += 0.4
    expect(position(holes.children[0]).distanceTo(before)).toBeGreaterThan(0.02)
    const torso = model.root.getObjectByName('torso')!
    const chestHoles = torso.getObjectByName('bonolenov-exposed-body-holes')!
    expect(chestHoles.children).toHaveLength(6)
    const chestBefore = position(chestHoles.children[0])
    torso.rotation.y += 0.4
    expect(position(chestHoles.children[0]).distanceTo(chestBefore)).toBeGreaterThan(0.02)
    expect(model.root.getObjectByName('signature-bandages')?.visible).toBe(false)
    const fresh = draw(duel().player)
    expect(fresh.root.getObjectByName('signature-bandages')?.visible).toBe(true)
    expect(fresh.root.getObjectByName('bonolenov-exposed-body-holes')).toBeUndefined()
  })

  it.each([{ hitStun: 4 }, { blocking: true }, { knockdownFrames: 4 }, { health: 0 }])(
    'never lets retained preparation override an interruption: %j',
    (patch) => {
      const fighter = { ...command(duel()).player, ...patch }
      expect(bonolenovDancePlan(fighter)).toBeNull()
    },
  )

  it('uses a finite ordinary retreat only after observable pressure, without adding immunity or damage', () => {
    const state = duel()
    const fighter = {
      ...state.player,
      x: 40,
      facing: 1 as const,
      pressureRead: {
        clock: 24,
        move: 'hisoka:standingHeavy',
        attackFrame: 16,
        seen: styleReactionFrames(state.player),
        lastHit: -1000,
        impact: -1,
      },
    }
    const target = { ...state.opponent, x: 50 }
    expect(moveBonolenovOpponent({ ...fighter, pressureRead: undefined }, target)).toBeNull()
    expect(
      moveBonolenovOpponent(
        { ...fighter, pressureRead: { ...fighter.pressureRead, seen: 1 } },
        target,
      ),
    ).toBeNull()
    const next = moveBonolenovOpponent(fighter, target)!
    expect(next.x).toBeLessThan(fighter.x)
    expect(next.motion?.dash?.frame).toBe(1)
    expect(next.health).toBe(fighter.health)
    expect(next.wakeupInvulnerableFrames).toBe(fighter.wakeupInvulnerableFrames)
    expect(next.attack).toBeNull()
    expect(
      moveBonolenovOpponent(
        {
          ...fighter,
          battleCantabile: {
            ...emptyBattleCantabile(),
            preparation: { piece: 'prologue', remaining: 30, total: 60 },
          },
        },
        target,
      ),
    ).toBeNull()
  })
})

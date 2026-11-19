import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performMove, performAuraAttack, tickFight } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { chrolloAiSlots } from './chrolloAi'
import { chrolloEquipmentAi } from './chrolloEquipmentAi'
import { chrolloKnifeHand } from './chrolloWeapon'
import { historicalBladeStrike } from './historicalWeapons'
import { moveChrolloOpponent } from './chrolloFootwork'
import { fighterKeyedMove } from './fighterKeyedMove'
import { buildFightFigure } from './fighterFigure'
import { bodyPlan, fightBodyMotion } from './fightBodyMotion'
import { captureFootPlant, fightRigOf } from './fightRig'
import { createHistoricalEquipmentScene } from './historicalEquipmentScene'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { executeReplayPacket } from './fightReplayCommands'
import { fightReplayHash } from './fightReplayHash'
import { attackData } from './frameData'
import { EMPTY_INPUT, type FightState, type MoveAction, type FightInput } from './types'
import type { ReplayPacket } from './fightReplayTypes'

function duel(): FightState {
  const s = beginFight(
    createFight('phinks', 'chrollo', {
      mode: 'versus-ai',
      formatId: 'arcade',
      environment: { stageId: 'heavens-arena' },
    }),
  )
  return {
    ...s,
    player: { ...s.player, x: 38, aura: 100 },
    opponent: { ...s.opponent, x: 64, aura: 100 },
  }
}
function advance(s: FightState, count: number): FightState {
  for (let i = 0; i < count; i++)
    s = tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return s
}
function armed(): FightState {
  return advance(
    performArsenalAction(
      { state: duel(), side: 'opponent', command: { action: 'weapon-ready' } },
      performAuraAttack,
    ),
    12,
  )
}
function strike(s: FightState, action: MoveAction, input: Partial<FightInput> = {}): FightState {
  return performMove({ state: s, side: 'opponent', action, input: { ...EMPTY_INPUT, ...input } })
}

describe('Chrollo — Zoldyck reference combat', () => {
  it('varies physical counters and kicks instead of turning pages at empty range', () => {
    const s = duel()
    expect(chrolloAiSlots(s, 0.9, 26)).toEqual([])
    expect(chrolloAiSlots(s, 0.1, 7)[0]).toBe('standingLight')
    expect(chrolloAiSlots(s, 0.5, 7)[0]).toBe('standingHeavy')
    expect(chrolloAiSlots(s, 0.75, 7)[0]).not.toBe('forwardSpecial')
    expect(chrolloAiSlots(s, 0.1, 15)[0]).toBe('forwardHeavy')
  })

  it('prepares his carried knife with real recovery and does not replenish a spent or confiscated weapon', () => {
    const s = duel()
    const next = chrolloEquipmentAi(s, performAuraAttack)!
    expect(next.opponent.historicalWeapon).toBe('ben-knife')
    expect(next.opponent.arenaRecovery).toBe(12)
    expect(next.projectiles).toHaveLength(0)
    expect(next.opponent.aura).toBe(s.opponent.aura)
    expect(chrolloEquipmentAi(next, performAuraAttack)).toBeNull()
    for (const patch of [
      { historicalWeaponSpent: true },
      { weaponsConfiscated: true },
      { hitStun: 20 },
    ])
      expect(
        chrolloEquipmentAi({ ...s, opponent: { ...s.opponent, ...patch } }, performAuraAttack),
      ).toBeNull()
  })

  it('holds the knife in the left hand with the open book and in the right hand after closing it', () => {
    const s = armed()
    expect(chrolloKnifeHand(s.opponent)).toBe('left')
    const closed = { ...s.opponent, chrolloBook: { ...s.opponent.chrolloBook!, open: false } }
    expect(chrolloKnifeHand(closed)).toBe('right')
    const openMove = fighterKeyedMove(strike(s, 'light').opponent, 'standingLight')
    const closedMove = fighterKeyedMove(
      strike({ ...s, opponent: closed }, 'light').opponent,
      'standingLight',
    )
    expect(openMove.timeline.some((key) => key.pose.rearShoulder)).toBe(true)
    expect(openMove.timeline.some((key) => key.pose.leadShoulder)).toBe(false)
    expect(closedMove.timeline.some((key) => key.pose.leadShoulder)).toBe(true)
  })

  it('keeps the book arm close during hand counters and kicks, in either facing', () => {
    for (const facing of [1, -1] as const) {
      for (const action of ['light', 'heavy'] as const) {
        const s = duel()
        const f = strike({ ...s, opponent: { ...s.opponent, facing } }, action).opponent
        const timeline = fighterKeyedMove(
          f,
          action === 'light' ? 'standingLight' : 'standingHeavy',
        ).timeline
        expect(timeline.some((key) => key.pose.leadShoulder || key.pose.leadElbow)).toBe(false)
      }
    }
  })

  it('poisons a real knife cut but never a heel, elbow or sweep', () => {
    const s = armed()
    expect(historicalBladeStrike(strike(s, 'light').opponent)).toBe(true)
    expect(historicalBladeStrike(strike(s, 'heavy').opponent)).toBe(false)
    expect(historicalBladeStrike(strike(s, 'heavy', { down: true }).opponent)).toBe(false)
    expect(historicalBladeStrike(strike(s, 'heavy', { left: true }).opponent)).toBe(false)
    const close = { ...s, player: { ...s.player, x: 58 } }
    const cut = advance(strike(close, 'light'), 30)
    expect(cut.player.paralyticPoison).toBeDefined()
    const kick = advance(strike(close, 'heavy'), 30)
    expect(kick.player.health).toBeLessThan(s.player.health)
    expect(kick.player.paralyticPoison).toBeUndefined()
  })

  it('retreats on an observed threat and returns on recovery without input reading or invulnerability', () => {
    const s = performMove({ state: duel(), side: 'player', action: 'heavy' })
    const target = { ...s.player, x: 54 }
    const data = attackData('heavy', target)
    const read = {
      clock: 100,
      move: target.attack!.moveId,
      attackFrame: data.startup + data.active - 1,
      seen: 15,
      lastHit: -1000,
      impact: -1,
    }
    const actor = { ...s.opponent, pressureRead: read }
    expect(moveChrolloOpponent({ ...actor, pressureRead: { ...read, seen: 1 } }, target)).toBeNull()
    const back = moveChrolloOpponent(actor, target)!
    expect(back.x).toBeGreaterThan(actor.x)
    expect(back.wakeupInvulnerableFrames).toBe(0)
    expect(back.hatsuEffects.teleportDodges).toBe(0)
    const recovering = {
      ...actor,
      x: 72,
      pressureRead: { ...read, attackFrame: data.startup + data.active },
    }
    expect(moveChrolloOpponent(recovering, target)!.x).toBeLessThan(recovering.x)
    for (const patch of [{ hitStun: 10 }, { parallelEyesClosed: true }, { x: 93 }])
      expect(
        moveChrolloOpponent({ ...actor, ...patch }, patch.x ? { ...target, x: 83 } : target),
      ).toBeNull()
  })

  it('positions the physical knife on the available anatomical wrist and hides it after release', () => {
    let s = armed()
    const scene = new THREE.Scene()
    const figure = new THREE.Group()
    const right = new THREE.Group(),
      left = new THREE.Group()
    right.name = 'hand-right'
    left.name = 'hand-left'
    right.position.set(1, 2, 3)
    left.position.set(4, 5, 6)
    figure.add(right, left)
    scene.add(figure)
    const effects = createHistoricalEquipmentScene({
      THREE,
      scene,
      worldX: (x) => x,
      worldY: (y) => y,
      figureOf: () => figure,
    })
    effects.sync(s, 0)
    const knife = scene.getObjectByName('historical-weapon:opponent:ben-knife')!
    expect(knife.position.toArray()).toEqual([4, 5, 6])
    s = {
      ...s,
      opponent: { ...s.opponent, chrolloBook: { ...s.opponent.chrolloBook!, open: false } },
    }
    effects.sync(s, 0)
    expect(knife.position.toArray()).toEqual([1, 2, 3])
    effects.sync(
      {
        ...s,
        opponent: { ...s.opponent, historicalWeapon: undefined, historicalWeaponSpent: true },
      },
      0,
    )
    expect(knife.visible).toBe(false)
    effects.dispose()
    expect(knife.parent).toBeNull()
  })

  it('lifts the striking foot on the real rig and frees the closed-book elbow', () => {
    const s = duel()
    const rightFacing = { ...s.opponent, facing: 1 as const }
    const open = bodyPlan(rightFacing, { seconds: 0, progress: 0 })!.pose
    const closed = { ...rightFacing, chrolloBook: { ...rightFacing.chrolloBook!, open: false } }
    expect(bodyPlan(closed, { seconds: 0, progress: 0 })!.pose.leadElbow![0]).toBeGreaterThan(
      open.leadElbow![0] + 1,
    )
    for (const facing of [1, -1] as const) {
      const fighter = strike({ ...s, opponent: { ...s.opponent, facing } }, 'heavy').opponent
      const frame = attackData('heavy', fighter).startup
      expect(attackData('heavy', fighter).auraZone).toBe('feet')
      const active = { ...fighter, attack: { ...fighter.attack!, frame } }
      const model = buildFightFigure({
        THREE,
        fighter: active,
        glow: (color, opacity) => new THREE.MeshBasicMaterial({ color, opacity }),
      })
      let heights: number[] = []
      model.animate(1, 'idle', {
        motion: (human) => {
          fightBodyMotion({ fighter: active, seconds: 1, progress: 0 })(human)
          heights = captureFootPlant(fightRigOf(human)).positions.map((point) => point.y)
        },
      })
      expect(Math.abs(heights[0] - heights[1])).toBeGreaterThan(0.25)
    }
  })

  it('reaches real physical exchanges through native AI ticks', () => {
    let s = duel()
    s = { ...s, player: { ...s.player, x: 22 }, opponent: { ...s.opponent, x: 74 } }
    const moves = new Set<string>()
    let knife = false,
      dash = false,
      contact = false
    for (let frame = 0; frame < 1500 && s.phase === 'fighting'; frame++) {
      if (frame > 200 && frame % 110 === 0)
        s = performMove({ state: s, side: 'player', action: 'heavy' })
      s = tickFight(
        s,
        { ...EMPTY_INPUT, right: frame > 200 && s.player.x < s.opponent.x - 10 },
        { dt: 1 / 60, ai: true },
      )
      if (s.opponent.attack) moves.add(s.opponent.attack.moveId ?? s.opponent.attack.kind)
      knife ||= s.opponent.historicalWeapon === 'ben-knife'
      dash ||= Boolean(s.opponent.motion?.dash)
      contact ||= s.impact?.attacker === 'opponent' && s.impact.damage > 0
    }
    expect(knife).toBe(true)
    expect(dash).toBe(true)
    expect([...moves].some((id) => /Light|Heavy/.test(id))).toBe(true)
    expect(contact).toBe(true)
  })

  it('replays the new equipment decisions and footwork deterministically', () => {
    let s = duel()
    const recorder = createReplayRecorder(s)!
    for (let i = 0; i < 300; i++) {
      const packet: ReplayPacket = [
        1 / 60,
        0,
        0,
        i % 90 === 0 ? [{ kind: 'move', side: 'player', action: 'heavy', input: 0 }] : [],
      ]
      const next = executeReplayPacket(s, packet)
      recorder.append(s, packet, next)
      s = next
    }
    const replay = createReplayPlayer(recorder.snapshot()!)
    while (!replay.done && !replay.error) replay.advance(0.05, 10)
    expect(replay.error).toBe('')
    expect(fightReplayHash(replay.state)).toBe(fightReplayHash(s))
  })
})

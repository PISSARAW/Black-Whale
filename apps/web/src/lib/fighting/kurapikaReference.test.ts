import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { attackData } from './frameData'
import { moveForSlot } from './movesets'
import { kurapikaChainMotions } from './kurapikaChainMotion'
import { createKurapikaEffectScene } from './kurapikaEffectScene'
import { kurapikaCombatSlots } from './kurapikaCombatAi'
import { moveKurapikaOpponent } from './kurapikaFootwork'
import { kurapikaWhipPoints } from './kurapikaWhipPath'
import { buildFightFigure } from './fighterFigure'
import { fightBodyMotion } from './fightBodyMotion'
import { EMPTY_INPUT, type FightState, type MoveSlot } from './types'
import { fighterKeyedMove } from './fighterKeyedMove'
import { locomotionGuard } from './fightLocomotion'
import { fightStance, stanceAt } from './fightStance'

const NORMALS: MoveSlot[] = [
  'standingLight',
  'standingHeavy',
  'lowLight',
  'lowHeavy',
  'airLight',
  'airHeavy',
  'forwardLight',
  'forwardHeavy',
  'backHeavy',
]
function ready(): FightState {
  const s = beginFight(createFight('phinks', 'kurapika', { mode: 'versus-local' }))
  return { ...s, player: { ...s.player, x: 40 }, opponent: { ...s.opponent, x: 50, aura: 100 } }
}
function cast(s: FightState, slot: MoveSlot): FightState {
  const move = moveForSlot('kurapika', slot)!
  return performAuraAttack({
    state: s,
    side: 'opponent',
    kind: move.kind,
    moveId: move.id,
    auraCharged: false,
  })
}
function step(s: FightState, frames: number) {
  for (let i = 0; i < frames; i++)
    s = tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return s
}

describe('Kurapika · Uvogin and Phantom Rouge references', () => {
  it.each(NORMALS)('%s remains a martial blow without launching an uncommanded chain', (slot) => {
    const s = cast(ready(), slot)
    expect(s.opponent.attack).not.toBeNull()
    s.opponent.attack!.frame = attackData(s.opponent.attack!.kind, s.opponent).startup
    expect(kurapikaChainMotions(s, 'opponent')).toEqual([])
  })
  it('does not attach a chain to the service pistol', () => {
    const s = performAuraAttack({
      state: ready(),
      side: 'opponent',
      kind: 'ranged',
      auraCharged: false,
    })
    expect(s.opponent.attack?.kind).toBe('ranged')
    expect(kurapikaChainMotions(s, 'opponent')).toEqual([])
    const pose = fighterKeyedMove(s.opponent, 'neutralSpecial')
    expect(pose.authored).toBe(true)
    expect(pose.timeline[1].pose.rearShoulder?.[0]).toBeLessThan(-1.5)
  })
  it('raises the forearm only for the guarded heavy-impact beat', () => {
    const fighter = ready().opponent
    const standing = stanceAt(fightStance('kurapika')!, 0)
    const calm = locomotionGuard(fighter, standing)
    fighter.blockStun = 8
    const impacted = locomotionGuard(fighter, standing)
    expect(impacted.leadShoulder![0]).toBeLessThan(calm.leadShoulder![0] - 1)
    expect(impacted.root?.[2]).toBeLessThan(0)
  })
  it('can hit physically in Zetsu without forcing a chain or spending Hatsu aura', () => {
    let s = ready()
    s.opponent.x = 45
    s.opponent.nen = { ...s.opponent.nen, mode: 'zetsu' }
    const before = s.player.health
    s = step(cast(s, 'standingLight'), 22)
    expect(s.player.health).toBeLessThan(before)
    expect(s.player.chainJail).toBeUndefined()
    expect(s.player.drainingChain).toBeUndefined()
    expect(s.opponent.kurapika?.lifespanFrames).toBe(0)
  })
  it('never proposes fatal Chain Jail on an ineligible opponent, including all rolls', () => {
    const s = ready()
    for (const id of ['hisoka', 'leorio', 'theta'] as const) {
      s.player.id = id
      for (const roll of [0, 0.2, 0.5, 0.95])
        expect(kurapikaCombatSlots({ state: s, gap: 14, roll })).not.toContain('neutralSpecial')
    }
    s.player.id = 'phinks'
    expect(kurapikaCombatSlots({ state: s, gap: 14, roll: 0.2 })[0]).toBe('neutralSpecial')
  })
  it('uses short strikes close up and keeps a captured Spider bound while approaching', () => {
    const s = ready()
    expect(kurapikaCombatSlots({ state: s, gap: 5, roll: 0.5 })[0]).toBe('forwardLight')
    s.player.chainJail = { owner: 'opponent', x: s.player.x, y: 0 }
    expect(kurapikaCombatSlots({ state: s, gap: 14, roll: 0.2 })).not.toContain('neutralSpecial')
    expect(kurapikaCombatSlots({ state: s, gap: 14, roll: 0.2 })).not.toContain('finisher')
    expect(kurapikaCombatSlots({ state: s, gap: 5, roll: 0.2 })[0]).toBe('finisher')
    s.player.judgmentChain = { owner: 'opponent', rule: 'zetsu' }
    expect(kurapikaCombatSlots({ state: s, gap: 5, roll: 0.2 })[0]).toBe('standingLight')
  })
  it('retreats only after observing pressure and uses an ordinary vulnerable dash', () => {
    const s = performAuraAttack({
      state: ready(),
      side: 'player',
      kind: 'heavy',
      auraCharged: false,
    })
    const read = {
      clock: 36,
      move: s.player.attack!.moveId ?? s.player.attack!.kind,
      seen: 1,
      attackFrame: 0,
      lastHit: -999,
      impact: -1,
    }
    const actor = { ...s.opponent, pressureRead: read }
    expect(moveKurapikaOpponent(actor, s.player)).toBeNull()
    const observed = { ...actor, pressureRead: { ...read, seen: 14 } }
    const next = moveKurapikaOpponent(observed, s.player)!
    expect(next.x).toBeGreaterThan(actor.x)
    expect(next.motion?.dash?.direction).toBe(1)
    expect(next.wakeupInvulnerableFrames).toBe(actor.wakeupInvulnerableFrames)
    expect(moveKurapikaOpponent({ ...observed, hitStun: 5 }, s.player)).toBeNull()
    expect(moveKurapikaOpponent({ ...observed, x: 88 }, s.player)).toBeNull()
  })
  it('walks into Judgment range after an actual capture without releasing the prisoner', () => {
    const s = step(cast(ready(), 'neutralSpecial'), 60)
    expect(s.player.chainJail?.owner).toBe('opponent')
    let actor = s.opponent
    for (let i = 0; i < 30; i++) actor = moveKurapikaOpponent(actor, s.player)!
    expect(Math.abs(actor.x - s.player.x)).toBeLessThanOrEqual(6)
    expect(s.player.chainJail?.owner).toBe('opponent')
    expect(kurapikaCombatSlots({ state: { ...s, opponent: actor }, gap: 6, roll: 0.2 })[0]).toBe(
      'finisher',
    )
  })
  it.each([false, true])(
    'keeps the authored body hook while maintaining a chain: %s',
    (holding) => {
      const s = cast(ready(), 'standingHeavy')
      if (holding) s.player.chainJail = { owner: 'opponent', x: s.player.x, y: 0 }
      const actor = s.opponent
      actor.attack!.frame = attackData('heavy', actor).startup
      const model = buildFightFigure({
        THREE,
        fighter: actor,
        glow: (color) => new THREE.MeshBasicMaterial({ color }),
      })
      model.animate(1, 'idle', {
        transitionSeconds: 0,
        motion: fightBodyMotion({ fighter: actor, seconds: 1, progress: 0.5 }),
      })
      const hand = model.root.getObjectByName('hand-right')!
      const before = hand.getWorldPosition(new THREE.Vector3()).toArray()
      const scene = new THREE.Scene()
      scene.add(model.root)
      const effect = createKurapikaEffectScene({
        THREE,
        scene,
        worldX: (x) => x * 0.115,
        worldY: (y) => y * 0.12,
        figureOf: (side) => (side === 'opponent' ? model.root : undefined),
      })
      effect.sync(s, 1)
      expect(hand.getWorldPosition(new THREE.Vector3()).toArray()).toEqual(before)
      expect(
        scene
          .getObjectByName('kurapika-chains:opponent')!
          .children.filter((child) => child.visible),
      ).toHaveLength(holding ? 2 : 0)
      effect.dispose()
    },
  )
  it('loops the whip behind an unchanged tip and keeps reduced motion straight', () => {
    const start = new THREE.Vector3(-1, 1, 0),
      end = new THREE.Vector3(1, 1, 0)
    const motion = { stage: 0 as const, mode: 'attack' as const, extension: 1, reach: 18 }
    const curve = kurapikaWhipPoints({ start, end, motion, reduced: false })
    expect(curve[0]).toEqual(start)
    expect(curve.at(-1)).toEqual(end)
    expect(curve[1].y).toBeGreaterThan(start.y)
    expect(curve[2].y).toBeLessThan(end.y)
    expect(kurapikaWhipPoints({ start, end, motion, reduced: true }).every((p) => p.y === 1)).toBe(
      true,
    )
    expect(curve).toEqual(kurapikaWhipPoints({ start, end, motion, reduced: false }))
  })
})

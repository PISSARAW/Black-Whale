import { expect, it } from 'vitest'
import * as THREE from 'three'
import { createFight } from '../engine'
import { buildFightFigure } from '../fighterFigure'
import { fightBodyMotion } from '../fightBodyMotion'
import { defaultFightComfort } from '../fightComfort'
import { createVictoryRenderer } from './renderer'
import { selectVictory } from './catalogue'
import { furykovCounterPlan, FURYKOV_COUNTER_HITS } from './furykovCounterPlan'
import { FIGHTING_ROSTER } from '../roster'

it('prepares a target-specific weapon for every opponent, never a universal Nen canceller', () => {
  for (const fighter of FIGHTING_ROSTER) {
    const plan = furykovCounterPlan(fighter.id)
    expect(plan.targetName).toBe(fighter.name)
    expect(plan.preparedBeforeFight).toBe(true)
    expect(plan.decipherComplete && plan.fabricationComplete).toBe(true)
    expect(plan.universalNenCancellation).toBe(false)
  }
  expect(furykovCounterPlan('hisoka').kind).toBe('sever')
  expect(furykovCounterPlan('franklin').kind).toBe('intercept')
  expect(furykovCounterPlan('biscuit').kind).toBe('pierce')
  expect(furykovCounterPlan('longhi').kind).toBe('reach')
})

it.each(['hisoka', 'franklin', 'biscuit', 'kalluto', 'longhi', 'furykov'] as const)(
  'keeps the weapon in the hand, makes real surface contacts and restores %s',
  (target) => {
    const state = {
      ...createFight(target, 'furykov'),
      phase: 'finished' as const,
      winner: 'opponent' as const,
    }
    const build = (fighter: typeof state.player) => {
      const m = buildFightFigure({
        THREE,
        fighter,
        glow: (color, opacity = 1) =>
          new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 }),
      })
      m.animate(0, 'idle', { motion: fightBodyMotion({ fighter, seconds: 0, progress: 0 }) })
      return m.root
    }
    const models = { player: build(state.player), opponent: build(state.opponent) }
    const scene = new THREE.Scene(),
      scenery = new THREE.Group()
    const camera = new THREE.PerspectiveCamera(34, 16 / 9, 0.1, 100)
    scene.add(scenery, models.player, models.opponent)
    const snapshot = () => {
      const rows: unknown[] = []
      scene.traverse((n) =>
        rows.push([
          n.uuid,
          n.position.toArray(),
          n.quaternion.toArray(),
          n.scale.toArray(),
          n.visible,
        ]),
      )
      return JSON.stringify(rows)
    }
    const before = snapshot(),
      source = JSON.stringify(state)
    const renderer = createVictoryRenderer({ scene, scenery, camera })
    try {
      for (const age of [0, 90, 120, 156, 180, 216, 240, ...FURYKOV_COUNTER_HITS, 415, 480, 570]) {
        const restore = renderer.apply({
          state,
          models,
          comfort: defaultFightComfort(),
          frame: { ...selectVictory(state)!, active: true, elapsed: age / 60 },
        })!
        const audit = scene.userData.furykovVictory
        expect(audit.kind).toBe(furykovCounterPlan(target).kind)
        expect(audit.preparedBeforeFight).toBe(true)
        expect(audit.instantDecipher || audit.instantFabrication).toBe(false)
        if (age >= 114) expect(Math.max(...audit.handErrors), `${target}/${age}`).toBeLessThan(0.06)
        if ((FURYKOV_COUNTER_HITS as readonly number[]).includes(age))
          expect(audit.contactError, `${target}/${age}`).toBeLessThan(0.035)
        if (age >= 480) expect(audit.fall.floor).toBeCloseTo(0.012, 5)
        const weapon = scene.getObjectByName(`furykov-prepared-counterweapon:${audit.kind}`)!
        expect(weapon).toBeDefined()
        if (age >= 144)
          expect(
            weapon.position.distanceTo(
              models.opponent.getObjectByName('hand-right')!.getWorldPosition(new THREE.Vector3()),
            ),
          ).toBeLessThan(1e-6)
        restore()
        expect(snapshot()).toBe(before)
        expect(JSON.stringify(state)).toBe(source)
      }
    } finally {
      renderer.dispose()
    }
  },
)

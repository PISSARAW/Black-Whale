import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure } from './fighterFigure'
import { fightBodyMotion } from './fightBodyMotion'
import { createFightState } from './fightState'
import { movesetFor } from './movesets'
import type { ArcadeFighter, MoveSlot } from './types'
import { humanFootRig } from '$lib/tour/humanFootRig'

const glow = (color: number, opacity = 1) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })

function figure(id: 'kurapika' | 'chrollo' = 'kurapika') {
  return buildFightFigure({ THREE, glow, fighter: createFightState(id, 'hisoka').player })
}

function attacking(fighter: ArcadeFighter, slot: MoveSlot, facing: 1 | -1): ArcadeFighter {
  const move = movesetFor(fighter.id)!.moves.find((candidate) => candidate.slot === slot)!
  return {
    ...fighter,
    facing,
    pose: move.kind,
    y: move.variant === 'air' ? 3 : 0,
    attack: {
      kind: move.kind,
      variant: move.variant,
      moveId: move.id,
      frame: move.tuning.startup,
      impacted: false,
      auraCharged: false,
      concealed: false,
      hatsuSource: null,
      projectileSpawned: false,
      reversal: false,
    },
  }
}

describe('P18 responsive extremities and tailoring', () => {
  it('keeps held children unscaled while sharing hand morph and hem geometry', () => {
    const first = figure()
    const second = figure()
    expect(first.turns.userData.materialResponse).toBe('roster-extremities-and-tailoring')
    const other = figure('chrollo')
    expect(other.turns.userData.materialResponse).toBe('roster-extremities-and-tailoring')
    expect(
      (other.root.getObjectByName('hand-left') as THREE.Mesh).geometry.userData.fightGripMorph,
    ).toBe(true)

    for (const side of ['left', 'right'] as const) {
      const hand = first.root.getObjectByName(`hand-${side}`) as THREE.Mesh
      const duplicate = second.root.getObjectByName(`hand-${side}`) as THREE.Mesh
      expect(hand.scale.toArray()).toEqual([1, 1, 1])
      expect(hand.geometry.userData.fightGripMorph).toBe(true)
      expect(hand.geometry.morphAttributes.position).toHaveLength(1)
      expect(hand.geometry).toBe(duplicate.geometry)
    }
    expect(first.root.getObjectByName('signature-chain-0')?.scale.toArray()).toEqual([1, 1, 1])
    expect(first.root.getObjectByName('kurapika-handgun')?.scale.toArray()).toEqual([1, 1, 1])

    const hems = ['kurapika-jacket-hem-left', 'kurapika-jacket-hem-right'].map((name) =>
      first.root.getObjectByName(name)!,
    )
    expect(hems.every((hem) => hem.parent?.name === 'torso')).toBe(true)
    expect(hems.flatMap((hem) => hem.children)).toHaveLength(4)
    expect((hems[0].children[0] as THREE.Mesh).geometry).toBe(
      (second.root.getObjectByName('kurapika-jacket-hem-left')!.children[0] as THREE.Mesh).geometry,
    )
  })

  it('closes hands, loads shoes and trails cloth across heavy attacks in both facings', () => {
    const fighter = createFightState('kurapika', 'hisoka').player
    const before = JSON.stringify(fighter)
    const model = buildFightFigure({ THREE, glow, fighter })
    const tie = model.root.getObjectByName('kurapika-tie')!
    const tieRest = tie.rotation.clone()
    const shoeRest = ['left', 'right'].map((side) =>
      model.root.getObjectByName(`knee-${side}`)!.children[1].scale.clone(),
    )
    const changedLeads = new Set<number>()

    for (const facing of [1, -1] as const) {
      for (const [index, slot] of (
        ['standingHeavy', 'lowHeavy', 'airHeavy'] as MoveSlot[]
      ).entries()) {
        const posed = attacking(fighter, slot, facing)
        model.animate(index + (facing < 0 ? 10 : 1), 'idle', {
          transitionSeconds: 0,
          motion: fightBodyMotion({ fighter: posed, seconds: index + 1, progress: 0.5 }),
        })
        const lead = facing === 1 ? 1 : 0
        const hand = model.root.getObjectByName(
          lead === 0 ? 'hand-left' : 'hand-right',
        ) as THREE.Mesh
        expect(hand.morphTargetInfluences?.[0], `${facing}:${slot}:grip`).toBeGreaterThan(0.5)
        if (slot !== 'standingHeavy') {
          const shoe = model.root.getObjectByName(
            lead === 0 ? 'knee-left' : 'knee-right',
          )!.children[1]
          const rig = humanFootRig(shoe)
          if (rig) {
            expect(Math.abs(rig.ankle.rotation.x), `${facing}:${slot}:ankle`).toBeGreaterThan(0)
            expect(Math.abs(rig.toe.rotation.x), `${facing}:${slot}:toe`).toBeGreaterThan(0)
          } else expect(shoe.scale.z, `${facing}:${slot}:shoe`).toBeGreaterThan(shoeRest[lead].z)
          changedLeads.add(lead)
        }
        expect(
          model.root
            .getObjectByName('kurapika-jacket-hem-left')!
            .rotation.toArray()
            .slice(0, 3)
            .every(Number.isFinite),
        ).toBe(true)
      }
    }

    expect(changedLeads).toEqual(new Set([0, 1]))
    expect(tie.rotation.equals(tieRest)).toBe(false)
    expect(JSON.stringify(fighter)).toBe(before)
  })
})

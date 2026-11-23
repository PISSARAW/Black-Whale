import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure } from './fighterFigure'
import { createFightState } from './fightState'
import { FIGHTING_ROSTER } from './roster'

const glow = (color: number, opacity = 1) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })

function figure(id: 'kurapika' | 'hisoka' | 'chrollo') {
  return buildFightFigure({ THREE, glow, fighter: createFightState(id, 'hisoka').player })
}

describe('P14 hero finish and P16 roster propagation', () => {
  it('deepens Hisoka fitted waistcoat and mounts dark accents on animated joints', () => {
    const model = figure('hisoka')
    expect(model.root.getObjectByName('fight-roster-finish')?.userData.finishTier).toBe('hero')
    expect(model.root.getObjectByName('hisoka-waistcoat-trim')).toBeTruthy()
    for (const name of [
      'hisoka-waistcoat-left',
      'hisoka-waistcoat-right',
      'hisoka-shoulder-panel-left',
      'hisoka-shoulder-panel-right',
      'hisoka-wrist-cuff-left',
      'hisoka-wrist-cuff-right',
      'hisoka-nose-bridge',
      'hisoka-lower-lip',
    ])
      expect(model.root.getObjectByName(name), name).toBeTruthy()
    expect(model.root.getObjectByName('hisoka-waistcoat-button-3')).toBeTruthy()
  })

  it('separates Kurapika navy tailoring and keeps face detail on the animated head', () => {
    const model = figure('kurapika')
    for (const name of [
      'kurapika-jacket-seam-left',
      'kurapika-jacket-seam-right',
      'kurapika-lower-lid-left',
      'kurapika-lower-lid-right',
    ])
      expect(model.root.getObjectByName(name), name).toBeTruthy()
    expect(model.root.getObjectByName('kurapika-lower-lid-left')?.parent?.name).toBe(
      'kurapika-head',
    )
    const jacket = model.root
      .getObjectByName('torso')
      ?.children.find(
        (node) => (node as THREE.Mesh).isMesh && (node as THREE.Mesh).material,
      ) as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>
    expect(jacket.material.color.b).toBeGreaterThan(jacket.material.color.r)
  })

  it('enlarges readable extremities while retaining the hero scale', () => {
    const hero = figure('hisoka')
    expect(hero.root.getObjectByName('hand-left')?.scale.x).toBeCloseTo(1.14)
    expect(hero.root.getObjectByName('fight-hand-knuckles-left')?.parent?.name).toBe('hand-left')
    const other = figure('chrollo')
    expect(other.root.getObjectByName('fight-roster-finish')?.userData.finishTier).toBe('roster')
    expect(other.root.getObjectByName('fight-hand-knuckles-left')).toBeTruthy()
    expect(other.root.getObjectByName('hand-left')?.scale.x).toBeGreaterThan(1)
  })

  it('keeps the vertical slice inside a modest draw-call budget', () => {
    for (const id of ['kurapika', 'hisoka'] as const) {
      const model = figure(id)
      let meshes = 0
      model.root.traverse((node) => {
        if (
          (node as THREE.Mesh).isMesh &&
          /^(fight-hand-knuckles|hisoka-(waistcoat-(left|right|button)|shoulder|wrist|nose|lower)|kurapika-(jacket|lower))/.test(
            node.name,
          )
        )
          meshes++
      })
      expect(meshes, id).toBeLessThanOrEqual(14)
    }
  })

  it.each(FIGHTING_ROSTER)('$name receives proportional hands, knuckles and feet', ({ id }) => {
    const model = buildFightFigure({
      THREE,
      glow,
      fighter: createFightState(id, 'hisoka').player,
    })
    const finish = model.root.getObjectByName('fight-roster-finish')
    expect(finish, id).toBeTruthy()
    for (const side of ['left', 'right'] as const) {
      const hand = model.root.getObjectByName(`hand-${side}`)!
      const shoe = model.root.getObjectByName(`knee-${side}`)?.children[1]
      if (id === 'kurapika') {
        expect(hand.scale.x, `${id}:${side}:held-child-scale`).toBe(1)
        expect((hand as THREE.Mesh).geometry.userData.fightExtremityScale).toBeCloseTo(1.1)
      } else expect(hand.scale.x, `${id}:${side}:hand`).toBeGreaterThan(1)
      expect(
        hand.getObjectByName(`fight-hand-knuckles-${side}`),
        `${id}:${side}:knuckles`,
      ).toBeTruthy()
      expect(shoe?.scale.x, `${id}:${side}:shoe`).toBeGreaterThan(1)
    }
  })
})

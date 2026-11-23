import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure } from './fighterFigure'
import { createFightState } from './fightState'

const glow = (color: number, opacity = 1) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })

function figure(id: 'kurapika' | 'hisoka' | 'chrollo') {
  return buildFightFigure({ THREE, glow, fighter: createFightState(id, 'hisoka').player })
}

describe('P14 hero visual finish', () => {
  it('deepens Hisoka fitted waistcoat and mounts dark accents on animated joints', () => {
    const model = figure('hisoka')
    expect(model.root.getObjectByName('fight-hero-finish')).toBeTruthy()
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

  it('enlarges readable extremities without changing shared roster models', () => {
    const hero = figure('hisoka')
    expect(hero.root.getObjectByName('hand-left')?.scale.x).toBeCloseTo(1.14)
    expect(hero.root.getObjectByName('fight-hand-knuckles-left')?.parent?.name).toBe('hand-left')
    const other = figure('chrollo')
    expect(other.root.getObjectByName('fight-hero-finish')).toBeUndefined()
    expect(other.root.getObjectByName('fight-hand-knuckles-left')).toBeUndefined()
    expect(other.root.getObjectByName('hand-left')?.scale.x).toBe(1)
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
})

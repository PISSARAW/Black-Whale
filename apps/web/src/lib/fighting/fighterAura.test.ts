import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { NEN_PRESENTATION } from '@black-whale/nen-engine'
import {
  onFragmentShader,
  onVertexShader,
  renFragmentShader,
  renVertexShader,
} from '$lib/tour/auraShaders'
import { buildHumanFigure, type HumanFigureBuild } from '$lib/tour/humanFigure'
import { buildFightFigure } from './fighterFigure'
import { createFightState } from './fightState'
import type { ArcadeFighter, FighterId } from './types'

const glow: HumanFigureBuild['glow'] = (color, opacity) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })

function fighter(nen: Partial<ArcadeFighter['nen']>, id: FighterId = 'kurapika') {
  const base = createFightState(id, 'hisoka').player
  return { ...base, nen: { ...base.nen, ...nen } }
}

function figure(nen: Partial<ArcadeFighter['nen']>, id?: FighterId) {
  return buildFightFigure({ THREE, glow, fighter: fighter(nen, id) })
}

function shell(model: ReturnType<typeof figure>, technique: 'ren' | 'on') {
  return model.root.getObjectByName(`nen-visitor-${technique}`) as THREE.Mesh<
    THREE.BufferGeometry,
    THREE.ShaderMaterial
  >
}

describe('Fighting 2D visitor aura', () => {
  it.each(['ren', 'on'] as const)(
    'uses the visitor shaders, palette and blending for %s',
    (technique) => {
      const model = figure({ mode: 'ren', on: technique === 'on' })
      const aura = shell(model, technique)
      const on = technique === 'on'
      expect(aura.material.vertexShader).toBe(on ? onVertexShader : renVertexShader)
      expect(aura.material.fragmentShader).toBe(on ? onFragmentShader : renFragmentShader)
      expect(aura.material.blending).toBe(on ? THREE.MultiplyBlending : THREE.AdditiveBlending)
      expect(aura.material.premultipliedAlpha).toBe(on)
      expect(aura.material.depthWrite).toBe(false)
      expect(aura.material.side).toBe(THREE.DoubleSide)
      expect(aura.material.uniforms.u_colorCore.value.getHex()).toBe(
        NEN_PRESENTATION[technique].colours[0],
      )
      expect(aura.material.uniforms.u_colorEdge.value.getHex()).toBe(
        NEN_PRESENTATION[technique].colours[1],
      )
      expect(aura.parent).toBe(model.turns)
      expect(model.root.getObjectByName('nen-ren-flame')).toBeUndefined()
      expect(model.root.getObjectByName('nen-on-flame')).toBeUndefined()
      expect(model.root.getObjectByName('nen-on-core')).toBeUndefined()
      const skins: string[] = []
      model.root.traverse((node) => {
        if (node.name.startsWith('nen-skin-ren')) skins.push(node.name)
      })
      expect(skins).toHaveLength(0)
      model.animate(1)
      expect(aura.material.uniforms.u_time.value).toBe(1)
      model.animate(45)
      expect(aura.material.uniforms.u_time.value).toBe(45)
      expect(aura.material.uniforms.u_opacity.value).toBe(0.8)
    },
  )

  it('shares the envelope and materials across fighters and repeated Nen changes', () => {
    const kurapika = shell(figure({ mode: 'ren' }), 'ren')
    const hisoka = shell(figure({ mode: 'ren' }, 'hisoka'), 'ren')
    expect(kurapika.geometry).toBe(hisoka.geometry)
    expect(kurapika.material).toBe(hisoka.material)
    expect(shell(figure({ mode: 'ren', on: true }), 'on').material).not.toBe(kurapika.material)
    kurapika.geometry.computeBoundingBox()
    expect(kurapika.geometry.boundingBox!.min.y + kurapika.position.y).toBeCloseTo(-0.2)
    expect(kurapika.geometry.boundingBox!.max.y + kurapika.position.y).toBeCloseTo(2.2)
  })

  it.each([
    { mode: 'ten' as const },
    { mode: 'zetsu' as const },
    { mode: 'ren' as const, ken: true },
    { mode: 'ren' as const, ko: 'hands' as const },
    { mode: 'ren' as const, in: true },
  ])('does not add a Ren/On envelope for %j', (nen) => {
    const model = figure(nen)
    expect(shell(model, 'ren')).toBeUndefined()
    expect(shell(model, 'on')).toBeUndefined()
  })

  it('keeps ship characters on their existing aura renderer', () => {
    const who = fighter({ mode: 'ren' })
    const model = buildHumanFigure({
      THREE,
      glow,
      seen: {
        id: 'ship-aura-test',
        kind: 'combatant',
        spaceId: 'room',
        tierId: 'tier-1',
        at: [0, 0],
        y: 0,
        size: 1,
        colour: 0xffffff,
        stage: 0,
        hidden: false,
        human: { role: 'fighter', identity: 'kurapika', pose: 'idle', aura: 'ren', nen: who.nen },
      },
    })
    expect(model.root.getObjectByName('nen-ren-flame')).toBeDefined()
    expect(model.root.getObjectByName('nen-visitor-ren')).toBeUndefined()
  })
})

import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildLsdfApparition } from './apparitionLsdfView'
import type { Apparition } from './apparitions'

function context() {
  const root = new THREE.Group()
  const materials = new Map<string, THREE.MeshBasicMaterial>()
  const glow = (color: number, opacity: number) => {
    const key = `${color}|${opacity}`
    if (!materials.has(key))
      materials.set(key, new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 }))
    return materials.get(key)!
  }
  return { THREE, root, glow, skin: glow(0xd8d5c8, 1) }
}

const seen: Apparition = {
  id: 'lsdf',
  kind: 'lsdf-guard',
  at: [0, 0],
  y: 0,
  size: 1,
  colour: 0xd8d5c8,
  stage: 5,
  spaceId: 'heilly-hideout',
  tierId: 'tier-2',
  hidden: false,
}

describe('the LSDF manga model', () => {
  it('builds a numbered formation with Yokotani’s uniform design', () => {
    const ctx = context()
    buildLsdfApparition(seen, ctx)
    const formation = ctx.root.getObjectByName('lsdf-numbered-guard-formation')
    expect(formation?.children).toHaveLength(3)
    expect(ctx.root.getObjectByName('lsdf-guard-level-5')).toBeDefined()
    expect(ctx.root.getObjectByName('lsdf-guard-level-4')).toBeDefined()
    expect(ctx.root.getObjectByName('lsdf-centre-stripe')).toBeDefined()
    expect(ctx.root.getObjectByName('lsdf-level-5-segment-6')).toBeDefined()

    const bounds = new THREE.Box3().setFromObject(ctx.root, true)
    expect(bounds.isEmpty()).toBe(false)
    expect(bounds.min.toArray().every(Number.isFinite)).toBe(true)
    expect(bounds.max.toArray().every(Number.isFinite)).toBe(true)
  })
})

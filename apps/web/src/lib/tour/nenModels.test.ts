import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildBasicApparition } from './apparitionBasicView'
import { buildMechanicalApparition } from './apparitionMechanicalView'
import { buildCrawlingApparition } from './apparitionCrawlingView'
import { buildDragonApparition } from './apparitionDragonView'
import { GUARDIAN_PRESENTATION } from './nenAppearance'
import { buildObjectApparition } from './apparitionObjectView'
import { buildGuardianApparition } from './apparitionGuardianView'
import { buildAnimalApparition } from './apparitionAnimalView'
import { buildSpriteApparition } from './apparitionSpriteView'
import { buildRoyalBeastApparition } from './apparitionRoyalBeastView'
import { buildSupportBeastApparition } from './apparitionSupportBeastView'
import { buildBiohazardApparition } from './apparitionBiohazardView'
import { buildWormPortal } from './apparitionPortalView'
import { buildMangaPropApparition } from './apparitionMangaPropView'
import { batchNenModel } from './nenModelBatch'
import { buildHumanFigure } from './humanFigure'
import type { Apparition, ApparitionKind } from './apparitions'

const builders = [
  buildWormPortal,
  buildMechanicalApparition,
  buildCrawlingApparition,
  buildDragonApparition,
  buildBasicApparition,
  buildObjectApparition,
  buildGuardianApparition,
  buildAnimalApparition,
  buildSpriteApparition,
  buildRoyalBeastApparition,
  buildSupportBeastApparition,
  buildMangaPropApparition,
  buildBiohazardApparition,
]
const seen = (kind: ApparitionKind): Apparition => ({
  id: kind,
  kind,
  at: [0, 0],
  y: 0,
  size: 1,
  colour: 0xaaa49d,
  stage: 0,
  spaceId: 'room',
  tierId: 'tier',
  hidden: false,
})
function context() {
  const root = new THREE.Group(),
    materials = new Map<string, THREE.MeshBasicMaterial>()
  const glow = (color: number, opacity: number) => {
    const key = `${color}|${opacity}`
    if (!materials.has(key))
      materials.set(key, new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 }))
    return materials.get(key)!
  }
  return { THREE, root, glow, skin: glow(0xaaa49d, 1) }
}

describe('the manga models', () => {
  it.each<ApparitionKind>([
    'portal',
    'fish',
    'hoover',
    'cat',
    'sprite',
    'chimera',
    'medusa',
    'toad',
    'benjamin-guardian',
    'halkenburg-guardian',
    'nasubi-guardian',
    'tserriednich-second',
    'dolphin',
    'cookie',
    'predator-salesale',
    'blood-snake',
    'nen-spider',
    'phone',
    'cloth',
    'staff',
    'jupiter',
    'pain-armour',
    'animal-object',
  ])('builds finite, visible geometry for %s and preserves it when batching', (kind) => {
    const ctx = context()
    for (const build of builders) build(seen(kind), ctx)
    const before = new THREE.Box3().setFromObject(ctx.root, true)
    expect(before.isEmpty()).toBe(false)
    batchNenModel(ctx.root)
    if (
      [
        'sprite',
        'chimera',
        'benjamin-guardian',
        'halkenburg-guardian',
        'nasubi-guardian',
        'cookie',
      ].includes(kind)
    ) {
      let draws = 0
      ctx.root.traverse((part) => {
        if ((part as THREE.Mesh).isMesh) draws++
      })
      // A missing UV/normal attribute must not silently leave hundreds of
      // feathers, facial features or hair locks as separate draw calls.
      expect(draws).toBeLessThan(24)
    }
    const after = new THREE.Box3().setFromObject(ctx.root, true)
    expect(before.min.distanceTo(after.min)).toBeLessThan(0.00001)
    expect(before.max.distanceTo(after.max)).toBeLessThan(0.00001)
    ctx.root.traverse((part) => {
      const mesh = part as THREE.Mesh
      if (!mesh.isMesh) return
      expect(Array.from(mesh.geometry.attributes.position.array).every(Number.isFinite)).toBe(true)
    })
  })

  it('fits each guardian’s actual anatomy inside its authored floor/ceiling envelope', () => {
    for (const [kind, presentation] of Object.entries(GUARDIAN_PRESENTATION)) {
      const ctx = context()
      for (const build of builders) build(seen(kind as ApparitionKind), ctx)
      const bounds = new THREE.Box3().setFromObject(ctx.root, true)
      expect.soft(bounds.min.y, `${kind}: floor`).toBeGreaterThanOrEqual(presentation.bottom - 0.01)
      expect
        .soft(bounds.max.y, `${kind}: ceiling`)
        .toBeLessThanOrEqual(presentation.bottom + presentation.height + 0.01)
    }
  })

  it('makes Without You the same opaque named figure as Kacho', () => {
    const ctx = context()
    buildBasicApparition(seen('double'), ctx)
    const original = buildHumanFigure({
      ...ctx,
      seen: {
        ...seen('avatar'),
        kind: 'avatar',
        size: 0.42,
        human: { role: 'witness', identity: 'prince-kacho', pose: 'idle', aura: 'none' },
      },
    })
    const bounds = new THREE.Box3().setFromObject(ctx.root, true),
      reference = new THREE.Box3().setFromObject(original.root)
    expect(bounds.min.toArray()).toEqual(reference.min.toArray())
    expect(bounds.max.toArray()).toEqual(reference.max.toArray())
    const materials: THREE.Material[] = []
    ctx.root.traverse((part) => {
      const mesh = part as THREE.Mesh
      if (mesh.isMesh)
        materials.push(...(Array.isArray(mesh.material) ? mesh.material : [mesh.material]))
    })
    expect(materials.some((material) => material.opacity === 0.42)).toBe(false)
  })

  it('never gives the third-lie transformation a guessed monster body', () => {
    const ctx = context()
    for (const build of builders) build(seen('monster'), ctx)
    expect(new THREE.Box3().setFromObject(ctx.root, true).isEmpty()).toBe(true)
  })
})

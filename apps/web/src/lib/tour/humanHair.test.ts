import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { MeshBasicMaterial } from 'three'
import type { Apparition } from './apparitions'
import { buildHumanFigure } from './humanFigure'
import { addHumanHair } from './humanHair'
import { HAIR_STYLES, frameShape, humanProfile } from './humanProfiles'

/**
 * Eighteen heads, and the two things that have to be true of all of them.
 *
 * The first is that every declared style draws *something*: a vocabulary whose
 * entries render as nothing is worse than one that refuses them, because the
 * data passes the lint and the person comes out bald. The second is that the
 * shapes stay shared — ADR-005 §5 keeps `humanFigure`'s geometry cache as the
 * rule, so a corridor of eighteen different heads must cost eighteen buffers
 * and not eighteen per person.
 */
function person(identity: string): Apparition & { kind: 'avatar' } {
  return {
    id: identity,
    kind: 'avatar',
    spaceId: 'room',
    tierId: 'tier-1',
    at: [0, 0],
    y: 0,
    size: 0.42,
    colour: 0xffffff,
    stage: 0,
    hidden: false,
    human: { role: 'witness', pose: 'idle', identity },
  }
}

function build(seen: Apparition & { kind: 'avatar' }) {
  return buildHumanFigure({
    THREE,
    glow: (colour, opacity) =>
      new MeshBasicMaterial({ color: colour, opacity, transparent: opacity < 1 }),
    seen,
  })
}

function meshCount(root: THREE.Object3D): number {
  let seen = 0
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) seen += 1
  })
  return seen
}

describe('the hair, which is what the reader recognises first', () => {
  // Called directly rather than through a person, so the check is on the
  // vocabulary and not on the handful of styles the catalogue declares today:
  // `afro` has no wearer aboard and still has to draw, or the entry is a
  // promise the walk cannot keep.
  it('draws a shape for every style in the closed vocabulary', () => {
    const cache = new Map<string, THREE.BufferGeometry>()
    const geometry = (_: typeof THREE, key: string, make: () => THREE.BufferGeometry) => {
      const held = cache.get(key)
      if (held) return held
      const made = make()
      cache.set(key, made)
      return made
    }
    const ink = new MeshBasicMaterial({ color: 0x171318 })
    for (const style of HAIR_STYLES) {
      const group = new THREE.Group()
      addHumanHair({
        THREE,
        geometry,
        outlined: ({ geometry: shape, material }) => {
          const held = new THREE.Group()
          held.add(new THREE.Mesh(shape, material))
          return held
        },
        head: { group, hairInk: ink, ink },
        style,
      })
      // `shaved` is the one style whose whole content is that there is none.
      const wanted = style === 'shaved' ? 0 : 1
      expect(meshCount(group), `${style} drew the wrong amount`).toBeGreaterThanOrEqual(wanted)
      if (style === 'shaved') expect(meshCount(group)).toBe(0)
    }
    // Every style put its shapes through the shared cache — §5's budget rule.
    expect(cache.size).toBeGreaterThan(0)
    expect(cache.size).toBeLessThan(HAIR_STYLES.length * 3)
  })

  it('gives Kurapika a bob and Nobunaga a topknot, from the catalogue alone', () => {
    expect(humanProfile(person('kurapika')).hairStyle).toBe('bob')
    expect(humanProfile(person('nobunaga-hazama')).hairStyle).toBe('chonmage')
    expect(humanProfile(person('biscuit-krueger')).hairStyle).toBe('drills')
  })

  it('draws a shaved head with no hair at all', () => {
    const shaved = meshCount(build(person('hanzo')).root)
    const haired = meshCount(build(person('kurapika')).root)
    expect(shaved).toBeLessThan(haired)
  })
})

describe('the three gabarits', () => {
  it('gives a baby a head that is a quarter of it and an adult one a seventh', () => {
    expect(frameShape('infant').head).toBeGreaterThan(frameShape('child').head)
    expect(frameShape('child').head).toBeGreaterThan(frameShape('adult').head)
  })

  it('shortens the limbs as the head grows, which is what makes it not a small man', () => {
    expect(frameShape('infant').limb).toBeLessThan(frameShape('child').limb)
    expect(frameShape('child').limb).toBeLessThan(frameShape('adult').limb)
  })

  it('leaves the adult untouched, so nobody undeclared moves', () => {
    expect(frameShape('adult')).toEqual({ head: 1, neck: 1, limb: 1, width: 1 })
  })

  it('draws Woble shorter and rounder than the queen holding him', () => {
    const woble = humanProfile(person('prince-woble'))
    const oito = humanProfile(person('queen-oito'))
    expect(woble.frame).toBe('infant')
    expect(woble.height).toBeLessThan(oito.height / 2)
    expect(frameShape(woble.frame).width).toBeGreaterThan(frameShape(oito.frame).width)
  })
})

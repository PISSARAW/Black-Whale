import { describe, expect, it } from 'vitest'
import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'three'
import * as THREE from 'three'
import { isNenCreatureKind, styleNenCreature } from './nenCreatureFigure'

describe('Nen creature figure', () => {
  it('covers beasts used by the tour and Morena without styling props or people', () => {
    expect(isNenCreatureKind('chimera')).toBe(true)
    expect(isNenCreatureKind('owl')).toBe(true)
    expect(isNenCreatureKind('insect')).toBe(true)
    expect(isNenCreatureKind('tyson-guardian')).toBe(true)
    expect(isNenCreatureKind('wog')).toBe(true)
    expect(isNenCreatureKind('game-card')).toBe(false)
    expect(isNenCreatureKind('dealer')).toBe(false)
    expect(isNenCreatureKind('avatar')).toBe(false)
  })

  it('adds manga ink and a contact shadow to substantial geometry', () => {
    const root = new Group()
    root.add(new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color: 0xffffff })))

    styleNenCreature(THREE, root, { kind: 'cat', size: 1 })

    expect(root.getObjectByName('nen-creature-ink')).toBeTruthy()
    expect(root.getObjectByName('contact-shadow')).toBeTruthy()
  })

  it('leaves non-creature manifestations untouched', () => {
    const root = new Group()
    root.add(new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial()))

    styleNenCreature(THREE, root, { kind: 'game-card', size: 1 })

    expect(root.getObjectByName('nen-creature-ink')).toBeUndefined()
  })

  it('keeps ink thin and centred on high facial features after geometry batching', () => {
    const root = new Group()
    const geometry = new BoxGeometry(0.2, 0.2, 0.2).translate(0, 3, 0)
    root.add(new Mesh(geometry, new MeshBasicMaterial()))
    styleNenCreature(THREE, root, { kind: 'halkenburg-guardian', size: 1, shadow: false })
    const edge = root.getObjectByName('nen-creature-ink') as Mesh
    const bounds = new THREE.Box3().setFromObject(edge)
    expect(bounds.getCenter(new THREE.Vector3()).y).toBeCloseTo(3)
    expect(bounds.max.y).toBeLessThan(3.11)
    expect(bounds.min.y).toBeGreaterThan(2.89)
    expect(geometry.attributes.position.getY(0)).toBeCloseTo(3.1)
  })
})

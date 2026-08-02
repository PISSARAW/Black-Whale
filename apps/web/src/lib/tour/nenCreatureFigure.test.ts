import { describe, expect, it } from 'vitest'
import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'three'
import * as THREE from 'three'
import { isNenCreatureKind, styleNenCreature } from './nenCreatureFigure'

describe('Nen creature figure', () => {
  it('covers beasts used by the tour and Morena without styling props or people', () => {
    expect(isNenCreatureKind('chimera')).toBe(true)
    expect(isNenCreatureKind('owl')).toBe(true)
    expect(isNenCreatureKind('insect')).toBe(true)
    expect(isNenCreatureKind('game-card')).toBe(false)
    expect(isNenCreatureKind('dealer')).toBe(false)
    expect(isNenCreatureKind('avatar')).toBe(false)
  })

  it('adds manga ink and a ground wash to substantial geometry', () => {
    const root = new Group()
    root.add(new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color: 0xffffff })))

    styleNenCreature(THREE, root, 'cat', 1)

    expect(root.getObjectByName('nen-creature-ink')).toBeTruthy()
    expect(root.getObjectByName('nen-creature-ground')).toBeTruthy()
  })

  it('leaves non-creature manifestations untouched', () => {
    const root = new Group()
    root.add(new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial()))

    styleNenCreature(THREE, root, 'game-card', 1)

    expect(root.getObjectByName('nen-creature-ink')).toBeUndefined()
  })
})

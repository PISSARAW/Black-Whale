import { describe, expect, it } from 'vitest'
import { MeshBasicMaterial } from 'three'
import * as THREE from 'three'
import type { Apparition } from './apparitions'
import { buildHumanFigure } from './humanFigure'

describe('shared human figure', () => {
  it('draws Morena as one seated silhouette at the negotiation table', () => {
    const seen: Apparition & { kind: 'avatar' } = {
      id: 'morena-dealer-human',
      kind: 'avatar',
      spaceId: 'office',
      tierId: 'interior-heilly-hideout',
      at: [0, 0],
      y: 0,
      size: 0.42,
      colour: 0xd94f68,
      stage: 0,
      hidden: false,
      human: {
        role: 'morena',
        identity: 'morena-prudo',
        pose: 'seated',
        aura: 'none',
      },
    }

    const human = buildHumanFigure({
      THREE,
      glow: (colour, opacity) =>
        new MeshBasicMaterial({ color: colour, opacity, transparent: opacity < 1 }),
      seen,
    })

    expect(human.root.getObjectByName('morena-seated-lap')).toBeTruthy()
    expect(human.root.getObjectByName('morena-standing-gown')).toBeUndefined()
    expect(human.root.getObjectByName('morena-decolletage')).toBeTruthy()
    expect(human.root.getObjectByName('morena-stitch-crown')).toBeTruthy()
    expect(human.root.getObjectByName('morena-scar')).toBeTruthy()
    expect(human.root.getObjectByName('face-eye-left')).toBeTruthy()
    expect(human.root.getObjectByName('face-eye-right')).toBeTruthy()
    expect(human.root.getObjectByName('knee-left')?.rotation.x).toBeCloseTo(Math.PI / 2)
    expect(human.root.getObjectByName('knee-right')?.rotation.x).toBeCloseTo(Math.PI / 2)
  })
})

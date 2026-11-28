import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { buildBasicApparition } from './apparitionBasicView'
import type { HumanLook } from './humanFigure'
import { zhangLeiStaging } from './mangaZhangLeiViews'
import { PUBLIC_WOBLE_ID, WOBLE_ID } from './wobleSwaddle'

const glow = (color: number, opacity: number) => new THREE.MeshBasicMaterial({ color, opacity })

function render(identity: string, pose: NonNullable<HumanLook['human']>['pose']) {
  const root = new THREE.Group()
  const parts = buildBasicApparition(
    {
      id: identity,
      kind: 'avatar',
      spaceId: 'room-1014',
      tierId: 'tier-1',
      at: [0, 0],
      y: 0,
      size: 0.42,
      colour: 0xc6b7a6,
      stage: 0,
      hidden: false,
      human: { identity, role: 'witness', pose, aura: 'none' },
    },
    { THREE, root, glow, skin: glow(0xffffff, 1) },
  )!
  return {
    root,
    near: parts.humanLod!.near,
    far: parts.humanLod!.far,
    animate: parts.humanAnimate!,
  }
}

describe('Woble carried in the Tour', () => {
  it('uses the film head, blanket and pose in the Zhang Lei audience', () => {
    const staging = zhangLeiStaging.find((entry) => entry.characterId === PUBLIC_WOBLE_ID)!
    const film = render(WOBLE_ID, 'held')
    const visit = render(staging.characterId, staging.pose!)
    for (const model of [film, visit]) model.animate(0.9, 'held')

    const blanket = (root: THREE.Object3D) => root.getObjectByName('woble-blanket') as THREE.Mesh
    expect(blanket(visit.near).geometry).toBe(blanket(film.near).geometry)
    expect(blanket(visit.far).geometry).toBe(blanket(visit.near).geometry)
    const head = (model: typeof film) => model.root.getObjectByName(`manga-head:${WOBLE_ID}`)!
    expect(head(visit).scale.toArray()).toEqual(head(film).scale.toArray())
    expect(visit.near.scale.toArray()).toEqual(film.near.scale.toArray())
    expect(visit.near.rotation.z).toBe(1.14)
    expect(visit.far.rotation.z).toBe(1.14)
  })

  it('keeps the nephew’s romper in the idle pose', () => {
    const { root } = render(PUBLIC_WOBLE_ID, 'idle')
    expect(root.getObjectByName('fake-woble-baby-romper')).toBeTruthy()
    expect(root.getObjectByName('woble-blanket')).toBeUndefined()
  })
})

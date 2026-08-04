import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { MeshBasicMaterial } from 'three'
import type { Apparition } from './apparitions'
import { buildHumanFigure } from './humanFigure'
import { addHumanSignatures } from './humanSignature'
import { SIGNATURES } from './humanProfiles'

/**
 * Annexe B on the rig.
 *
 * The point of a closed vocabulary is that a declared piece is drawn and an
 * undeclared body wears none, so both halves are asserted here: every entry in
 * the list produces geometry, and a guard nobody wrote down comes out with
 * exactly what they came out with before ADR-005.
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
    human: { role: 'guard', pose: 'idle', identity },
  }
}

function build(identity: string) {
  return buildHumanFigure({
    THREE,
    glow: (colour, opacity) =>
      new MeshBasicMaterial({ color: colour, opacity, transparent: opacity < 1 }),
    seen: person(identity),
  })
}

describe('the signature pieces', () => {
  it('draws something for every piece of the closed vocabulary', () => {
    const paint = new MeshBasicMaterial({ color: 0x171318 })
    for (const piece of SIGNATURES) {
      const figure = new THREE.Group()
      const head = new THREE.Group()
      const rightHand = new THREE.Group()
      figure.add(head, rightHand)
      addHumanSignatures({
        THREE,
        geometry: (_, __, make) => make(),
        parts: { figure, head, rightHand },
        materials: { ink: paint, skin: paint, accent: paint, cloth: paint, dark: paint },
        worn: { signatures: [piece], attire: 'civilian' },
      })
      let drawn = 0
      figure.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) drawn += 1
      })
      expect(drawn, `${piece} drew nothing`).toBeGreaterThan(0)
    }
  })

  it('puts the diadem on Camilla and nothing on the guard beside her', () => {
    expect(build('prince-camilla').root.getObjectByName('signature-tiara')).toBeTruthy()
    expect(build('a-guard-nobody-drew').root.getObjectByName('signature-tiara')).toBeUndefined()
  })

  it('gives the acceptance scene the faces it names', () => {
    // ADR-005 §6, read off the rig: the crown and beard in the King's Living
    // Quarters, the cross on the forehead in the Troupe's corridor, the star
    // and the tear on a man who is aboard behind a borrowed face.
    expect(build('nasubi-hui-guo-rou').root.getObjectByName('signature-crown')).toBeTruthy()
    expect(build('nasubi-hui-guo-rou').root.getObjectByName('signature-beard')).toBeTruthy()
    expect(build('chrollo-lucilfer').root.getObjectByName('signature-forehead-cross')).toBeTruthy()
    expect(build('hisoka').root.getObjectByName('signature-star')).toBeTruthy()
    expect(build('hisoka').root.getObjectByName('signature-tear')).toBeTruthy()
  })

  it('builds Kurapika a chain and leaves it out of the corridor', () => {
    const chain = build('kurapika').root.getObjectByName('signature-chain-0')
    expect(chain).toBeTruthy()
    expect(chain?.visible).toBe(false)
  })

  it('hangs the chain on the right hand, which is where the panel puts it', () => {
    const hand = build('kurapika').root.getObjectByName('hand-right')
    expect(hand?.getObjectByName('signature-chain-0')).toBeTruthy()
  })

  it('dresses the two nobody could reach through a role', () => {
    expect(build('prince-zhanglei').root.getObjectByName('attire-changshan')).toBeTruthy()
    expect(build('nobunaga-hazama').root.getObjectByName('attire-kimono')).toBeTruthy()
    expect(build('nobunaga-hazama').root.getObjectByName('attire-obi')).toBeTruthy()
  })

  it('leaves an undeclared body wearing nothing from annexe B', () => {
    const anonymous = build('a-guard-nobody-drew').root
    for (const piece of SIGNATURES) {
      expect(anonymous.getObjectByName(`signature-${piece}`)).toBeUndefined()
    }
  })
})

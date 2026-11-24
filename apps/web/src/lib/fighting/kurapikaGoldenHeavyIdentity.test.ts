import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createFightState } from './fightState'
import {
  animateKurapikaGoldenHeavyIdentity,
  goldenHeavySecondary,
} from './kurapikaGoldenHeavyIdentity'

function attacking(frame: number) {
  const fighter = createFightState('kurapika', 'hisoka').player
  fighter.attack = {
    moveId: 'kurapika:standingHeavy',
    variant: 'standing',
    kind: 'heavy',
    frame,
    impacted: false,
    auraCharged: false,
    concealed: false,
    hatsuSource: null,
    projectileSpawned: false,
    reversal: false,
  }
  return fighter
}

describe('Kurapika golden heavy identity', () => {
  it('lags chain and lapels after contact, then settles deterministically', () => {
    const load = goldenHeavySecondary(4)
    const contact = goldenHeavySecondary(8)
    const release = goldenHeavySecondary(15)
    expect(load.chainLag).toBeLessThan(0)
    expect(contact.chainLag).toBeGreaterThan(0)
    expect(release.guardTension).toBeLessThan(contact.guardTension)
    expect(goldenHeavySecondary(15)).toEqual(release)
  })

  it('reveals, animates and restores the existing signature chain', () => {
    const figure = new THREE.Group()
    const chain = new THREE.Group()
    chain.name = 'signature-chain-2'
    chain.visible = false
    figure.add(chain)
    const rest = chain.rotation.z
    animateKurapikaGoldenHeavyIdentity(figure, attacking(8))
    expect(chain.visible).toBe(true)
    expect(chain.rotation.z).not.toBe(rest)

    animateKurapikaGoldenHeavyIdentity(figure, { ...attacking(8), attack: null })
    expect(chain.visible).toBe(false)
    expect(chain.rotation.z).toBe(rest)
  })
})

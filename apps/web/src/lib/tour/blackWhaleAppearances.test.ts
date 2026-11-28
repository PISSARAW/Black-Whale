import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildHumanFigure, type HumanLook } from './humanFigure'
import { humanProfile } from './humanProfiles'

const glow = (color: number, opacity: number) => new THREE.MeshBasicMaterial({ color, opacity })

function appearance(
  identity: string,
  details?: Partial<NonNullable<HumanLook['human']>>,
): HumanLook {
  return {
    id: identity,
    kind: 'avatar',
    spaceId: 'cineplex',
    tierId: 'tier-3',
    at: [0, 0],
    y: 0,
    size: 0.42,
    colour: 0xffffff,
    stage: 0,
    hidden: false,
    human: { role: 'witness', pose: 'idle', identity, ...details },
  }
}

describe('Black Whale chapter-specific appearances', () => {
  it('renders Bonolenov’s disguises without replacing Hisoka’s appearance', () => {
    const falseHisoka = appearance('bonolenov-ndongo', { bonolenovDisguise: 'hisoka' })
    const disguisedRoot = buildHumanFigure({ THREE, glow, seen: falseHisoka }).root
    expect(disguisedRoot.getObjectByName('bonolenov-disguise-high-collar')).toBeDefined()
    expect(disguisedRoot.getObjectByName('hisoka-pendant')).toBeUndefined()
    const hisoka = appearance('hisoka', { bonolenovDisguise: 'hisoka' })
    expect(humanProfile(hisoka)).toBe(humanProfile(appearance('hisoka')))
    expect(
      buildHumanFigure({ THREE, glow, seen: hisoka }).root.getObjectByName('hisoka-pendant'),
    ).toBeDefined()
    const falseLynch = appearance('bonolenov-ndongo', { bonolenovDisguise: 'lynch' })
    expect(humanProfile(falseLynch)).toBe(humanProfile(appearance('lynch-fullbokko')))
    expect(humanProfile(appearance('bonolenov-ndongo')).likeness).toBe('bonolenov-ndongo')
  })

  it('keeps both of Ken’i Wang’s suits', () => {
    const striped = buildHumanFigure({ THREE, glow, seen: appearance('keni-wang') }).root
    expect(striped.getObjectByName('keni-pinstripe-suit')).toBeDefined()
    const darkSuit = appearance('keni-wang', { plainSuit: true })
    expect(
      buildHumanFigure({ THREE, glow, seen: darkSuit }).root.getObjectByName('keni-pinstripe-suit'),
    ).toBeUndefined()
  })
})

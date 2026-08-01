import { afterEach, describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import {
  activateHatsu,
  activeHatsu,
  closeHatsuGate,
  deactivateHatsu,
  hatsuGate,
  hatsuIsBlocked,
  openHatsuGate,
} from './hatsuState'
import { HATSU_PROFILES, hatsuById } from './hatsuRegistry'
import { TABLE_KINDS, worksAtTheTable } from '$lib/tour/morena'

/**
 * The gate: rooms that only some techniques work in.
 *
 * Morena's table is the first of them, and the rule it wants is narrow — stop
 * the visitor picking up an aura that has nothing to do with twelve cards
 * while a hand is live, and leave everything else alone. These tests pin both
 * halves, because a gate that quietly took the technique out of somebody's
 * hands would be a worse bug than no gate at all.
 */

const table = { admits: worksAtTheTable, reason: 'A hand is in play.' }

afterEach(() => {
  closeHatsuGate()
  deactivateHatsu()
})

describe('a room that only admits some techniques', () => {
  it('lets anything through when no room has asked for one', () => {
    expect(get(hatsuGate)).toBeNull()
    for (const profile of HATSU_PROFILES) expect(hatsuIsBlocked(profile)).toBe(false)
  })

  it('turns away exactly the kinds the room does not admit', () => {
    openHatsuGate(table)
    const blocked = HATSU_PROFILES.filter((profile) => hatsuIsBlocked(profile))
    const admitted = HATSU_PROFILES.filter((profile) => !hatsuIsBlocked(profile))

    expect(admitted.length).toBeGreaterThan(0)
    expect(blocked.length).toBeGreaterThan(admitted.length)
    for (const profile of admitted) expect(TABLE_KINDS).toContain(profile.kind)
    for (const profile of blocked) expect(TABLE_KINDS).not.toContain(profile.kind)
  })

  it('refuses to activate a technique the room turns away', () => {
    const fists = HATSU_PROFILES.find((profile) => !worksAtTheTable(profile.kind))!
    openHatsuGate(table)

    expect(activateHatsu(fists)).toBe(false)
    expect(get(activeHatsu)).toBeNull()
  })

  it('still activates one the room admits', () => {
    const seated = HATSU_PROFILES.find((profile) => worksAtTheTable(profile.kind))!
    openHatsuGate(table)

    expect(activateHatsu(seated)).toBe(true)
    expect(get(activeHatsu)?.id).toBe(seated.id)
  })

  it('leaves in hand what was already in hand', () => {
    // The whole of the rule: the gate is on picking up, not on carrying. A
    // visitor who walks in with Bungee Gum keeps it and is told it is idle.
    const fists = HATSU_PROFILES.find((profile) => !worksAtTheTable(profile.kind))!
    expect(activateHatsu(fists)).toBe(true)

    openHatsuGate(table)
    expect(get(activeHatsu)?.id).toBe(fists.id)
    expect(hatsuIsBlocked(get(activeHatsu)!)).toBe(true)
  })

  it('opens again the moment the room lets go of it', () => {
    const fists = HATSU_PROFILES.find((profile) => !worksAtTheTable(profile.kind))!
    openHatsuGate(table)
    expect(activateHatsu(fists)).toBe(false)

    closeHatsuGate()
    expect(activateHatsu(fists)).toBe(true)
    expect(get(activeHatsu)?.id).toBe(fists.id)
  })

  it('holds against an activation that did not come from the dock', () => {
    // `black-whale:activate-hatsu` is fired by links and by other panels, and
    // it resolves an id through the same door — which is why the check lives
    // in `activateHatsu` rather than in the picker's markup.
    openHatsuGate(table)
    const fromALink = hatsuById(HATSU_PROFILES.find((p) => !worksAtTheTable(p.kind))!.id)!

    expect(activateHatsu(fromALink)).toBe(false)
    expect(get(activeHatsu)).toBeNull()
  })
})

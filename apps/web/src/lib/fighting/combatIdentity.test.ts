import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from './engine'
import { combatIdentityOf, combatMindControlsBody } from './combatIdentity'
import { captureDolphinAura } from './dolphinAura'

describe('combat identity graph', () => {
  it('separates body, mind, Nen and Hatsu ownership for execution adapters', () => {
    const ordinary = beginFight(createFight('chrollo', 'hisoka')).player
    expect(combatIdentityOf(ordinary, 'player')).toMatchObject({
      mindId: 'mind:chrollo',
      controllerSide: 'player',
      nenOwnerId: 'chrollo',
      hatsuOwnerId: 'chrollo',
      originBodyId: 'chrollo',
    })

    const copied = { ...ordinary, id: 'hisoka' as const, nenOwner: 'chrollo' as const }
    expect(combatIdentityOf(copied)).toMatchObject({
      bodyId: 'body:chrollo:0',
      mindId: 'mind:chrollo',
      nenOwnerId: 'chrollo',
      hatsuOwnerId: 'hisoka',
    })
  })

  it('keeps Halkenburg host bodies and Hanzo projections distinct from their minds', () => {
    const base = beginFight(createFight('halkenburg', 'hanzo'))
    const transferred = {
      ...base.player,
      id: 'hisoka' as const,
      halkenburgOrigin: 'halkenburg' as const,
      halkenburgTransferFrame: 42,
    }
    expect(combatIdentityOf(transferred, 'player')).toMatchObject({
      bodyId: 'body:hisoka:42',
      mindId: 'mind:halkenburg',
      nenOwnerId: 'hisoka',
      originBodyId: 'halkenburg',
    })
    const projected = {
      ...base.opponent,
      hanzoProjection: {
        bodyX: base.opponent.x,
        bodyFacing: base.opponent.facing,
        bodyNen: base.opponent.nen,
        startupFrames: 0,
      },
    }
    const identity = combatIdentityOf(projected, 'opponent')
    expect(identity.avatarId).toBe('projection:hanzo')
    expect(identity.avatarId).not.toBe(identity.bodyId)
  })

  it('marks borrowed Dolphin aura without assigning it to the borrowed Hatsu', () => {
    const actor = beginFight(createFight('kurapika', 'hisoka')).player
    const supply = { ...captureDolphinAura(actor), amount: 20 }
    const borrowed = {
      ...actor,
      id: 'hisoka' as const,
      nenOwner: 'kurapika' as const,
      dolphinExecution: {
        supply,
        ownAura: actor.aura,
        ownExhausted: false,
        ownNen: actor.nen,
        borrowedTen: true,
      },
    }
    expect(combatIdentityOf(borrowed)).toMatchObject({
      nenOwnerId: 'kurapika',
      hatsuOwnerId: 'hisoka',
      borrowedAura: true,
    })
    expect(
      combatMindControlsBody({
        ...borrowed,
        arsenalSleep: { owner: 'player', cause: 'cookie' },
      }),
    ).toBe(false)
  })
})

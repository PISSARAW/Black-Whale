import { describe, it, expect } from 'vitest'
import { createFight, performMove, performAttack } from './engine'
import { multiCommand, multiFrames } from './fourCombatTestKit'
import { hatsuFor } from './hatsu'
import { resolveFightImpacts } from './combatImpact'
import { resolveFightOutcome } from './fightOutcome'
import { reconcileHalkenburgSouls, advanceHalkenburgSouls } from './halkenburgSouls'
import { SOUL_SLEEP_FRAMES, SOUL_SEDATIVE_FRAMES } from './halkenburgSoulActions'
import { canAct } from './fightActorState'
import { voluntaryNenAvailable } from './nenAccess'
import { halkenburgMode } from './halkenburgSoulTypes'

import { soulDuel, soulShot, soulHit } from './halkenburgSoulTestKit'

describe('Halkenburg: two selectable rulesets and material consciousness transfer', () => {
  it('defaults to the requested roster variant and refuses its direct transformation in mind mode', () => {
    const s = soulDuel()
    expect(halkenburgMode(createFight('halkenburg', 'benjamin'), 'player')).toBe('roster')
    expect(halkenburgMode(s, 'player')).toBe('souls')
    expect(multiCommand(s, { action: 'halkenburg-transfer' })).toBe(s)
    const variant = multiCommand(s, { action: 'halkenburg-mode', target: 'roster' })
    expect(halkenburgMode(variant, 'player')).toBe('roster')
    expect(multiCommand(variant, { action: 'halkenburg-mode', target: 'fake' })).toBe(variant)
  })
  it.each(['player', 'opponent'] as const)(
    'moves the two actual bodies to their mind’s control seats without healing (%s)',
    (side) => {
      const base = soulDuel(side),
        other = side === 'player' ? 'opponent' : 'player'
      const s = soulHit(base, true, side)
      expect(s[side].id).toBe('benjamin')
      expect(s[side].health).toBe(base[other].health)
      expect(s[side].aura).toBe(base[other].aura)
      expect(s[side].x).toBe(base[other].x)
      expect(s[other].id).toBe('halkenburg')
      expect(s[other].health).toBe(base[side].health)
      expect(s[other].halkSoulSleep).toBe(true)
      expect(s[side].halkSoul?.mind?.identity).toBe('halkenburg')
      expect(s[other].halkSoul?.mind?.identity).toBe('benjamin')
      expect(s.score).toEqual(base.score)
      expect(s.rosterGuests).toBeUndefined()
    },
  )
  it('keeps the mode and participant on the released shot and refuses mid-flight changes', () => {
    const s = soulShot()
    expect(s.projectiles[0].halkenburgArrow).toMatchObject({
      mode: 'souls',
      participant: 'self:player',
    })
    expect(
      multiCommand(
        { ...s, player: { ...s.player, attack: null } },
        { action: 'halkenburg-mode', target: 'roster' },
      ).halkenburgModes?.player,
    ).toBe('souls')
  })
  it('distinguishes both material bodies even in a Halkenburg mirror match', () => {
    const base = soulDuel(),
      other = createFight('halkenburg', 'halkenburg').opponent,
      s = soulHit({ ...base, opponent: { ...other, x: 65, health: 47 } })
    expect(s.player.halkSoul?.key).not.toBe(s.opponent.halkSoul?.key)
    expect(s.player.x).toBe(65)
    expect(s.player.health).toBe(47)
    expect(s.opponent.halkSoulSleep).toBe(true)
  })
  it.each(['dead-archer', 'absent-supporter', 'controlled-target'] as const)(
    'refuses an impact whose committed participants are no longer eligible (%s)',
    (reason) => {
      let s = soulShot(soulDuel(), reason !== 'absent-supporter')
      if (reason === 'dead-archer') s = { ...s, player: { ...s.player, health: 0 } }
      if (reason === 'absent-supporter')
        s = {
          ...s,
          battlefield: {
            ...s.battlefield!,
            entities: s.battlefield!.entities.map((entity) =>
              entity.id === s.player.halkenburgSupporter ? { ...entity, present: false } : entity,
            ),
          },
        }
      if (reason === 'controlled-target')
        s = {
          ...s,
          opponent: {
            ...s.opponent,
            hatsuEffects: { ...s.opponent.hatsuEffects, manipulatedFrames: 100 },
          },
        }
      const result = resolveFightImpacts(s, [
        { projectile: s.projectiles[0], defenderSide: 'opponent', position: { x: 65, y: 6 } },
      ])
      expect(result.halkSoulLinks).toBeUndefined()
      expect(result.opponent.id).toBe('benjamin')
    },
  )
  it('does not transfer through a generic Hatsu carrier contact or material dead body', () => {
    const s = soulDuel()
    expect(
      hatsuFor('halkenburg').onImpact({
        state: s,
        side: 'player',
        defenderSide: 'opponent',
        source: 'halkenburg',
        blocked: false,
        concealed: false,
      }),
    ).toBe(s)
    const shot = soulShot(),
      dead = { ...shot, opponent: { ...shot.opponent, health: 0 } }
    const bullet = dead.projectiles[0]
    const result = resolveFightImpacts(dead, [
      { projectile: bullet, defenderSide: 'opponent', position: { x: 65, y: 6 } },
    ])
    expect(result.halkSoulLinks).toBeUndefined()
  })
  it('prevents the sleeping mind from moving, guarding or attacking and grants no host Hatsu', () => {
    const s = soulHit()
    expect(canAct(s.opponent)).toBe(false)
    expect(performAttack(s, 'opponent', 'light')).toBe(s)
    expect(performMove({ state: s, side: 'player', action: 'special' })).toBe(s)
    expect(voluntaryNenAvailable(s.player)).toBe(false)
    expect(voluntaryNenAvailable(s.player, { requireHatsu: false })).toBe(true)
    const moved = multiFrames(s, 3, { right: true })
    expect(moved.opponent.x).toBe(s.opponent.x)
    expect(moved.player.x).toBeGreaterThan(s.player.x)
  })
  it('swaps wakefulness on voluntary sleep and restores priority when that sleep ends', () => {
    let s = soulHit()
    s = multiCommand(s, { action: 'halkenburg-sleep' })
    expect(s.player.halkSoulSleep).toBe(true)
    expect(s.opponent.halkSoulSleep).toBe(false)
    expect(canAct(s.opponent)).toBe(true)
    for (let n = 0; n < SOUL_SLEEP_FRAMES; n++) s = advanceHalkenburgSouls(s)
    expect(s.player.halkSoulSleep).toBe(false)
    expect(s.opponent.halkSoulSleep).toBe(true)
  })
  it('promotes the selected real supporter rather than drawing a fighter or keeping a 120-frame stun', () => {
    const base = soulDuel(),
      s = soulHit(base, false)
    const link = s.halkSoulLinks![0],
      guest = s.rosterGuests!.find((g) => g.role === 'soul')!
    expect(s.player.id).toBe('halkenburg')
    expect(s.opponent.halkCohortBody).toBeDefined()
    expect(s.opponent.halkSoulSleep).toBe(true)
    expect(s.opponent.weaponsConfiscated).toBe(true)
    expect(s.battlefield!.entities.find((e) => `entity:${e.id}` === link.sourceBody)?.present).toBe(
      false,
    )
    expect(guest.fighter.id).toBe('benjamin')
    expect(guest.owner).toBe('player')
    expect(guest.fighter.health).toBe(base.opponent.health)
    expect(guest.fighter.halkForeignMind).toBe(true)
    expect(multiFrames(s, 130).opponent.halkSoulSleep).toBe(true)
  })
  it('lets a consenting allied mind obey a nearby audible sleep order, without commanding the enemy mind', () => {
    let s = soulHit(soulDuel(), false)
    const command = { action: 'halkenburg-sleep' as const, target: 'ally:1' }
    expect(multiCommand(s, command)).toBe(s)
    s = { ...s, player: { ...s.player, x: 60, attack: null } }
    const asleep = multiCommand(s, command)
    expect(asleep.opponent.halkSoulSleep).toBe(false)
    expect(asleep.rosterGuests!.find((g) => g.role === 'soul')!.fighter.halkSoulSleep).toBe(true)
    expect(multiCommand(s, { ...command, target: 'ally:999' })).toBe(s)
  })
})

describe('Halkenburg: body death, priority and the chapter 404 scenario', () => {
  it('returns the victim’s mind to its own surviving body when the original source body dies', () => {
    const s = soulHit(),
      dead = { ...s, opponent: { ...s.opponent, health: 0 } }
    const restored = resolveFightOutcome(dead)
    expect(restored.phase).toBe('fighting')
    expect(restored.halkSoulLinks![0].phase).toBe('cohabiting')
    expect(restored.opponent.id).toBe('benjamin')
    expect(restored.opponent.halkSoul?.mind?.identity).toBe('benjamin')
    expect(restored.opponent.halkSoulSleep).toBe(false)
    expect(restored.player.health).toBe(0)
    expect(restored.player.halkSoulAlive).toBe(true)
    expect(restored.opponent.health).toBe(s.player.health)
  })
  it('does not revive the source mind when the occupied body dies first', () => {
    const s = soulHit(),
      dead = { ...s, player: { ...s.player, health: 0 } }
    const result = resolveFightOutcome(dead)
    expect(result.winner).toBe('opponent')
    expect(result.halkSoulLinks![0].phase).toBe('source-lost')
    expect(result.opponent.id).toBe('halkenburg')
    expect(result.opponent.halkSoul?.mind?.identity).toBe('benjamin')
    expect(result.opponent.halkSoulSleep).toBe(false)
    expect(result.player.halkSoulAlive).toBe(false)
  })
  it('loses both remaining minds if the shared surviving body is destroyed', () => {
    let s = soulHit()
    s = resolveFightOutcome({ ...s, opponent: { ...s.opponent, health: 0 } })
    s = resolveFightOutcome({ ...s, opponent: { ...s.opponent, health: 0 } })
    expect(s.winner).toBe('draw')
    expect(s.player.halkSoulAlive).toBe(false)
    expect(s.opponent.halkSoulAlive).toBe(false)
  })
  it('requires a physical scenario premise for the prepared sedative and consumes it once', () => {
    const s = soulHit()
    const absent = {
      ...s,
      environment: {
        ...s.environment,
        preparation: { ...s.environment.preparation!, resources: [] },
      },
    }
    expect(multiCommand(absent, { action: 'halkenburg-sedative' })).toBe(absent)
    let prepared = multiCommand(s, { action: 'halkenburg-sedative' })
    expect(prepared.player.halkSedativeSpent).toBe(true)
    prepared = advanceHalkenburgSouls(prepared)
    expect(prepared.halkSoulLinks![0].preparedSedative).toBe(SOUL_SEDATIVE_FRAMES - 1)
    const returned = resolveFightOutcome({
      ...prepared,
      opponent: { ...prepared.opponent, health: 0 },
    })
    expect(returned.player.id).toBe('benjamin')
    expect(returned.player.halkSoul?.mind?.identity).toBe('halkenburg')
    expect(returned.player.halkSoulSleep).toBe(false)
    expect(returned.opponent.halkSoulAlive).toBe(true)
    let expired = returned
    for (let n = 0; n < SOUL_SEDATIVE_FRAMES; n++) expired = advanceHalkenburgSouls(expired)
    expect(expired.opponent.id).toBe('benjamin')
    expect(expired.opponent.halkSoul?.mind?.identity).toBe('benjamin')
  })
  it('settles real corpse damage before victory instead of resurrecting an empty control seat', () => {
    const s = soulHit()
    const next = reconcileHalkenburgSouls({ ...s, opponent: { ...s.opponent, health: 0 } })
    expect(reconcileHalkenburgSouls(next)).toEqual(next)
    expect(next.player.health).toBe(0)
    expect(next.opponent.health).toBe(s.player.health)
  })
})

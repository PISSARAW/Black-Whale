import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, performMove } from './engine'
import { multiDuel, multiCommand, multiActive } from './fourCombatTestKit'
import { createFightEnvironment } from './fightEnvironment'
import { advanceBlinkyEvidence } from './blinkyEvidence'
import { advanceBlinky } from './blinkyFrames'
import { advanceTserriednichGuardian, resolveGuardianLie } from './tserriednichGuardian'
import { privatePvpState } from './pvp/view'
import { hatsuFor } from './hatsu'
import { readyCohort } from './preparationWorld'
import { COHORT_WILL_FRAMES } from './hatsu/halkenburg'
import { activeHitbox } from './frameData'
import { advanceProjectiles } from './projectiles'
import { resolveFightImpacts } from './combatImpact'
import { prepareDefence } from './combatDefence'
import type { FightState } from './types'

function corpseDuel() {
  const environment = createFightEnvironment({
    preparation: { mode: 'scenario', resources: ['corpses'], cohorts: [] },
  })
  let s = beginFight(
    createFight('shizuku', 'illumi', { mode: 'versus-local', formatId: 'knockout', environment }),
  )
  s = { ...s, player: { ...s.player, x: 20, aura: 100 }, opponent: { ...s.opponent, x: 75 } }
  return s
}
function bowDuel(): FightState {
  const environment = createFightEnvironment({
    preparation: { mode: 'scenario', resources: [], cohorts: ['player'] },
  })
  const s = beginFight(
    createFight('halkenburg', 'benjamin', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment,
    }),
  )
  return {
    ...s,
    player: {
      ...s.player,
      x: 25,
      aura: 100,
      hatsuEffects: { ...s.player.hatsuEffects, cohortWillFrames: COHORT_WILL_FRAMES },
    },
    opponent: { ...s.opponent, x: 65 },
  }
}
describe('four-plus encounters: evidence, guardian and group arrow', () => {
  it('removes a real dead body and restores that same body through Blinky’s last-object command', () => {
    let s = corpseDuel()
    const body = s.battlefield!.entities.find((e) => e.kind === 'corpse')!
    s = multiCommand(s, { action: 'blinky-evidence', target: body.id })
    expect(s.player.blinkyEvidence?.target).toBe(body.id)
    expect(s.battlefield!.entities.find((e) => e.id === body.id)?.present).toBe(true)
    for (let n = 0; n < 24; n++) s = advanceBlinkyEvidence(s)
    expect(s.battlefield!.entities.find((e) => e.id === body.id)?.present).toBe(false)
    expect(s.player.blinky?.lastArenaObject).toBe(body.id)
    s = { ...s, player: { ...s.player, arenaRecovery: 0 } }
    s = performAuraAttack({
      state: s,
      side: 'player',
      kind: 'special',
      moveId: 'shizuku:backSpecial',
      auraCharged: false,
    })
    s = advanceBlinky(multiActive(s))
    expect(s.battlefield!.entities.find((e) => e.id === body.id)).toMatchObject({
      present: true,
      kind: 'corpse',
    })
    expect(s.player.blinky?.lastArenaObject).toBeUndefined()
  })
  it('rejects living subjects and Nen copies, and interrupts corpse suction on damage or loss of Nen', () => {
    const base = corpseDuel(),
      body = base.battlefield!.entities.find((e) => e.kind === 'corpse')!
    for (const change of [{ kind: 'hostage' as const }, { material: 'nen' as const }]) {
      const s = {
        ...base,
        battlefield: {
          ...base.battlefield!,
          entities: base.battlefield!.entities.map((e) =>
            e.id === body.id ? { ...e, ...change } : e,
          ),
        },
      }
      expect(multiCommand(s, { action: 'blinky-evidence', target: body.id })).toBe(s)
    }
    const pending = multiCommand(base, { action: 'blinky-evidence', target: body.id })
    for (const change of [
      { hitStun: 1 },
      { health: pending.player.health - 1 },
      { hatsuEffects: { ...pending.player.hatsuEffects, forcedZetsuFrames: 30 } },
    ]) {
      const s = advanceBlinkyEvidence({ ...pending, player: { ...pending.player, ...change } })
      expect(s.player.blinkyEvidence).toBeUndefined()
      expect(s.battlefield!.entities.find((e) => e.id === body.id)?.present).toBe(true)
    }
  })
  it('makes only deliberate lies produce the shown nonfatal mark and private second warning', () => {
    let s = multiDuel('theta', 'tserriednich')
    s = { ...s, opponent: { ...s.opponent, x: 34 } }
    expect(resolveGuardianLie(s, 'player', false)).toBe(s)
    s = multiCommand(s, { action: 'guardian-answer', target: 'lie' })
    expect(s.player.guardianWarnings?.count).toBe(1)
    expect(s.player.openWounds).toBe(1)
    const health = s.player.health
    s = multiCommand(s, { action: 'guardian-answer', target: 'lie' })
    expect(s.player.guardianWords?.text).toContain('deuxième')
    expect(privatePvpState(s, 'opponent').opponent.guardianWords).toBeUndefined()
    s = resolveGuardianLie(s, 'player', true)
    expect(s.player.guardianWarnings?.count).toBe(2)
    expect(s.player.health).toBe(health)
    const zetsu = {
      ...s,
      opponent: { ...s.opponent, nen: { ...s.opponent.nen, mode: 'zetsu' as const } },
    }
    expect(resolveGuardianLie(zetsu, 'player', true)).toBe(zetsu)
    const prince = { ...s, player: { ...s.player, id: 'benjamin' as const } }
    expect(resolveGuardianLie(prince, 'player', true)).toBe(prince)
  })
  it('destroys the real hostile Little Eye animal without attacking an ordinary animal', () => {
    const base = multiDuel('tserriednich', 'sayird')
    const entity = {
      id: 'spy',
      kind: 'animal' as const,
      owner: 'neutral' as const,
      material: 'real' as const,
      present: true,
      health: 3,
      x: 32,
      y: 0,
    }
    let s = {
      ...base,
      battlefield: {
        entities: [entity, { ...entity, id: 'ordinary', x: 31 }],
        interactionHeld: { player: false, opponent: false },
        completed: { player: 0, opponent: 0 },
      },
    }
    s = {
      ...s,
      battlefield: {
        ...s.battlefield,
        entities: s.battlefield.entities.map((e) =>
          e.id === 'spy'
            ? { ...e, controller: { side: 'opponent' as const, source: 'sayird' as const } }
            : e,
        ),
      },
    }
    const next = advanceTserriednichGuardian(s)
    expect(next.battlefield!.entities.find((e) => e.id === 'spy')?.present).toBe(false)
    expect(next.battlefield!.entities.find((e) => e.id === 'ordinary')?.present).toBe(true)
  })
  it('includes Halkenburg himself in the real cohort lottery and only shields a drawn arrow', () => {
    const base = bowDuel(),
      choices = new Set<string>()
    expect(readyCohort(base, 'player').length).toBeGreaterThan(0)
    for (let rng = 1; rng < 30; rng++) {
      const s = hatsuFor('halkenburg').onTrigger({
        state: { ...base, rng },
        side: 'player',
        source: 'halkenburg',
      })
      choices.add(s.player.halkenburgSupporter!)
    }
    expect(choices.has('self:player')).toBe(true)
    let s = performMove({ state: base, side: 'player', action: 'special' })
    s = hatsuFor('halkenburg').onFrame(s)
    expect(s.player.halkenburgGroupProtection).toBe(true)
    expect(
      prepareDefence(s.player, 'torso', {} as Parameters<typeof prepareDefence>[2]).avoided,
    ).toBe(true)
    expect(activeHitbox(multiActive(s).player)).toBeNull()
    s = hatsuFor('halkenburg').onFrame(multiActive(s))
    expect(s.projectiles[0]?.halkenburgArrow).toBeDefined()
    expect(s.player.halkenburgGroupProtection).toBe(false)
  })
  it('lets the real arrow cross cover and guard, with no HP damage or score and the requested body variant', () => {
    const base = bowDuel()
    let s = hatsuFor('halkenburg').onFrame(
      multiActive(performMove({ state: base, side: 'player', action: 'special' })),
    )
    const shot = s.projectiles[0]!
    s = {
      ...s,
      opponent: { ...s.opponent, blocking: true, guardFrames: 30, wakeupInvulnerableFrames: 20 },
      battlefield: {
        ...s.battlefield!,
        entities: [
          ...s.battlefield!.entities,
          {
            id: 'wall',
            kind: 'crate',
            owner: 'neutral',
            material: 'real',
            health: 100,
            present: true,
            x: 45,
            y: 0,
            arena: { width: 6, height: 16 },
          },
        ],
      },
    }
    let hit = false
    for (let n = 0; n < 30 && !hit; n++) {
      const step = advanceProjectiles(s, 1 / 60)
      hit = step.hits.length > 0
      s = resolveFightImpacts(step.state, step.hits)
    }
    expect(hit).toBe(true)
    expect(s.opponent.health).toBe(base.opponent.health)
    expect(s.player.id).not.toBe('halkenburg')
    expect(s.score).toEqual(base.score)
    if (!shot.halkenburgArrow!.participant.startsWith('self:'))
      expect(
        s.battlefield!.entities.find((e) => e.id === shot.halkenburgArrow!.participant)
          ?.sleepingFrames,
      ).toBeGreaterThan(120)
  })
})

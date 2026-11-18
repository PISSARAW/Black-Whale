import type { FightState } from './types'
import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight } from './engine'
import { multiCommand, multiFrames } from './fourCombatTestKit'
import { createFightEnvironment } from './fightEnvironment'
import { advanceMachiCorpses } from './machiCorpses'
import { advanceProjectiles } from './projectiles'
import { resolveFightImpacts } from './combatImpact'
import { createMachiObjectScene } from './machiObjectScene'
import { createReplayRecorder } from './fightReplayRecorder'
import { decodeFightReplay } from './fightReplayCodec'

function scene() {
  const environment = createFightEnvironment({
    preparation: { mode: 'scenario', resources: ['armed-corpses'], cohorts: [] },
  })
  const s = beginFight(
    createFight('machi', 'theta', { mode: 'versus-local', formatId: 'knockout', environment }),
  )
  return { ...s, player: { ...s.player, x: 27, aura: 100 }, opponent: { ...s.opponent, x: 50 } }
}
function recordedScenario(s: ReturnType<typeof scene>) {
  const recorder = createReplayRecorder(s)!
  recorder.append(s, [1 / 60, 0, 0, []], multiFrames(s, 1))
  return recorder.snapshot()
}
function attached(): FightState {
  let s = scene()
  const body = s.battlefield!.entities.find((e) => e.kind === 'corpse')!
  s = multiCommand(s, { action: 'machi-corpse', target: body.id })
  for (let i = 0; i < 24; i++) s = advanceMachiCorpses(s)
  return { ...s, player: { ...s.player, arenaRecovery: 0 } }
}
describe('Machi’s manually operated armed bodies, ch. 97', () => {
  it('suspends the same actual body, draws its physical strings and fires its own finite ammunition', () => {
    let s = attached()
    const id = s.player.corpseStrings![0].id,
      body = s.battlefield!.entities.find((e) => e.id === id)!
    expect(body.controller).toEqual({ side: 'player', source: 'machi' })
    expect(body.y).toBe(2)
    const world = new THREE.Scene(),
      effect = createMachiObjectScene({ THREE, scene: world, worldX: (x) => x, worldY: (y) => y })
    effect.sync(s, 0)
    expect(world.getObjectByName('machi-corpse-thread:player:0')?.visible).toBe(true)
    for (let i = 0; i < 12; i++) {
      s = multiCommand(
        { ...s, player: { ...s.player, arenaRecovery: 0 } },
        { action: 'machi-corpse-fire', target: id },
      )
    }
    expect(s.projectiles).toHaveLength(12)
    expect(s.projectiles[0]).toMatchObject({ corpseGun: id, matter: 'object', nenPower: 1 })
    expect(s.battlefield!.entities.find((e) => e.id === id)?.corpseGunRounds).toBe(0)
    const empty = { ...s, player: { ...s.player, arenaRecovery: 0 } }
    expect(multiCommand(empty, { action: 'machi-corpse-fire', target: id })).toBe(empty)
    s = { ...s, projectiles: [{ ...s.projectiles[0], x: s.opponent.x - 0.1, y: 6 }] }
    const contact = advanceProjectiles(s, 0)
    expect(contact.hits).toHaveLength(1)
    expect(resolveFightImpacts(contact.state, contact.hits).opponent.health).toBeLessThan(
      s.opponent.health,
    )
    effect.dispose()
    expect(world.children).toHaveLength(0)
  })
  it('drops the material body when Nen, hands or the attached thread cease to hold', () => {
    const s = attached(),
      id = s.player.corpseStrings![0].id
    for (const change of [
      { hitStun: 1 },
      { x: 90 },
      { nen: { ...s.player.nen, mode: 'zetsu' as const } },
    ]) {
      const next = advanceMachiCorpses({ ...s, player: { ...s.player, ...change } })
      expect(next.player.corpseStrings).toHaveLength(0)
      expect(next.battlefield!.entities.find((e) => e.id === id)).toMatchObject({
        y: 0,
        controller: undefined,
      })
    }
  })
  it('rejects living or Nen-created bodies and does not conjure a gun for an unarmed body', () => {
    const s = scene(),
      body = s.battlefield!.entities[0]
    for (const change of [{ kind: 'hostage' as const }, { material: 'nen' as const }]) {
      const invalid = {
        ...s,
        battlefield: { ...s.battlefield!, entities: [{ ...body, ...change }] },
      }
      expect(multiCommand(invalid, { action: 'machi-corpse', target: body.id })).toBe(invalid)
    }
    const armed = attached(),
      id = armed.player.corpseStrings![0].id
    const unarmed = {
      ...armed,
      battlefield: {
        ...armed.battlefield!,
        entities: armed.battlefield!.entities.map((e) => ({ ...e, corpseGunRounds: undefined })),
      },
    }
    expect(multiCommand(unarmed, { action: 'machi-corpse-fire', target: id })).toBe(unarmed)
    expect(
      decodeFightReplay(JSON.stringify(recordedScenario(s))).setup.environment.preparation
        ?.resources,
    ).toContain('armed-corpses')
  })
})

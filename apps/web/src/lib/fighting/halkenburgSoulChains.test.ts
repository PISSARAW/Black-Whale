import { describe, it, expect } from 'vitest'
import {
  chainShot,
  landChainShot,
  positionSoulCohort,
  threeSoulBodies,
} from './halkenburgChainTestKit'
import { collectSoulBodies } from './halkenburgSoulBodies'
import { reconcileHalkenburgSouls, advanceHalkenburgSouls } from './halkenburgSouls'
import { multiCommand } from './fourCombatTestKit'
import { hatsuFor } from './hatsu'
import { voluntaryNenAvailable } from './nenAccess'
import { advanceFighterAttack } from './fighterAttacks'
import { visitAttackSource } from './visitSceneKit'
import { soulDuel, soulHit } from './halkenburgSoulTestKit'
import { moveById } from './movesets'
import { privatePvpState, localPerspective } from './pvp/view'
import { resolveFightOutcome } from './fightOutcome'
import { nativeArsenalAiAction } from './arsenalAiAction'
import { performAuraAttack } from './engine'
import { spectatorSnapshot } from './pvp/spectator'
import { encodeFightSnapshot, decodeFightSnapshot } from './fightReplaySnapshot'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { executeReplayPacket } from './fightReplayCommands'
import { panelReplayCommand } from './fightReplayPanels'
import { fightReplayHash } from './fightReplayHash'
import { predictionEligible, sameControlledBody } from './pvp/predictionPolicy'
import type { FightState } from './types'
import type { ReplayPacket } from './fightReplayTypes'

function invariants(state: FightState) {
  const bodies = collectSoulBodies(state)
  expect(new Set(bodies.map((body) => body.key)).size).toBe(bodies.length)
  const minds = state.halkSoulMinds!
  expect(new Set(minds.map((item) => item.mind.key)).size).toBe(minds.length)
  expect(bodies.filter(({ body }) => body.halkSoul?.mind && !body.halkSoulSleep)).toHaveLength(1)
  for (const item of minds.filter((item) => item.alive))
    expect(bodies.some(({ key, body }) => key === item.body && body.health > 0)).toBe(true)
}
describe('Halkenburg transfers through a connected chain of actual bodies', () => {
  it('moves into a third body already involved in a transfer without copying any mind or healing', () => {
    const s = threeSoulBodies()
    expect(s.halkSoulLinks).toHaveLength(2)
    expect(s.halkSoulMinds).toHaveLength(3)
    expect(s.player.halkCohortBody).toBeDefined()
    expect(s.player.halkSoul?.mind?.identity).toBe('halkenburg')
    expect(s.opponent.id).toBe('halkenburg')
    expect(s.opponent.halkSoul?.mind?.identity).toBe('benjamin')
    expect(s.opponent.health).toBe(81)
    expect(s.rosterGuests![0].fighter.health).toBe(47)
    invariants(s)
    expect(reconcileHalkenburgSouls(s)).toEqual(s)
  })
  it('keeps Halkenburg’s own bow, costs and vulnerable startup in a foreign body, without its Hatsu', () => {
    const s = threeSoulBodies()
    expect(voluntaryNenAvailable(s.player)).toBe(false)
    let gathering: FightState = {
      ...s,
      player: {
        ...s.player,
        attack: null,
        hatsuEffects: { ...s.player.hatsuEffects, cohortWillFrames: 0 },
      },
    }
    expect(multiCommand(gathering, { action: 'halkenburg-arrow' })).toBe(gathering)
    for (let i = 0; i < 480; i++) gathering = hatsuFor('halkenburg').onFrame(gathering)
    expect(gathering.player.hatsuEffects.cohortWillFrames).toBe(480)
    const cast = multiCommand(
      { ...gathering, rng: 0 },
      { action: 'halkenburg-arrow', target: 'low' },
    )
    expect(cast.player.aura).toBeLessThan(gathering.player.aura)
    expect(cast.player.attack?.hatsuSource).toBe('halkenburg')
    expect(visitAttackSource(cast.player)).toBe('halkenburg')
    expect(advanceFighterAttack(cast.player).attack?.frame).toBe(1)
    const interrupted = advanceFighterAttack({
      ...cast.player,
      nen: { ...cast.player.nen, mode: 'zetsu' },
    })
    expect(interrupted.attack).toBeNull()
  })
  it('supports another shot back through the chain and preserves every body’s health', () => {
    const before = threeSoulBodies(),
      hp = new Map(collectSoulBodies(before).map(({ key, body }) => [key, body.health]))
    const s = landChainShot(chainShot({ ...before, player: { ...before.player, facing: -1 } }))
    expect(s.halkSoulLinks).toHaveLength(3)
    expect(s.halkSoulMinds).toHaveLength(3)
    expect(s.player.id).toBe('halkenburg')
    for (const { key, body } of collectSoulBodies(s)) expect(body.health).toBe(hp.get(key))
    invariants(s)
  })
  it('lets the AI reuse Halkenburg’s own bow in its occupied body and enforces a real no-Nen clause', () => {
    const swapped = localPerspective(threeSoulBodies(), true) as FightState
    const ready = {
      ...swapped,
      opponent: {
        ...swapped.opponent,
        attack: null,
        hatsuEffects: { ...swapped.opponent.hatsuEffects, cohortWillFrames: 480 },
      },
    }
    const cast = nativeArsenalAiAction(ready, performAuraAttack)!
    expect(cast.opponent.attack?.hatsuSource).toBe('halkenburg')
    expect(cast.opponent.halkSoulLowShot).toBe(true)
    const forbidden = {
      ...ready,
      opponent: {
        ...ready.opponent,
        judgmentChain: { owner: 'player' as const, rule: 'zetsu' as const },
      },
    }
    const breached = multiCommand(
      forbidden,
      { action: 'halkenburg-arrow', target: 'low' },
      'opponent',
    )
    expect(breached.opponent.health).toBe(0)
    expect(breached.opponent.halkSoulAlive).toBe(false)
    expect(breached.winner).toBe('player')
  })
  it('keeps the caster in the lottery after paying the last aura unit, without gathering new will at zero aura', () => {
    const base = positionSoulCohort(soulHit(soulDuel()), 'player'),
      cost = moveById('halkenburg:neutralSpecial')!.auraCost
    const ready = {
      ...base,
      rng: 0,
      player: {
        ...base.player,
        attack: null,
        aura: cost,
        hatsuEffects: { ...base.player.hatsuEffects, cohortWillFrames: 480 },
      },
    }
    const cast = multiCommand(ready, { action: 'halkenburg-arrow', target: 'low' })
    expect(cast.player.id).toBe('benjamin')
    expect(cast.player.aura).toBe(0)
    expect(cast.player.halkenburgSupporter).toBe('self:player')
    expect(cast.player.hatsuEffects.arrowNocked).toBe(1)
    expect(advanceFighterAttack(cast.player).attack?.frame).toBe(1)
    expect(hatsuFor('halkenburg').onFrame(cast).player.hatsuEffects.cohortWillFrames).toBe(0)
  })
  it('chooses the most recently injected conscious mind, then yields and restores it once per chain', () => {
    const s = threeSoulBodies()
    let sleeping = multiCommand(s, { action: 'halkenburg-sleep' })
    expect(sleeping.player.halkSoulSleep).toBe(true)
    expect(sleeping.rosterGuests![0].fighter.halkSoulSleep).toBe(false)
    invariants(sleeping)
    for (let n = 0; n < 180; n++) sleeping = advanceHalkenburgSouls(sleeping)
    expect(sleeping.player.halkSoulSleep).toBe(false)
    invariants(sleeping)
  })
  it('does not kill a mind that has already left a former host when that host dies', () => {
    const s = threeSoulBodies(),
      guest = s.rosterGuests![0]
    const dead = reconcileHalkenburgSouls({
      ...s,
      rosterGuests: [{ ...guest, fighter: { ...guest.fighter, health: 0 } }],
    })
    expect(dead.halkSoulMinds!.find((item) => item.mind.identity === 'halkenburg')?.alive).toBe(
      true,
    )
    expect(dead.player.health).toBe(s.player.health)
    expect(dead.rosterGuests![0].fighter.health).toBe(0)
    invariants(dead)
  })
  it('loses only the mind actually occupying a destroyed host and cannot revive a fully destroyed chain', () => {
    const s = threeSoulBodies()
    const dead = resolveFightOutcome({ ...s, player: { ...s.player, health: 0 } })
    expect(dead.winner).toBe('opponent')
    expect(dead.halkSoulMinds!.find((item) => item.mind.identity === 'halkenburg')?.alive).toBe(
      false,
    )
    expect(dead.halkSoulMinds!.find((item) => item.mind.identity === 'benjamin')?.alive).toBe(true)
    expect(dead.opponent.health).toBe(81)
    const all = resolveFightOutcome({
      ...s,
      player: { ...s.player, health: 0 },
      opponent: { ...s.opponent, health: 0 },
      rosterGuests: s.rosterGuests!.map((guest) => ({
        ...guest,
        fighter: { ...guest.fighter, health: 0 },
      })),
    })
    expect(all.winner).toBe('draw')
    expect(all.halkSoulMinds!.every((item) => !item.alive)).toBe(true)
  })
  it('supports a further transfer from P2 with stable physical keys and correctly swapped mind references', () => {
    const p2 = localPerspective(threeSoulBodies(), true) as FightState
    const shot = chainShot({ ...p2, opponent: { ...p2.opponent, facing: -1 } }, 'opponent')
    expect(shot.projectiles[0].halkenburgArrow?.participantMind).toBe('mind:opponent')
    expect(predictionEligible(shot)).toBe(false)
    const s = landChainShot(shot)
    expect(s.opponent.id).toBe('halkenburg')
    expect(s.opponent.halkSoul?.mind?.key).toBe('mind:opponent')
    expect(s.halkSoulMinds).toHaveLength(3)
    invariants(s)
  })
  it('returns the displaced mind to its latest return body and keeps both cohabitants unique', () => {
    const s = threeSoulBodies()
    const dead = reconcileHalkenburgSouls({ ...s, opponent: { ...s.opponent, health: 0 } })
    expect(dead.player.health).toBe(0)
    expect(dead.player.halkSoulAlive).toBe(true)
    expect(dead.opponent.halkCohortBody).toBeDefined()
    expect(dead.opponent.halkSoul?.mind?.identity).toBe('benjamin')
    const surviving = dead.halkSoulMinds!.filter((item) => item.alive)
    expect(surviving).toHaveLength(3)
    expect(surviving.filter((item) => item.body === dead.opponent.halkSoul!.key)).toHaveLength(2)
    invariants(dead)
  })
  it('roundtrips the authoritative graph and keeps other minds’ identities private in both views', () => {
    const s = threeSoulBodies(),
      setup = {
        player: 'halkenburg',
        opponent: 'benjamin',
        mode: 'versus-local',
        formatId: s.formatId,
        environment: s.environment,
      } as const
    expect(decodeFightSnapshot(encodeFightSnapshot(s), setup)).toEqual(
      JSON.parse(JSON.stringify(s)),
    )
    const p2 = privatePvpState(s, 'opponent')
    expect(
      p2
        .halkSoulMinds!.filter((item) => item.mind.side === 'opponent')
        .every((item) => !item.mind.identity),
    ).toBe(true)
    expect(p2.halkSoulMinds!.find((item) => item.mind.key === 'mind:player')?.mind.identity).toBe(
      'benjamin',
    )
    const publicState = decodeFightSnapshot(spectatorSnapshot(s).snapshot, setup)
    expect(publicState.halkSoulMinds!.every((item) => !item.mind.identity)).toBe(true)
    expect(predictionEligible(s)).toBe(false)
    expect(
      sameControlledBody(s, {
        ...s,
        player: { ...s.player, halkSoul: { ...s.player.halkSoul!, key: 'another-body' } },
      }),
    ).toBe(false)
  })
  it('replays a further actual low shot and the resulting third transfer deterministically', () => {
    const base = threeSoulBodies(),
      prepared = chainShot({ ...base, player: { ...base.player, facing: -1 } })
    // Record the real command rather than a synthesized result, with the same ready fixture and lottery seed.
    let s: FightState = {
      ...base,
      rng: prepared.rng,
      player: {
        ...base.player,
        attack: null,
        facing: -1 as const,
        hatsuEffects: { ...base.player.hatsuEffects, cohortWillFrames: 480 },
      },
    }
    // chainShot stores the next RNG; recover a seed which selects the principal mind.
    for (let rng = 0; rng < 100; rng++) {
      const candidate = multiCommand({ ...s, rng }, { action: 'halkenburg-arrow', target: 'low' })
      if (candidate.player.halkenburgSupporter === 'self:player') {
        s = { ...s, rng }
        break
      }
    }
    const recorder = createReplayRecorder(s)!
    expect(recorder).not.toBeNull()
    const packet = (p: ReplayPacket) => {
      const after = executeReplayPacket(s, p)
      recorder.append(s, p, after)
      s = after
    }
    const used = multiCommand(s, { action: 'halkenburg-arrow', target: 'low' })
    packet([0, 0, 0, [panelReplayCommand(s, used)]])
    for (let i = 0; i < 80; i++) packet([1 / 60, 0, 0, []])
    expect(s.halkSoulLinks).toHaveLength(3)
    const replay = createReplayPlayer(recorder.snapshot()!)
    while (!replay.done && !replay.error) replay.advance(0.05, 3)
    expect(replay.error).toBe('')
    expect(fightReplayHash(replay.state)).toBe(fightReplayHash(s))
  })
})

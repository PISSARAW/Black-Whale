import { describe, expect, it } from 'vitest'
import { coachFixtureReplay } from '../../../ui-tests/fighting-coach/scenarios'
import { createReplayCoachScan } from './replayCoach'
import { visibleRecovery } from './replayCoachPerception'
import { createReplayCoachObserver } from './replayCoachObserver'
import { createReplayPlayer } from './fightReplayPlayer'
import { createFightMatchRuntime } from './fightMatchRuntime'
import { fightReplayHash } from './fightReplayHash'
import { canPracticeReplay } from './fightReplayPractice'
import { FIGHTING_ROSTER } from './roster'
import { encodeFightSnapshot } from './fightReplaySnapshot'
import { initialReplayState } from './fightReplayCommands'
import { REPLAY_RULESET, type FightReplay } from './fightReplayTypes'
import type { ReplayCoachReport } from './replayCoachTypes'

function analyse(replay: FightReplay, side: 'player' | 'opponent' = 'player') {
  const scan = createReplayCoachScan(replay, side)
  let result: ReplayCoachReport = scan.current
  for (let i = 0; i < 100 && result.status === 'running'; i++) result = scan.step()
  return result
}
describe('verified replay diagnostics and concrete rehearsal', () => {
  it('measures the same visible response from the second player’s perspective', () => {
    const result = analyse(coachFixtureReplay({ side: 'opponent' }).replay, 'opponent')
    expect(result.status).toBe('complete')
    expect(
      result.findings.some((x) => x.kind === 'recovery-opportunity' && x.side === 'opponent'),
    ).toBe(true)
  })
  it('observes fixed frames without changing verification, batched playback or reconstruction', () => {
    const { replay } = coachFixtureReplay({ batch: 3 })
    const observed: number[] = []
    const plain = createReplayPlayer(replay)
    const watched = createReplayPlayer(replay, (before, after, packet) => {
      expect(after.frame).toBe(before.frame + 1)
      observed.push(packet)
    })
    for (const target of [30, 12, replay.packets.length]) {
      for (const player of [plain, watched]) {
        player.seek(target)
        player.advance(0)
        expect(player.error).toBe('')
        expect(player.cursor).toBe(target)
      }
      expect(fightReplayHash(watched.state)).toBe(fightReplayHash(plain.state))
    }
    expect(observed.filter((packet) => packet === 0)).toHaveLength(6)
    expect(watched.done).toBe(true)
  })
  it.each([1, 3])(
    'finds an observed recovery using real fixed frames in %i-frame batches',
    (batch) => {
      const { replay } = coachFixtureReplay({ batch })
      const before = JSON.stringify(replay)
      const result = analyse(replay)
      expect(result.status).toBe('complete')
      expect(result.findings.some((x) => x.kind === 'recovery-opportunity')).toBe(true)
      expect(JSON.stringify(replay)).toBe(before)
      expect(result.nonExhaustive).toBe(true)
    },
  )
  it('does not accuse the player of missing a recovery they actually punished', () => {
    const result = analyse(coachFixtureReplay({ answer: true }).replay)
    expect(result.status).toBe('complete')
    expect(result.findings.filter((x) => x.kind === 'recovery-opportunity')).toEqual([])
  })
  it('explains an actually punished own recovery', () => {
    const data = coachFixtureReplay({ punished: true })
    expect(data.final.impact).toMatchObject({ attacker: 'opponent', punish: true })
    const result = analyse(data.replay)
    expect(result.findings.some((x) => x.kind === 'recovery-punished')).toBe(true)
  })
  it('verifies a replay without moving its live playback cursor and then rehearses the recorded position', async () => {
    const { replay } = coachFixtureReplay()
    const runtime = createFightMatchRuntime(undefined, { record: false })
    const entry = await runtime.replays.import(JSON.stringify(replay))
    expect(entry).not.toBeNull()
    runtime.replays.open(entry!.id, null)
    const result = analyse(replay),
      finding = result.findings[0]
    expect(finding).toBeDefined()
    let state = runtime.seekReplay(finding.packet)!
    for (let i = 0; i < 10 && runtime.replays.active; i++) {
      const review = runtime.replays.advance(0)!
      state = review
      if (canPracticeReplay(review)) break
    }
    const hash = fightReplayHash(state)
    const practice = runtime.takeoverReplay()!
    expect(practice.replayPractice?.packet).toBe(finding.packet)
    expect(practice.player.aura).toBe(state.player.aura)
    expect(practice.opponent.health).toBe(state.opponent.health)
    expect(fightReplayHash(runtime.replays.returnToReplay()!)).toBe(hash)
  })
  it('never publishes findings from a divergent replay, including a corrupted final checkpoint', () => {
    const replay = structuredClone(coachFixtureReplay().replay)
    replay.checkpoints[replay.checkpoints.length - 1].hash = '00000000'
    const result = analyse(replay)
    expect(result.status).toBe('invalid')
    expect(result.findings).toEqual([])
  })
  it('supports cancellation and refuses oversized scans and old rulesets', () => {
    const { replay } = coachFixtureReplay()
    const scan = createReplayCoachScan(replay)
    scan.step()
    expect(scan.cancel().findings).toEqual([])
    expect(scan.step().status).toBe('cancelled')
    const big = {
      ...replay,
      duration: 18001 / 60,
      packets: Array.from({ length: 18001 }, () => replay.packets[0]),
      checkpoints: [
        replay.checkpoints[0],
        { packet: 18001, hash: replay.checkpoints.at(-1)!.hash },
      ],
    }
    expect(createReplayCoachScan(big).current.status).toBe('limit')
    expect(analyse({ ...replay, ruleset: 'old' as typeof REPLAY_RULESET }).status).toBe('invalid')
  })
})

describe('diagnostics preserve the viewer’s Nen perception', () => {
  function recovery() {
    const { replay } = coachFixtureReplay()
    const player = createReplayPlayer(replay)
    for (let i = 0; i < 90; i++) {
      const state = player.advance(1 / 60)
      if (visibleRecovery(state, 'player')) return state
    }
    throw Error('Expected an observable recovery')
  }
  it('does not reveal an attack with In, an unseen body or a hidden book page', () => {
    const state = recovery(),
      hash = fightReplayHash(state)
    expect(
      visibleRecovery(
        {
          ...state,
          player: {
            ...state.player,
            hatsuEffects: { ...state.player.hatsuEffects, senseSeals: 1 },
          },
        },
        'player',
      ),
    ).toBe(false)
    const concealed = {
      ...state,
      opponent: { ...state.opponent, attack: { ...state.opponent.attack!, concealed: true } },
    }
    expect(visibleRecovery(concealed, 'player')).toBe(false)
    expect(
      visibleRecovery(
        { ...concealed, player: { ...state.player, nen: { ...state.player.nen, gyo: true } } },
        'player',
      ),
    ).toBe(true)
    expect(fightReplayHash(state)).toBe(hash)
  })
  it.each(['pvpSeat', 'spectatorView', 'forecastSimulation', 'teamMatch'] as const)(
    'refuses %s recordings',
    (key) => {
      const { replay } = coachFixtureReplay()
      const state = initialReplayState(replay.setup)
      const initial = { ...state, [key]: key === 'pvpSeat' ? 'player' : true }
      const altered = {
        ...replay,
        setup: { ...replay.setup, initial: encodeFightSnapshot(initial) },
      }
      expect(createReplayCoachScan(altered).current.status).toBe('unsupported')
    },
  )
  it('does not report hidden real impacts during Parallel Future or post-mortem sequences', () => {
    const state = recovery()
    const observer = createReplayCoachObserver('player')
    const impact = {
      ...state.impact!,
      sequence: 99,
      attacker: 'opponent' as const,
      punish: true,
      blocked: false,
      damage: 10,
    }
    const after = {
      ...state,
      impact,
      parallelFuture: { owner: 'opponent' } as NonNullable<typeof state.parallelFuture>,
    }
    observer.observe(state, after, 10)
    observer.finish()
    expect(observer.findings).toEqual([])
  })
  it.each(FIGHTING_ROSTER)(
    '$name has only a measured physical response, with no new Hatsu advice',
    ({ id }) => {
      const result = analyse(coachFixtureReplay({ fighter: id }).replay)
      expect(result.status).toBe('complete')
      for (const finding of result.findings) {
        expect(finding).not.toHaveProperty('hatsuSource')
        expect(finding).not.toHaveProperty('secretWindow')
        expect(finding).not.toHaveProperty('state')
      }
    },
  )
})

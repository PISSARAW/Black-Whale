import { describe, expect, it } from 'vitest'
import { initialCombatState } from '../../combat/reducer'
import { ArenaRecorder } from './recorder'
import { replayFromUrl, replayShareUrl } from './share'

describe('Arena replay URL sharing', () => {
  it('round-trips an authenticated replay while preserving route options', () => {
    const setup = { playerAt: [0, 0] as const, opponentAt: [3, 0] as const }
    const recorder = new ArenaRecorder(setup, 'deceiver', 'master')
    const replay = recorder.finish(initialCombatState(setup))
    const url = replayShareUrl(replay, 'https://example.test/arena?terrain=tier-2-screening-room')
    expect(url).toContain('?terrain=tier-2-screening-room#replay=')
    expect(replayFromUrl(url)).toEqual(replay)
  })

  it('ignores URLs without a replay fragment', () => {
    expect(replayFromUrl('https://example.test/arena')).toBeNull()
  })
})

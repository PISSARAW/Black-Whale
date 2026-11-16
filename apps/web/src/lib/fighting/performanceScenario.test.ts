import { it, expect } from 'vitest'
import { performanceTape } from '../../../ui-tests/fighting-performance/scenario'
import { createLiveDriver } from '../../../ui-tests/fighting-performance/liveDriver'
import { createReplayPlayer } from './fightReplayPlayer'
for (const fighter of ['kurapika', 'hisoka', 'chrollo', 'benjamin'] as const) {
  it(`keeps live recorded ${fighter} identical to the replay`, () => {
    const tape = performanceTape({ fighter, stage: 'banquet-hall', effects: true })
    const live = createLiveDriver(tape)
    const replay = createReplayPlayer(tape)
    for (let i = 0; i < 1500 && !live.done; i++) {
      live.advance(1 / 60)
      replay.advance(1 / 60)
    }
    expect(live.done).toBe(true)
    expect(live.error).toBe('')
    expect(live.state).toEqual(replay.state)
  })
}

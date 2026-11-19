import { describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import {
  beginFight,
  createFight,
  nextRound,
  performAttack,
  performMove,
  performThrow,
  tickFight,
} from './engine'
import { beginFutureDivergence, stopParallelFuture } from './parallelFutureAbility'
import { parallelFutureCamera } from './parallelFutureCamera'
import { futureVisibleState } from './parallelFuturePresentation'
import { showFuturePanel } from './futurePerception'
import { performFutureField, endFutureField } from './futureIllusion'
import { fightReplayHash } from './fightReplayHash'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { applyReplayCommand, executeReplayPacket } from './fightReplayCommands'
import { decodeFightReplay } from './fightReplayCodec'
import { createVictoryPlayback } from './victory/playback'
import type { ReplayPacket } from './fightReplayTypes'
import { fightSoundEvents } from './audio/events'
import { EMPTY_INPUT, type FightInput, type FightState } from './types'

function advance(state: FightState, frames: number, input: Partial<FightInput> = {}) {
  for (let frame = 0; frame < frames; frame++)
    state = tickFight(state, { ...EMPTY_INPUT, ...input }, { dt: 1 / 60, ai: false })
  return state
}

function vision(field = false) {
  let state = beginFight(
    createFight('theta', 'tserriednich', { mode: 'versus-ai', formatId: 'knockout' }),
  )
  if (field) {
    state = {
      ...state,
      player: { ...state.player, x: 50 },
      opponent: { ...state.opponent, futureStoredFrames: 2000 },
    }
    state = performFutureField({
      state,
      side: 'opponent',
      command: { action: 'future-field-mode' },
    })
  }
  return advance(performAttack(state, 'opponent', 'special'), 30)
}

function divergence(field = false) {
  return beginFutureDivergence(vision(field), 'opponent')
}

function shootImage(state: FightState) {
  // The real prince has moved out of the firing line; the perceived prince has not.
  state = { ...state, opponent: { ...state.opponent, x: 10 } }
  return advance(performAttack(state, 'player', 'ranged'), 160)
}

describe('being deceived by Laplace Demon in arcade', () => {
  it('keeps live movement and new attacks instead of replaying the inputs held at activation', () => {
    const state = divergence()
    expect(state.futurePerception?.parallelFuture).toBeUndefined()
    expect(state.futurePerception?.futurePerception).toBeUndefined()
    const moved = advance(state, 10, { right: true })
    expect(moved.player.x).toBeGreaterThan(state.player.x)
    expect(futureVisibleState(moved, 'player').player.x).toBeGreaterThan(state.player.x)
    const shot = performMove({ state: moved, side: 'player', action: 'special' })
    expect(shot.player.attack?.kind).toBe('ranged')
    expect(shot.futurePerception?.player.attack?.kind).toBe('ranged')
  })

  it('shows false hits, injuries, projectiles and impact sounds without damaging the real prince', () => {
    let state = divergence()
    state = { ...state, opponent: { ...state.opponent, x: 10 } }
    const health = state.opponent.health
    state = performAttack(state, 'player', 'ranged')
    let heardImpact = false
    let before = futureVisibleState(state, 'player')
    for (let frame = 0; frame < 160; frame++) {
      state = advance(state, 1)
      const shown = futureVisibleState(state, 'player')
      heardImpact ||= fightSoundEvents(before, shown).some((event) => event.kind === 'impact')
      before = shown
    }
    const shown = parallelFutureCamera(state, 'player')
    expect(shown.prediction).toBeNull()
    expect(shown.main.opponent.health).toBeLessThan(health)
    expect(shown.main.opponent.x).not.toBe(state.opponent.x)
    expect(state.opponent.health).toBe(health)
    expect(heardImpact).toBe(true)
    expect(shown.main.parallelFuture).toBeUndefined()
    expect(shown.main.futureIllusion).toBeUndefined()
    expect(state.phase).toBe('fighting')
    expect(state.score.player).toBe(0)
  })

  it('reveals real health and position exactly when the ten-second illusion ends', () => {
    const hit = shootImage(divergence())
    const remaining = 600 - hit.parallelFuture!.cursor
    const before = advance(hit, remaining - 1)
    expect(futureVisibleState(before, 'player').opponent.health).toBeLessThan(
      before.opponent.health,
    )
    const revealed = advance(before, 1)
    expect(revealed.parallelFuture).toBeUndefined()
    expect(revealed.futurePerception).toBeUndefined()
    expect(futureVisibleState(revealed, 'player')).toBe(revealed)
    expect(revealed.opponent.health).toBe(hit.opponent.health)
    expect(revealed.opponent.x).not.toBe(futureVisibleState(before, 'player').opponent.x)
  })

  it('announces an illusory win and round score while keeping the real match in progress', () => {
    const ready = vision()
    const started = beginFutureDivergence(
      { ...ready, opponent: { ...ready.opponent, health: 1 } },
      'opponent',
    )
    const state = shootImage(started)
    expect(state.futurePerception?.phase).toBe('finished')
    expect(state.futurePerception?.opponent.health).toBe(0)
    expect(state.opponent.health).toBe(1)
    expect(futureVisibleState(state, 'player').opponent.health).toBe(0)
    const visible = futureVisibleState(state, 'player')
    expect(visible.phase).toBe('finished')
    expect(visible.winner).toBe('player')
    expect(visible.finishReason).toBe('knockout')
    expect(visible.roundsWon).toEqual({ player: 1, opponent: 0 })
    expect(state.winner).toBeNull()
    expect(state.roundsWon).toEqual({ player: 0, opponent: 0 })
    expect(state.matchWinner).toBeNull()
  })

  it('plays the usual victory and finish sound, then removes them at the reveal', () => {
    const ready = vision()
    const started = beginFutureDivergence(
      { ...ready, opponent: { ...ready.opponent, health: 1 } },
      'opponent',
    )
    const hit = shootImage(started)
    const shown = futureVisibleState(hit, 'player')
    expect(
      fightSoundEvents(futureVisibleState(started, 'player'), shown).filter(
        (event) => event.kind === 'finish',
      ),
    ).toHaveLength(1)
    const playback = createVictoryPlayback()
    playback.sceneReady()
    playback.observe(shown)
    playback.advance(2)
    const token = get(playback)?.token
    expect(get(playback)?.active).toBe(true)
    expect(get(playback)?.fighter).toBe('theta')
    const later = advance(hit, 20)
    const laterShown = futureVisibleState(later, 'player')
    playback.observe(laterShown)
    expect(get(playback)?.token).toBe(token)
    expect(get(playback)?.elapsed).toBe(2)
    expect(laterShown.time).toBe(shown.time)
    expect(fightSoundEvents(shown, laterShown).some((event) => event.kind === 'finish')).toBe(false)
    const revealed = advance(later, 600 - later.parallelFuture!.cursor)
    playback.observe(futureVisibleState(revealed, 'player'))
    expect(get(playback)).toBeNull()
    expect(revealed.opponent.health).toBe(1)
    expect(revealed.roundsWon.player).toBe(0)
    expect(revealed.phase).toBe('fighting')
  })

  it('lets Next round continue only the illusion without banking a real win', () => {
    const ready = vision()
    const hit = shootImage(
      beginFutureDivergence({ ...ready, opponent: { ...ready.opponent, health: 1 } }, 'opponent'),
    )
    const continued = applyReplayCommand(hit, { kind: 'perceived-result', action: 'continue' })
    expect(continued.futurePerception?.roundNumber).toBe(2)
    expect(continued.futurePerception?.phase).toBe('fighting')
    expect(continued.futurePerception?.roundsWon.player).toBe(1)
    expect(continued.roundNumber).toBe(1)
    expect(continued.roundsWon.player).toBe(0)
    expect(continued.opponent).toBe(hit.opponent)
    expect(continued.parallelFuture).toBe(hit.parallelFuture)
    const revealed = advance(continued, 600 - continued.parallelFuture!.cursor)
    expect(futureVisibleState(revealed, 'player')).toBe(revealed)
    expect(revealed.roundNumber).toBe(1)
    expect(revealed.roundsWon.player).toBe(0)
  })

  it('allows a perceived match win and rematch while retaining the real score and position', () => {
    const ready = vision()
    const hit = shootImage(
      beginFutureDivergence(
        {
          ...ready,
          roundsWon: { player: 1, opponent: 0 },
          opponent: { ...ready.opponent, health: 1 },
        },
        'opponent',
      ),
    )
    expect(futureVisibleState(hit, 'player').matchWinner).toBe('player')
    expect(hit.matchWinner).toBeNull()
    const rematch = applyReplayCommand(hit, { kind: 'perceived-result', action: 'rematch' })
    expect(rematch.futurePerception?.roundsWon.player).toBe(0)
    expect(rematch.futurePerception?.phase).toBe('fighting')
    expect(rematch.roundsWon.player).toBe(1)
    expect(rematch.opponent).toBe(hit.opponent)
    const finished = { ...hit, phase: 'finished' as const, futurePerception: undefined }
    expect(applyReplayCommand(finished, { kind: 'perceived-result', action: 'rematch' })).toBe(
      finished,
    )
  })

  it('records and replays an apparent victory and Next round without affecting the real result', () => {
    const ready = vision()
    const hit = shootImage(
      beginFutureDivergence({ ...ready, opponent: { ...ready.opponent, health: 1 } }, 'opponent'),
    )
    const recorder = createReplayRecorder(hit)!
    const packet: ReplayPacket = [1 / 60, 0, 0, [{ kind: 'perceived-result', action: 'continue' }]]
    const continued = executeReplayPacket(hit, packet)
    recorder.append(hit, packet, continued)
    const data = decodeFightReplay(JSON.stringify(recorder.snapshot()))
    const replay = createReplayPlayer(data)
    while (!replay.done && !replay.error) replay.advance(0.05, 10)
    expect(replay.error).toBe('')
    expect(fightReplayHash(replay.state)).toBe(fightReplayHash(continued))
    expect(replay.state.roundsWon.player).toBe(0)
    const invalid = structuredClone(data)
    Object.assign(invalid.packets[0][3][0], { action: 'award-real-win' })
    expect(() => decodeFightReplay(JSON.stringify(invalid))).toThrow('invalid-replay')
  })

  it('hides the enemy activation panel throughout preparation, vision, divergence and idle play', () => {
    const state = vision()
    expect(showFuturePanel({ ...state, parallelFuture: undefined }, 'player')).toBe(false)
    expect(showFuturePanel(state, 'player')).toBe(false)
    expect(showFuturePanel(divergence(), 'player')).toBe(false)
    expect(showFuturePanel({ ...state, mode: 'training' }, 'player')).toBe(true)
    expect(showFuturePanel({ ...state, mode: 'versus-local' }, 'player')).toBe(true)
    const own = {
      ...state,
      player: state.opponent,
      opponent: state.player,
      parallelFuture: undefined,
    }
    expect(showFuturePanel(own, 'player')).toBe(true)
  })

  it('dispatches throws to the perception as well as reality', () => {
    const state = divergence()
    const thrown = performThrow(state, 'player')
    expect(thrown.player.attack?.variant).toBe('throw')
    expect(thrown.futurePerception?.player.attack?.variant).toBe('throw')
  })

  it('lets the real prince move freely while his perceived image stays on its own path', () => {
    const started = divergence()
    let state = started
    for (let frame = 0; frame < 20; frame++)
      state = tickFight(state, EMPTY_INPUT, {
        dt: 1 / 60,
        opponentInput: { ...EMPTY_INPUT, left: true },
      })
    expect(state.opponent.x).toBeLessThan(started.opponent.x)
    expect(futureVisibleState(state, 'player').opponent.x).toBe(started.opponent.x)
    expect(state.futurePerception?.opponent.x).not.toBe(state.opponent.x)
  })

  it('keeps the interactive illusion after ten seconds when its Zetsu field is still active', () => {
    let state = divergence(true)
    expect(state.futureIllusion).toBeDefined()
    expect(state.futurePerception).toBeDefined()
    // Stay inside the fixed field in both worlds for its complete initial window.
    state = advance(state, 600)
    expect(state.parallelFuture).toBeUndefined()
    expect(state.futureIllusion).toBeDefined()
    expect(state.futurePerception).toBeDefined()
    const shot = performAttack(state, 'player', 'ranged')
    expect(shot.futurePerception?.player.attack?.kind).toBe('ranged')
    const revealed = endFutureField(shot)
    expect(revealed.futurePerception).toBeUndefined()
    expect(futureVisibleState(revealed, 'player')).toBe(revealed)
  })

  it('reveals reality when the power is interrupted and clears perception between rounds', () => {
    const state = divergence()
    const sealed = {
      ...state,
      opponent: {
        ...state.opponent,
        hatsuEffects: { ...state.opponent.hatsuEffects, hatsuStolen: 60 },
      },
    }
    expect(advance(sealed, 1).futurePerception).toBeUndefined()
    expect(stopParallelFuture(state).futurePerception).toBeUndefined()
    expect(
      nextRound({ ...state, phase: 'finished', winner: 'player' }).futurePerception,
    ).toBeUndefined()
  })

  it('does not resurrect a divergence when the real prince leaves the illusion field', () => {
    const state = divergence(true)
    const outside = { ...state, opponent: { ...state.opponent, x: state.futureIllusion!.x - 37 } }
    const revealed = advance(outside, 1)
    expect(revealed.futureIllusion).toBeUndefined()
    expect(revealed.parallelFuture).toBeUndefined()
    expect(revealed.futurePerception).toBeUndefined()
    expect(futureVisibleState(revealed, 'player')).toBe(revealed)
  })

  it('keeps human commands live outside the field and resumes the illusion only inside', () => {
    const state = divergence(true)
    const outside = advance({ ...state, player: { ...state.player, x: 10 } }, 2, { right: true })
    expect(outside.player.x).toBeGreaterThan(10)
    expect(futureVisibleState(outside, 'player')).toBe(outside)
    const shot = performAttack(outside, 'player', 'ranged')
    expect(shot.player.attack?.kind).toBe('ranged')
    expect(shot.futurePerception?.player.attack?.kind).toBe('ranged')
    const returned = { ...shot, player: { ...shot.player, x: 50 } }
    expect(futureVisibleState(returned, 'player')).not.toBe(returned)
  })

  it('serializes without recursive branches and replays the same human actions deterministically', () => {
    const original = divergence()
    const imported = JSON.parse(JSON.stringify(original)) as FightState
    const first = shootImage(original)
    const second = shootImage(imported)
    expect(fightReplayHash(first)).toBe(fightReplayHash(second))
    expect(second.futurePerception?.futurePerception).toBeUndefined()
  })

  it('records and replays new human attacks during the hidden divergence through its reveal', () => {
    let state = divergence()
    const recorder = createReplayRecorder(state)!
    for (let frame = 0; frame < 601; frame++) {
      const packet: ReplayPacket = [
        1 / 60,
        0,
        0,
        frame === 20 || frame === 180
          ? [{ kind: 'move', side: 'player', action: 'ranged', input: 0 }]
          : [],
      ]
      const after = executeReplayPacket(state, packet)
      recorder.append(state, packet, after)
      state = after
    }
    const replay = createReplayPlayer(recorder.snapshot()!)
    while (!replay.done && !replay.error) replay.advance(0.05, 10)
    expect(replay.error).toBe('')
    expect(replay.done).toBe(true)
    expect(fightReplayHash(replay.state)).toBe(fightReplayHash(state))
  })
})

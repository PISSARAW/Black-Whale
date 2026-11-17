import { applyReplayCommand } from './fightReplayCommands'
import { tickFight } from './engine'
import { unpackReplayInput } from './fightReplayInput'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { fightReplayHash } from './fightReplayHash'
import type { FightReplay, ReplayCommand, ReplayPacket } from './fightReplayTypes'
import type { FightImpact, FightSide, FightState } from './types'

export interface BaselineContact extends FightImpact {
  frame: number
  move: string | null
}
export interface BaselineAttempt {
  frame: number
  command: ReplayCommand
  outcome: string
  auraDebited: number
}

/** Uses the production replay command path, with explicit commands kept in the recording. */
export function createBaselineTape(initial: FightState) {
  let state = structuredClone(initial)
  const recorder = createReplayRecorder(state)
  if (!recorder) throw Error('Baseline initial state cannot be recorded')
  const contacts: BaselineContact[] = []
  const attempts: BaselineAttempt[] = []
  const auraDebited = { player: 0, opponent: 0 }
  const observe = (before: FightState, after: FightState) => {
    const impact = after.impact
    if (!impact || impact.sequence === before.impact?.sequence) return
    contacts.push({
      ...impact,
      frame: after.frame,
      move: impact.projectileId === null ? (after[impact.attacker].attack?.moveId ?? null) : null,
    })
  }
  function command(before: FightState, entry: ReplayCommand) {
    const after = applyReplayCommand(before, entry)
    if (entry.kind === 'move') {
      const debit = Math.max(0, before[entry.side].aura - after[entry.side].aura)
      auraDebited[entry.side] += debit
      attempts.push({
        frame: before.frame,
        command: entry,
        auraDebited: debit,
        outcome: after.training?.history.at(-1)?.outcome ?? 'unobserved',
      })
    }
    return after
  }
  return {
    get state() {
      return state
    },
    get contacts() {
      return contacts
    },
    step(packet: ReplayPacket) {
      const before = state
      const applied = packet[3].reduce(command, state)
      state = tickFight(applied, unpackReplayInput(packet[1]), {
        dt: packet[0],
        opponentInput: unpackReplayInput(packet[2]),
        ai: false,
        onFrame: observe,
      })
      recorder.append(before, packet, state)
      if (recorder.error) throw Error(`Baseline recording: ${recorder.error}`)
    },
    finish() {
      const replay = recorder.snapshot()
      if (!replay) throw Error('Empty baseline recording')
      const verification = verifyBaselineReplay(replay)
      if (verification.finalHash !== fightReplayHash(state)) throw Error('Baseline replay mismatch')
      return {
        replay,
        measurement: {
          initialHash: fightReplayHash(initial),
          ...verification,
          startFrame: initial.frame,
          endFrame: state.frame,
          resources: {
            player: resources(initial, state, 'player'),
            opponent: resources(initial, state, 'opponent'),
          },
          commandAuraDebited: auraDebited,
          attempts,
          contacts,
          finalPositions: {
            player: { x: state.player.x, y: state.player.y },
            opponent: { x: state.opponent.x, y: state.opponent.y },
          },
          separation: Math.abs(state.player.x - state.opponent.x),
          knockdownFrames: {
            player: state.player.knockdownFrames,
            opponent: state.opponent.knockdownFrames,
          },
          throwTechs: state.throwTech?.sequence ?? 0,
          projectilesLaunched: state.nextProjectileId - initial.nextProjectileId,
          arenaObjects: (state.battlefield?.entities ?? [])
            .filter((entry) => entry.arena)
            .map((entry) => ({
              id: entry.id,
              health: entry.health,
            })),
          recovery: state.training?.measurement ?? null,
        },
      }
    },
  }
}

function resources(initial: FightState, final: FightState, side: FightSide) {
  return {
    initialHealth: initial[side].health,
    finalHealth: final[side].health,
    healthLost: initial[side].health - final[side].health,
    initialAura: initial[side].aura,
    finalAura: final[side].aura,
  }
}

/** Import validation and every stored checkpoint are checked at two playback cadences. */
export function verifyBaselineReplay(replay: FightReplay) {
  const decoded = decodeFightReplay(JSON.stringify(replay))
  const hashes = [1 / 60, 0.05].map((dt) => {
    const player = createReplayPlayer(decoded)
    while (!player.done) player.advance(dt)
    if (player.error) throw Error(`Baseline replay: ${player.error}`)
    return fightReplayHash(player.state)
  })
  if (hashes[0] !== hashes[1]) throw Error('Playback cadence changed the baseline')
  return { finalHash: hashes[0], replayVerified: true, checkpoints: replay.checkpoints }
}

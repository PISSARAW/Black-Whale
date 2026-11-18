import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performAuraAttack } from './engine'
import { toggleEmperorTime } from './kurapikaActions'
import { applyPvpCommand } from './pvp/commands'
import { privatePvpState } from './pvp/view'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { executeReplayPacket } from './fightReplayCommands'
import { panelReplayCommand } from './fightReplayPanels'
import { fightReplayHash } from './fightReplayHash'
import { createDolphinPeopleScene } from './dolphinPeopleScene'
import type { ReplayPacket } from './fightReplayTypes'
import type { FightState, FightSide } from './types'

const OITO = 'person:queen-oito'
function scenario() {
  const initial = beginFight(
    createFight('sayird', 'kurapika', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: {
        preparation: { mode: 'scenario', resources: ['people', 'animals'], cohorts: [] },
      },
    }),
  )
  let state: FightState = {
    ...initial,
    player: { ...initial.player, x: 22, aura: 30 },
    opponent: { ...initial.opponent, x: 27, aura: 100 },
  }
  const recorder = createReplayRecorder(state)!
  function packet(entry: ReplayPacket) {
    const after = executeReplayPacket(state, entry)
    recorder.append(state, entry, after)
    state = after
  }
  return {
    recorder,
    get state() {
      return state
    },
    command(run: (current: FightState) => FightState) {
      const next = run(state)
      expect(next).not.toBe(state)
      packet([0, 0, 0, [panelReplayCommand(state, next)]])
    },
    frames(count: number) {
      for (let index = 0; index < count; index++) packet([1 / 60, 0, 0, []])
    },
  }
}
function syringe(state: FightState) {
  return performAuraAttack({
    state,
    side: 'opponent',
    kind: 'special',
    moveId: 'kurapika:backSpecial',
    auraCharged: false,
  })
}
function loaned() {
  const run = scenario()
  run.command(syringe)
  run.frames(160)
  run.command((state) => toggleEmperorTime(state, 'opponent'))
  run.command(syringe)
  run.command((state) =>
    applyPvpCommand(state, 'opponent', {
      kind: 'arsenal',
      command: { action: 'dolphin-lend', target: OITO },
    }),
  )
  return run
}
function person(state: FightState) {
  return state.battlefield!.entities.find((entry) => entry.id === OITO)!
}
describe('the actual non-user loan across P2, replay and private presentation', () => {
  it('mirrors the lender, original donor and recipient control separately without turning Oito into a fighter', () => {
    const run = loaned()
    const canonicalLoan = person(run.state).person!.loan!
    const view = privatePvpState(run.state, 'opponent')
    expect(person(view).person!.control.side).toBe('opponent')
    expect(person(view).person!.loan!.lender.owner).toBe('player')
    expect(person(view).person!.loan!.held.victim).toBe('opponent')
    expect(person(view).person!.loan!.held.theftId).toBe(canonicalLoan.held.theftId)
    expect(view.player.id).toBe('kurapika')
    expect(view.opponent.id).toBe('sayird')
    run.command((state) =>
      applyPvpCommand(state, 'player', {
        kind: 'arsenal',
        command: { action: 'person-dolphin-use', target: OITO },
      }),
    )
    run.frames(8)
    expect(person(run.state).person!.littleEyeScreen).toBeDefined()
    expect(person(privatePvpState(run.state, 'opponent')).person!.littleEyeScreen).toBeUndefined()
  })
  it('replays the real syringe, node opening, capture, orders, donor restitution and connected dismissal exactly', () => {
    const run = loaned()
    run.command((state) =>
      applyPvpCommand(state, 'player', {
        kind: 'arsenal',
        command: { action: 'person-dolphin-use', target: OITO },
      }),
    )
    run.frames(8)
    run.command((state) =>
      applyPvpCommand(state, 'player', {
        kind: 'arsenal',
        command: { action: 'person-eye-left', target: OITO },
      }),
    )
    run.frames(20)
    run.command((state) =>
      applyPvpCommand(state, 'player', {
        kind: 'arsenal',
        command: { action: 'person-eye-release', target: OITO },
      }),
    )
    run.frames(1)
    expect(run.state.player.stolenChainAbility).toBeUndefined()
    run.command((state) => toggleEmperorTime(state, 'opponent'))
    expect(person(run.state).person!.loan).toBeUndefined()
    expect(person(run.state).person!.nen).toBe('semi-open')
    const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(run.recorder.snapshot())))
    for (let index = 0; !replay.done && index < 1000; index++) replay.advance(0.05, 2)
    expect(replay.error).toBe('')
    expect(replay.done).toBe(true)
    expect(fightReplayHash(replay.state)).toBe(fightReplayHash(run.state))
  })
  it('shows the same actual Dolphin to its recipient and its Kurapika lender', () => {
    const run = loaned()
    const scene = new THREE.Scene()
    let viewer: FightSide = 'player'
    const model = createDolphinPeopleScene({
      THREE,
      scene,
      worldX: (value) => value,
      worldY: (value) => value,
      viewer: () => viewer,
    })
    model.sync(run.state, 0)
    expect(scene.getObjectByName(`stealth-dolphin:${OITO}`)!.visible).toBe(true)
    viewer = 'opponent'
    model.sync(run.state, 0)
    expect(scene.getObjectByName(`stealth-dolphin:${OITO}`)!.visible).toBe(true)
    model.dispose()
    expect(scene.children).toHaveLength(0)
  })
})

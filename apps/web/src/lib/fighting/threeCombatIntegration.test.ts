import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { render } from 'svelte/server'
import BiohazardStatus from '$lib/components/fighting/FightBiohazardStatus.svelte'
import { beginFight, createFight, performAuraAttack } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { advanceBiohazardDevices } from './biohazardDeviceFrame'
import { createBiohazardDeviceScene } from './biohazardDeviceScene'
import { biohazardDeviceAi } from './biohazardDeviceAi'
import { arsenalOptions } from './retrospectiveArsenal'
import { applyPvpCommand } from './pvp/commands'
import { parsePvpPacket } from './pvp/protocol'
import { privatePvpState } from './pvp/view'
import { spectatorSnapshot } from './pvp/spectator'
import { decodeFightSnapshot } from './fightReplaySnapshot'
import { panelReplayCommand } from './fightReplayPanels'
import { executeReplayPacket } from './fightReplayCommands'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { fightReplayHash } from './fightReplayHash'
import type { FightSide, FightState } from './types'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { ReplayCommand, ReplayPacket } from './fightReplayTypes'

vi.mock('$app/stores', async () => {
  const { readable } = await import('svelte/store')
  return { page: readable({ url: new URL('http://localhost/fr/fighting'), data: {} }) }
})

function invoke(state: FightState, command: ArsenalCommand, side: FightSide = 'player') {
  return performArsenalAction({ state, side, command }, performAuraAttack)
}
function activeCamera() {
  let s = beginFight(
    createFight('hinrigh', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  s = { ...s, player: { ...s.player, x: 25, aura: 100 }, opponent: { ...s.opponent, x: 29 } }
  s = invoke(s, { action: 'bio-transform', target: 'kit:camera' })
  for (let i = 0; i < 18; i++) s = advanceBiohazardDevices({ ...s, frame: s.frame + 1 })
  return advanceBiohazardDevices({ ...s, frame: 30 })
}

describe('three-encounter integration', () => {
  it.each(['kalluto', 'hinrigh'] as const)(
    'replays %s’s new applications deterministically',
    (id) => {
      let state = createFight(id, 'theta', { mode: 'versus-local', formatId: 'knockout' })
      state = {
        ...state,
        player: { ...state.player, x: 25, aura: 100 },
        opponent: { ...state.opponent, x: 43 },
      }
      const recorder = createReplayRecorder(state)!
      function packet(commands: ReplayCommand[] = [], dt = 1 / 60) {
        const p: ReplayPacket = [dt, 0, 0, commands],
          after = executeReplayPacket(state, p)
        recorder.append(state, p, after)
        state = after
      }
      function arsenal(command: ArsenalCommand) {
        const after = invoke(state, command)
        expect(after).not.toBe(state)
        packet([panelReplayCommand(state, after)], 0)
      }
      packet([{ kind: 'start' }], 0)
      if (id === 'kalluto')
        packet([{ kind: 'move', side: 'player', action: 'special', input: 0 }], 0)
      else arsenal({ action: 'bio-transform', target: 'kit:camera' })
      for (let i = 0; i < 40; i++) packet()
      if (id === 'kalluto') {
        expect(state.opponent.plantedPaper).toHaveLength(1)
        expect(state.opponent.openWounds).toBeGreaterThan(0)
      } else {
        arsenal({ action: 'bio-camera-move', target: 'right' })
        for (let i = 0; i < 20; i++) packet()
        arsenal({ action: 'bio-camera-read' })
        expect(state.player.biohazardFootage?.length).toBeGreaterThan(0)
        arsenal({ action: 'bio-transform', target: 'kit:transmitter' })
        for (let i = 0; i < 20; i++) packet()
        arsenal({ action: 'bio-oyster-hide' })
        arsenal({ action: 'bio-signal' })
        expect(state.player.biohazardSignal?.x).toBe(25)
      }
      const data = decodeFightReplay(JSON.stringify(recorder.snapshot())),
        replay = createReplayPlayer(data)
      for (let i = 0; i < 400 && !replay.done; i++) replay.advance(0.05, 3)
      expect(replay.error).toBe('')
      expect(replay.done).toBe(true)
      expect(fightReplayHash(replay.state)).toBe(fightReplayHash(state))
    },
  )
  it('routes P2’s local touch command to the real P1 gun', () => {
    let s = beginFight(createFight('theta', 'hinrigh', { mode: 'versus-local' }))
    s = { ...s, player: { ...s.player, x: 27 }, opponent: { ...s.opponent, x: 29 } }
    const view = privatePvpState(s, 'opponent')
    const option = arsenalOptions(view, 'player').find(
      (o) => o.command.action === 'bio-transform' && o.command.target === 'opponent',
    )!
    expect(option.ready).toBe(true)
    const next = applyPvpCommand(s, 'opponent', { kind: 'arsenal', command: option.command })
    expect(next.player.biohazardGun?.owner).toBe('opponent')
    expect(next.opponent.biohazardDevices!.find((d) => d.kind === 'gun')?.weaponSide).toBe('player')
    const projected = privatePvpState(next, 'opponent')
    expect(projected.player.biohazardDevices!.find((d) => d.kind === 'gun')?.weaponSide).toBe(
      'opponent',
    )
  })
  it('accepts semantic device orders but rejects client-supplied objects and observations', () => {
    for (const command of [
      { action: 'bio-camera-move', target: 'left' },
      { action: 'bio-receiver-give' },
      { action: 'bio-signal' },
    ]) {
      const packet = { sequence: 0, input: 0, commands: [{ kind: 'arsenal', command }] }
      expect(parsePvpPacket(packet)).toEqual(packet)
      expect(
        parsePvpPacket({
          ...packet,
          commands: [{ kind: 'arsenal', command: { ...command, recordings: [] } }],
        }),
      ).toBeNull()
    }
  })
  it('keeps footage and tracker readings private for the owner, P2 and spectators', () => {
    let s = activeCamera()
    s = invoke(s, { action: 'bio-camera-read' })
    s = { ...s, player: { ...s.player, biohazardSignal: { x: 82, y: 0, frame: 30 } } }
    expect(privatePvpState(s, 'player').player.biohazardFootage).toHaveLength(1)
    const rival = privatePvpState(s, 'opponent')
    expect(rival.opponent.biohazardFootage).toBeUndefined()
    expect(rival.opponent.biohazardSignal).toBeUndefined()
    expect(rival.opponent.biohazardDevices!.every((d) => !d.recordings)).toBe(true)
    const publicView = decodeFightSnapshot(spectatorSnapshot(s).snapshot, {
      player: 'hinrigh',
      opponent: 'hisoka',
      mode: 'versus-local',
      formatId: s.formatId,
      environment: s.environment,
    })
    expect(publicView.player.biohazardFootage).toBeUndefined()
    expect(publicView.player.biohazardSignal).toBeUndefined()
    expect(publicView.player.biohazardDevices!.every((d) => !d.recordings)).toBe(true)
  })
  it('renders the reverted transmitter as equipment and disposes its animal model', () => {
    let s = activeCamera()
    s = invoke(s, { action: 'bio-transform', target: 'kit:transmitter' })
    for (let i = 0; i < 18; i++) s = advanceBiohazardDevices({ ...s, frame: s.frame + 1 })
    s = invoke(s, { action: 'bio-oyster-hide' })
    const scene = new THREE.Scene(),
      effect = createBiohazardDeviceScene({ THREE, scene, worldX: (x) => x, worldY: (y) => y })
    effect.sync(s, 0)
    expect(
      scene.children.some(
        (g) => g.name === 'biohazard-transmitter' && g.visible && g.userData.form === 'animal',
      ),
    ).toBe(true)
    s = {
      ...s,
      player: {
        ...s.player,
        biohazardDevices: s.player.biohazardDevices!.map((d) =>
          d.kind === 'transmitter' ? { ...d, life: 0 } : d,
        ),
      },
    }
    effect.sync(advanceBiohazardDevices(s), 1)
    expect(
      scene.children.some(
        (g) => g.name === 'biohazard-transmitter' && g.visible && g.userData.form === 'object',
      ),
    ).toBe(true)
    expect(
      scene.children.some(
        (g) => g.name === 'biohazard-transmitter' && g.visible && g.userData.form === 'animal',
      ),
    ).toBe(false)
    effect.dispose()
    expect(scene.children).toHaveLength(0)
  })
  it('shows the finite knife stock and actual reviewed information in the status panel', () => {
    let s = activeCamera()
    s = invoke(s, { action: 'bio-camera-read' })
    s = {
      ...s,
      player: { ...s.player, hinrighKnives: 0, biohazardSignal: { frame: 30, x: 26, y: 0 } },
    }
    const html = render(BiohazardStatus, {
      props: { state: s, side: 'player', language: 'fr' },
    }).body
    expect(html).toContain('Couteaux restants')
    expect(html).toContain('Caméra-chat')
    expect(html).toContain('Enregistrement consulté')
    expect(html).toContain('26.0, 0.0')
    expect(html).toContain('f30')
  })
  it('gives the cat AI a fixed patrol order and records only its own observations', () => {
    const original = activeCamera()
    const s = { ...original, frame: 120, player: original.opponent, opponent: original.player }
    const ordered = biohazardDeviceAi(s, performAuraAttack)!
    expect(ordered.opponent.biohazardDevices!.find((d) => d.kind === 'camera')?.destinationX).toBe(
      93,
    )
    expect(ordered.arsenalTrace?.command).toEqual({ action: 'bio-camera-move', target: 'right' })
    const unknown = { ...s, player: { ...s.player, x: 90, y: 25 } }
    expect(biohazardDeviceAi(unknown, performAuraAttack)!.arsenalTrace?.command).toEqual(
      ordered.arsenalTrace?.command,
    )
  })
  it('conceals an oyster under real cover while letting the receiver holder obtain its signal', () => {
    let s = activeCamera()
    s = {
      ...s,
      opponent: { ...s.opponent, supportConsent: true },
      battlefield: {
        entities: [
          {
            id: 'cabinet',
            kind: 'crate',
            owner: 'neutral',
            material: 'real',
            present: true,
            health: 40,
            x: 26,
            y: 0,
            arena: { width: 3, height: 8 },
          },
        ],
        interactionHeld: { player: false, opponent: false },
        completed: { player: 0, opponent: 0 },
      },
    }
    s = invoke(s, { action: 'bio-transform', target: 'kit:transmitter' })
    for (let i = 0; i < 18; i++) s = advanceBiohazardDevices({ ...s, frame: s.frame + 1 })
    expect(
      privatePvpState(s, 'opponent').opponent.biohazardDevices!.some(
        (d) => d.kind === 'transmitter',
      ),
    ).toBe(false)
    s = invoke(s, { action: 'bio-oyster-hide' })
    expect(s.player.biohazardDevices!.find((d) => d.kind === 'transmitter')?.concealedUnder).toBe(
      'cabinet',
    )
    s = invoke(s, { action: 'bio-receiver-give' })
    const view = privatePvpState(s, 'opponent')
    expect(view.opponent.biohazardDevices!.some((d) => d.kind === 'transmitter')).toBe(false)
    expect(
      arsenalOptions(view, 'player').find((o) => o.command.action === 'bio-signal')?.ready,
    ).toBe(true)
    const read = applyPvpCommand(s, 'opponent', {
      kind: 'arsenal',
      command: { action: 'bio-signal' },
    })
    expect(read.opponent.biohazardSignal?.x).toBe(26)
    const destroyed = {
      ...s,
      battlefield: {
        ...s.battlefield!,
        entities: s.battlefield!.entities.map((e) => ({ ...e, health: 0 })),
      },
    }
    expect(
      privatePvpState(destroyed, 'opponent').opponent.biohazardDevices!.some(
        (d) => d.kind === 'transmitter',
      ),
    ).toBe(true)
  })
})

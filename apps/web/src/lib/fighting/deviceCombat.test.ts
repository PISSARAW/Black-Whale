import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight } from './engine'
import { performArsenalCommand } from './retrospectiveArsenal'
import { changeDevice, deviceEntity } from './physicalDevices'
import { interceptDeviceProjectile, strikePhysicalDevices } from './deviceImpact'
import { startFighterAttack } from './fighterAttacks'
import { attackData } from './frameData'
import { applyPvpCommand } from './pvp/commands'
import { privatePvpState } from './pvp/view'
import { parsePvpPacket, parsePvpSetup } from './pvp/protocol'
import { panelReplayCommand, applyPanelReplay } from './fightReplayPanels'
import { encodeFightSnapshot, decodeFightSnapshot } from './fightReplaySnapshot'
import { fightReplayHash } from './fightReplayHash'
import { EMPTY_INPUT, type FightState, type FightProjectile } from './types'

const cameraId = 'player:device:camera'
const gunId = 'player:device:firearm'
function setup(): FightState {
  const base = beginFight(
    createFight('hinrigh', 'theta', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: { preparation: { mode: 'scenario', resources: ['devices'], cohorts: [] } },
    }),
  )
  return {
    ...base,
    player: { ...base.player, x: 25, aura: 100 },
    opponent: { ...base.opponent, x: 40 },
  }
}
function advance(state: FightState, count = 18) {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
  return state
}
function use(
  state: FightState,
  action: Parameters<typeof performArsenalCommand>[2]['action'],
  target = cameraId,
) {
  return performArsenalCommand(state, 'player', { action, target })
}
function bullet(): FightProjectile {
  return {
    id: 99,
    owner: 'opponent',
    fighterId: 'theta',
    x: 25,
    y: 2,
    velocityX: -76,
    width: 0.5,
    height: 0.2,
    damage: 30,
    targetZone: 'torso',
    hitstun: 12,
    blockstun: 7,
    hitstop: 4,
    knockback: 3,
    shape: 'bullet',
    matter: 'object',
    colour: '#ffffff',
    age: 5,
    lifetime: 120,
    guard: 'mid',
    canHitDowned: false,
  }
}

describe('physical devices participate in combat and authenticated replay', () => {
  it('breaks a real recording camera and clears its touching body on the following frame', () => {
    const recorded = use(setup(), 'device-record')
    const touching = use(recorded, 'biohazard-device')
    const shot = interceptDeviceProjectile(touching, { projectile: bullet(), previousX: 27 })
    expect(shot.intercepted).toBe(true)
    expect(deviceEntity(shot.state, cameraId)).toBeUndefined()
    expect(shot.state.battlefield!.entities.find((e) => e.id === cameraId)?.device?.recording).toBe(
      false,
    )
    const next = advance(shot.state, 1)
    expect(next.player.deviceTouchId).toBeUndefined()
    expect(use(next, 'device-watch')).toBe(next)
    expect(deviceEntity(touching, cameraId)?.health).toBe(24)
  })
  it('lets a real low melee strike damage the cat instead of silently passing through it', () => {
    let state = advance(use(setup(), 'biohazard-device'))
    let attacker = startFighterAttack({
      fighter: { ...state.opponent, x: 30, facing: -1, crouching: true },
      kind: 'light',
      auraCharged: false,
      concealed: false,
      variant: 'low',
    })
    attacker = {
      ...attacker,
      attack: { ...attacker.attack!, frame: attackData('light', attacker).startup },
    }
    state = { ...state, opponent: attacker }
    const hit = strikePhysicalDevices(state)
    expect(hit.opponent.attack?.impacted).toBe(true)
    expect(deviceEntity(hit, cameraId)?.health).toBeLessThan(24)
    expect(hit.player.health).toBe(state.player.health)
  })
  it('fires the holder’s actual snake-barrel back into the holder, without hitting its own muzzle', () => {
    let state = setup()
    state = { ...state, opponent: { ...state.opponent, x: 30, facing: -1 } }
    state = performArsenalCommand(state, 'opponent', { action: 'device-pickup', target: gunId })
    expect(deviceEntity(state, gunId)?.device?.carrier).toBe('opponent')
    state = advance(use(state, 'biohazard-device', gunId))
    const fired = use(state, 'device-fire', gunId)
    expect(fired.projectiles).toHaveLength(1)
    expect(fired.projectiles[0].velocityX).toBeGreaterThan(0)
    const hit = advance(fired, 6)
    expect(hit.opponent.health).toBeLessThan(fired.opponent.health)
    expect(deviceEntity(hit, gunId)?.health).toBe(24)
    expect(deviceEntity(hit, gunId)?.device?.ammunition).toBe(5)
  })
  it('restores and replays the same physical command without mutating the original stock', () => {
    const before = use(setup(), 'device-pickup', gunId),
      after = use(before, 'device-fire', gunId)
    const replayed = applyPanelReplay(before, panelReplayCommand(before, after))
    expect(fightReplayHash(replayed)).toBe(fightReplayHash(after))
    const restored = decodeFightSnapshot(encodeFightSnapshot(before), {
      player: 'hinrigh',
      opponent: 'theta',
      mode: before.mode,
      formatId: before.formatId,
      environment: before.environment,
    })
    expect(fightReplayHash(use(restored, 'device-fire', gunId))).toBe(fightReplayHash(after))
    expect(deviceEntity(before, gunId)?.device?.ammunition).toBe(6)
  })
  it('accepts all eight preparation resources and uses opaque device ids from the P2 perspective', () => {
    const state = setup()
    const resources = [
      'animals',
      'birds',
      'plants',
      'objects',
      'needles',
      'flutes',
      'rooms',
      'devices',
    ] as const
    expect(
      parsePvpSetup({
        player: 'hinrigh',
        opponent: 'theta',
        formatId: 'knockout',
        environment: {
          ...state.environment,
          preparation: { mode: 'scenario', resources: [...resources], cohorts: [] },
        },
      }),
    ).toBeTruthy()
    const command = {
      kind: 'arsenal' as const,
      command: { action: 'device-pickup' as const, target: 'opponent:device:camera' },
    }
    expect(parsePvpPacket({ sequence: 0, input: 0, commands: [command] })).toBeTruthy()
    const near = { ...state, opponent: { ...state.opponent, x: 75 } }
    const picked = applyPvpCommand(near, 'opponent', command)
    const view = privatePvpState(picked, 'opponent')
    expect(
      view.battlefield!.entities.find((e) => e.id === command.command.target)?.device?.carrier,
    ).toBe('player')
    expect(deviceEntity(picked, command.command.target)?.device?.carrier).toBe('opponent')
  })
  it('does not refresh a receiver snapshot when its actual battery is exhausted', () => {
    let state = use(setup(), 'device-signal', 'player:device:receiver')
    const previous = state.player.receiverReading
    expect(previous).toBeTruthy()
    state = changeDevice(state, deviceEntity(state, 'player:device:receiver')!, {
      batteryFrames: 0,
    })
    const again = use({ ...state, frame: 50 }, 'device-signal', 'player:device:receiver')
    expect(again.player.receiverReading).toBe(previous)
  })
})

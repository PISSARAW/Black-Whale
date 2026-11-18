import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight } from './engine'
import { performArsenalCommand } from './retrospectiveArsenal'
import { advanceBiohazardDevices } from './biohazardDeviceFrame'
import { privatePvpState } from './pvp/view'
import { canUseRangedAttack } from './projectiles'
import { forceZetsu } from './nen'
import { EMPTY_INPUT, type FightState } from './types'

function ready() {
  const s = beginFight(
    createFight('hinrigh', 'theta', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return { ...s, player: { ...s.player, x: 25, aura: 100 }, opponent: { ...s.opponent, x: 29 } }
}
function command(
  s: FightState,
  action: Parameters<typeof performArsenalCommand>[2]['action'],
  target?: string,
) {
  return performArsenalCommand(s, 'player', { action, target })
}
function transform(s: FightState, id: string) {
  let next = command(s, 'bio-transform', id)
  for (let n = 0; n < 18; n++) next = advanceBiohazardDevices({ ...next, frame: next.frame + 1 })
  return next
}
describe('Biohazard preserves real device functions', () => {
  it('transforms a touched gun, spends its own ammunition and restores the physical weapon on stored-aura expiry', () => {
    const s = transform(ready(), 'weapon:opponent')
    expect(canUseRangedAttack(s.opponent)).toBe(false)
    const shot = command(s, 'bio-gun-fire', 'weapon:opponent')
    expect(shot.projectiles[0]).toMatchObject({
      matter: 'object',
      owner: 'player',
      shape: 'bullet',
    })
    expect(shot.player.biohazardDevices!.find((d) => d.kind === 'gun')!.ammo).toBe(5)
    const ended = advanceBiohazardDevices({
      ...shot,
      player: {
        ...forceZetsu(shot.player),
        biohazardDevices: shot.player.biohazardDevices!.map((d) =>
          d.kind === 'gun' ? { ...d, life: 0 } : d,
        ),
      },
    })
    expect(ended.opponent.biohazardGun).toBeUndefined()
  })
  it('refuses distant gun contact, missing devices, and a second transformation of the same object', () => {
    const s = ready()
    expect(
      command({ ...s, opponent: { ...s.opponent, x: 80 } }, 'bio-transform', 'weapon:opponent')
        .player.aura,
    ).toBe(100)
    expect(command(s, 'bio-transform', 'imaginary-camera')).toBe(s)
    const active = transform(s, 'kit:camera')
    expect(command(active, 'bio-transform', 'kit:camera')).toBe(active)
  })
  it('records appearances only during observation, retrieves actual footage and hides it from the opponent', () => {
    let s = transform(ready(), 'kit:camera')
    s = advanceBiohazardDevices({ ...s, frame: 30 })
    expect(
      s.player.biohazardDevices![1].recordings ?? s.player.biohazardDevices![0].recordings,
    ).toBeDefined()
    s = command(s, 'bio-camera-read')
    expect(s.player.biohazardFootage).toHaveLength(1)
    expect(privatePvpState(s, 'opponent').opponent.biohazardFootage).toBeUndefined()
    expect(
      privatePvpState(s, 'opponent').opponent.biohazardDevices!.every((d) => !d.recordings),
    ).toBe(true)
    const absent = advanceBiohazardDevices({ ...s, frame: 60, opponent: { ...s.opponent, x: 90 } })
    expect(command(absent, 'bio-camera-read').player.biohazardFootage).toHaveLength(1)
  })
  it('does not record through real cover or read a camera at a distance', () => {
    let s = transform(ready(), 'kit:camera')
    s = {
      ...s,
      frame: 30,
      opponent: { ...s.opponent, x: 45 },
      battlefield: {
        entities: [
          {
            id: 'cover',
            kind: 'crate',
            owner: 'neutral',
            material: 'real',
            present: true,
            health: 30,
            x: 35,
            y: 0,
            arena: { width: 3, height: 8 },
          },
        ],
        interactionHeld: { player: false, opponent: false },
        completed: { player: 0, opponent: 0 },
      },
    }
    s = advanceBiohazardDevices(s)
    expect(command(s, 'bio-camera-read').player.biohazardFootage).toEqual([])
    const far = { ...s, player: { ...s.player, x: 80 } }
    expect(command(far, 'bio-camera-read')).toBe(far)
  })
  it('carries a swallowed transmitter, then leaves the same physical oyster as a persistent signal', () => {
    let s = transform(ready(), 'kit:transmitter')
    s = advanceBiohazardDevices({ ...s, player: { ...s.player, x: 60 } })
    expect(command(s, 'bio-signal').player.biohazardSignal?.x).toBe(60)
    s = command(s, 'bio-oyster-hide')
    s = advanceBiohazardDevices({ ...s, player: { ...s.player, x: 20 } })
    expect(command(s, 'bio-signal').player.biohazardSignal?.x).toBe(60)
    expect(s.player.biohazardDevices!.find((d) => d.kind === 'transmitter')!.life).toBeGreaterThan(
      400000,
    )
  })
  it('interrupts preparation without duplicating equipment and never supplies the kit to Chrollo', () => {
    const started = command(ready(), 'bio-transform', 'kit:camera')
    const interrupted = advanceBiohazardDevices({
      ...started,
      player: { ...started.player, hitStun: 20 },
    })
    expect(interrupted.player.biohazardDevices!.find((d) => d.kind === 'camera')!.phase).toBe(
      'dropped',
    )
    expect(interrupted.player.biohazardDevices).toHaveLength(2)
    const other = beginFight(createFight('chrollo', 'hinrigh'))
    expect(other.player.biohazardDevices).toBeUndefined()
  })
  it('advances the device in the actual deterministic engine and preserves cuff inventory', () => {
    const started = command(ready(), 'bio-transform', 'kit:camera')
    let s = started
    for (let n = 0; n < 35; n++)
      s = tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    expect(s.player.biohazardDevices!.find((d) => d.kind === 'camera')!.phase).toBe('active')
    expect(s.player.biohazard!.objects).toHaveLength(2)
  })
})

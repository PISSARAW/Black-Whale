import { describe, expect, it } from 'vitest'
import { beginFight, createFight, nextRound, performAuraAttack, tickFight } from './engine'
import { performArsenalCommand } from './retrospectiveArsenal'
import { advanceBiohazardDevices } from './biohazardDeviceFrame'
import { spawnRangedProjectiles, canUseRangedAttack, projectileProfile } from './projectiles'
import { attackData } from './frameData'
import { forceZetsu } from './nen'
import { HINRIGH_KNIVES } from './hinrighKnives'
import { resolveFightImpacts } from './combatImpact'
import { EMPTY_INPUT, type FightState, type FighterId, type FightSide } from './types'
import type { ArsenalCommand } from './retrospectiveTypes'

function ready(id: FighterId = 'theta'): FightState {
  const s = beginFight(createFight('hinrigh', id, { mode: 'versus-local', formatId: 'knockout' }))
  return { ...s, player: { ...s.player, x: 25, aura: 100 }, opponent: { ...s.opponent, x: 29 } }
}
function command(
  s: FightState,
  action: ArsenalCommand['action'],
  target?: string,
  side: FightSide = 'player',
) {
  return performArsenalCommand(s, side, { action, target })
}
function transform(s: FightState, id: string) {
  s = command(s, 'bio-transform', id)
  for (let i = 0; i < 18; i++) s = advanceBiohazardDevices({ ...s, frame: s.frame + 1 })
  return s
}
function release(s: FightState, side: FightSide = 'player') {
  s = performAuraAttack({ state: s, side, kind: 'ranged', auraCharged: false })
  return spawnRangedProjectiles({
    ...s,
    [side]: {
      ...s[side],
      attack: { ...s[side].attack!, frame: attackData('ranged', s[side]).startup },
    },
  })
}
function device(s: FightState, kind: string) {
  return s.player.biohazardDevices!.find((d) => d.kind === kind)!
}

describe('Hinrigh: three-encounter applications', () => {
  it('exhausts real knives at release and restores only the next round’s equipment', () => {
    let s = ready()
    const started = performAuraAttack({
      state: s,
      side: 'player',
      kind: 'ranged',
      auraCharged: false,
    })
    expect(started.player.hinrighKnives).toBeUndefined()
    expect(
      advanceBiohazardDevices({ ...started, player: { ...started.player, attack: null } }).player
        .hinrighKnives,
    ).toBeUndefined()
    for (let i = 0; i < HINRIGH_KNIVES; i++) {
      s = release({ ...s, player: { ...s.player, attack: null } })
      expect(s.player.hinrighKnives).toBe(HINRIGH_KNIVES - i - 1)
    }
    expect(canUseRangedAttack(s.player)).toBe(false)
    const empty = { ...s, player: { ...s.player, attack: null } }
    expect(
      performAuraAttack({ state: empty, side: 'player', kind: 'ranged', auraCharged: false }),
    ).toBe(empty)
    const next = nextRound({ ...s, phase: 'finished', winner: 'player' })
    expect(canUseRangedAttack(next.player)).toBe(true)
  })
  it('does not give Biohazard’s borrower Hinrigh’s physical knife inventory', () => {
    let s = beginFight(createFight('kurapika', 'hinrigh', { mode: 'versus-local' }))
    s = performAuraAttack({ state: s, side: 'player', kind: 'ranged', auraCharged: false })
    const borrowed = {
      ...s,
      player: {
        ...s.player,
        id: 'hinrigh' as const,
        nenOwner: 'kurapika' as const,
        attack: { ...s.player.attack!, frame: attackData('ranged', s.player).startup },
      },
    }
    const fired = spawnRangedProjectiles(borrowed)
    expect(fired.projectiles[0]).toMatchObject({
      fighterId: 'kurapika',
      shape: 'bullet',
      matter: 'object',
    })
    expect(fired.player.hinrighKnives).toBeUndefined()
  })
  it('commits knife Shu at release and records a real cut on landing', () => {
    const s = ready(),
      before = { ...s, player: { ...s.player, nen: { ...s.player.nen, shu: ['knives'] } } }
    const launched = release(before),
      shot = launched.projectiles[0]
    expect(shot).toMatchObject({
      fighterId: 'hinrigh',
      matter: 'object',
      shape: 'needle',
      shuCharged: true,
    })
    const hit = resolveFightImpacts(launched, [
      { projectile: shot, defenderSide: 'opponent', position: { x: 29, y: shot.y } },
    ])
    expect(hit.opponent.openWounds).toBe(1)
  })
  it.each(['theta', 'camilla', 'benjamin'] as const)(
    'keeps %s’s real gun profile, stock and firing cadence',
    (id) => {
      let s = ready(id)
      if (id === 'camilla') s = { ...s, opponent: { ...s.opponent, camillaRounds: 2 } }
      s = transform(s, 'weapon:opponent')
      const stock = id === 'camilla' ? 2 : 6,
        profile = projectileProfile(id)
      expect(device(s, 'gun').ammo).toBe(stock)
      const fired = command(s, 'bio-gun-fire', 'weapon:opponent')
      expect(fired.projectiles[0]).toMatchObject({
        fighterId: id,
        damage: profile.damage,
        velocityX: profile.speed,
        matter: 'object',
        nenPower: 1,
      })
      expect(command(fired, 'bio-gun-fire', 'weapon:opponent')).toBe(fired)
      expect(device(fired, 'gun').ammo).toBe(stock - 1)
      const ended = advanceBiohazardDevices({
        ...fired,
        player: {
          ...forceZetsu(fired.player),
          biohazardDevices: fired.player.biohazardDevices!.map((d) =>
            d.kind === 'gun' ? { ...d, life: 0 } : d,
          ),
        },
      })
      expect(ended.opponent.biohazardGun).toBeUndefined()
      expect(ended.player.biohazardDevices!.some((d) => d.kind === 'gun')).toBe(false)
      const original = release(ended, 'opponent')
      expect(
        id === 'camilla' ? original.opponent.camillaRounds : original.opponent.biohazardGunRounds,
      ).toBe(stock - 2)
    },
  )
  it('can transform an empty real gun without manufacturing rounds or treating Feitan’s umbrella as a gun', () => {
    const s = ready('camilla')
    const empty = transform(
      { ...s, opponent: { ...s.opponent, camillaRounds: 0 } },
      'weapon:opponent',
    )
    expect(device(empty, 'gun').ammo).toBe(0)
    expect(command(empty, 'bio-gun-fire', 'weapon:opponent')).toBe(empty)
    const umbrella = ready('feitan')
    expect(command(umbrella, 'bio-transform', 'weapon:opponent')).toBe(umbrella)
  })
  it('continues transmitting from the real object after the oyster expires', () => {
    let s = transform(ready(), 'kit:transmitter')
    s = command(s, 'bio-oyster-hide')
    s = {
      ...s,
      player: {
        ...s.player,
        x: 75,
        biohazardDevices: s.player.biohazardDevices!.map((d) =>
          d.kind === 'transmitter' ? { ...d, life: 0 } : d,
        ),
      },
    }
    s = advanceBiohazardDevices(s)
    expect(device(s, 'transmitter').phase).toBe('dropped')
    const read = command({ ...s, player: forceZetsu(s.player) }, 'bio-signal')
    expect(read.player.biohazardSignal?.x).toBe(25)
    expect(read.player.biohazardSignal?.frame).toBe(s.frame)
  })
  it('does not magically regurgitate an oyster when Nen ends', () => {
    let s = transform(ready(), 'kit:transmitter')
    s = advanceBiohazardDevices({
      ...s,
      player: {
        ...forceZetsu({ ...s.player, x: 65 }),
        biohazardDevices: s.player.biohazardDevices!.map((d) =>
          d.kind === 'transmitter' ? { ...d, life: 0 } : d,
        ),
      },
    })
    s = advanceBiohazardDevices(s)
    expect(device(s, 'transmitter')).toMatchObject({ phase: 'dropped', swallowed: true, x: 65 })
    expect(command(s, 'bio-signal').player.biohazardSignal?.x).toBe(65)
  })
  it('hands over one real receiver at contact and lets its recipient track the original transmitter', () => {
    let s = transform(ready(), 'kit:transmitter')
    s = command(s, 'bio-oyster-hide')
    expect(command(s, 'bio-receiver-give')).toBe(s)
    s = { ...s, opponent: { ...s.opponent, supportConsent: true } }
    s = command(s, 'bio-receiver-give')
    expect(s.player.equipment).not.toContain('tracker-receiver')
    expect(s.opponent.equipment).toContain('tracker-receiver')
    expect(command(s, 'bio-signal')).toBe(s)
    const moved = { ...s, player: { ...s.player, x: 70 }, opponent: { ...s.opponent, x: 80 } }
    const read = command(moved, 'bio-signal', undefined, 'opponent')
    expect(read.opponent.biohazardSignal?.x).toBe(25)
    expect(command(moved, 'bio-receiver-give', undefined, 'opponent')).toBe(moved)
  })
  it('moves the cat by an explicit order and stops at a real obstacle', () => {
    let s = transform(ready(), 'kit:camera')
    s = command(s, 'bio-camera-move', 'right')
    for (let i = 0; i < 20; i++) s = advanceBiohazardDevices(s)
    expect(device(s, 'camera').x).toBeCloseTo(28)
    s = {
      ...s,
      battlefield: {
        entities: [
          {
            id: 'wall',
            kind: 'crate',
            owner: 'neutral',
            material: 'real',
            present: true,
            health: 40,
            x: 30,
            y: 0,
            arena: { width: 3, height: 8 },
          },
        ],
        interactionHeld: { player: false, opponent: false },
        completed: { player: 0, opponent: 0 },
      },
    }
    for (let i = 0; i < 50; i++) s = advanceBiohazardDevices(s)
    expect(device(s, 'camera').x).toBeLessThan(30)
    expect(device(s, 'camera').destinationX).toBeUndefined()
  })
  it('records with the physical camera after Nen reversion without continuing animal movement', () => {
    let s = transform(ready(), 'kit:camera')
    s = command(s, 'bio-camera-move', 'right')
    s = advanceBiohazardDevices({
      ...s,
      player: {
        ...forceZetsu(s.player),
        biohazardDevices: s.player.biohazardDevices!.map((d) =>
          d.kind === 'camera' ? { ...d, life: 0 } : d,
        ),
      },
    })
    const x = device(s, 'camera').x
    s = advanceBiohazardDevices({ ...s, frame: 30 })
    expect(device(s, 'camera')).toMatchObject({ phase: 'dropped', x })
    expect(command(s, 'bio-camera-read').player.biohazardFootage).toHaveLength(1)
  })
  it('advances the firing recovery in the actual engine', () => {
    let s = command(transform(ready(), 'weapon:opponent'), 'bio-gun-fire', 'weapon:opponent')
    for (let i = 0; i < 24; i++)
      s = tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    expect(s.player.biohazardRecovery).toBe(0)
  })
  it('keeps prepaid devices alive after Hinrigh exhausts his own aura', () => {
    let s = transform(ready(), 'kit:transmitter')
    s = advanceBiohazardDevices({ ...s, player: { ...s.player, aura: 0 } })
    expect(device(s, 'transmitter')).toMatchObject({ phase: 'active', swallowed: true })
    expect(command(s, 'bio-signal').player.biohazardSignal?.x).toBe(25)
    expect(command(s, 'bio-transform', 'kit:camera')).toBe(s)
  })
})

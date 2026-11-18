import { biohazardAuthority, biohazardBodyFree, biohazardNen } from './biohazard'
import { canAct } from './fightActorState'
import { priorityLineOfSight } from './priorityOptics'
import { hasEquipment } from './preparationWorld'
import { battleAppearance } from './battleCantabileRules'
import { hasBiohazardGun, touchedBiohazardGun, snakeBullet } from './biohazardGun'
import { performBiohazardReceiver } from './biohazardReceiver'
import { hasPrinceSidearm } from './princeSidearm'
import { biohazardHidingPlace } from './biohazardPrivacy'
import type { ProjectileProfile } from './projectiles'
import type { ArsenalInvocation } from './retrospectiveTypes'
import type { FightSide, FightState, FighterId } from './types'

export interface CameraSample {
  frame: number
  x: number
  y: number
  appearance: FighterId
}
export interface BiohazardDevice {
  id: string
  kind: 'camera' | 'transmitter' | 'gun'
  phase: 'carried' | 'preparing' | 'active' | 'dropped' | 'broken'
  x: number
  y: number
  frames: number
  life: number
  ammo?: number
  weaponSide?: FightSide
  weaponId?: FighterId
  gunProfile?: ProjectileProfile
  destinationX?: number
  concealedUnder?: string
  swallowed?: boolean
  recordings?: readonly CameraSample[]
}
declare module './types' {
  interface ArcadeFighter {
    biohazardDevices?: readonly BiohazardDevice[]
    biohazardGun?: { owner: FightSide; deviceId: string }
    biohazardFootage?: readonly CameraSample[]
    biohazardSignal?: { frame: number; x: number; y: number }
  }
}

/** Physical carried equipment. Borrowing the Hatsu does not manufacture this kit. */
export function createBiohazardDevices(): readonly BiohazardDevice[] {
  return ['camera', 'transmitter'].map((kind) => ({
    id: `kit:${kind}`,
    kind: kind as 'camera' | 'transmitter',
    phase: 'carried',
    x: 0,
    y: 0,
    frames: 0,
    life: 0,
  }))
}

export function biohazardDeviceReady(state: FightState, side: FightSide): boolean {
  const actor = state[side]
  return (
    state.phase === 'fighting' &&
    !state.catsName &&
    canAct(actor) &&
    !actor.attack &&
    biohazardBodyFree(actor) &&
    !actor.hanzoProjection &&
    !actor.biohazardDevices?.some((item) => item.phase === 'preparing')
  )
}

export function performBiohazardDevice({ state, side, command }: ArsenalInvocation): FightState {
  if (!biohazardDeviceReady(state, side)) return state
  const physical = physicalDeviceCommand({ state, side, command })
  if (physical) return physical
  if (!biohazardAuthority(state[side]) || !biohazardNen(state[side])) return state
  if (command.action === 'bio-camera-move') return moveCamera(state, side, command.target)
  if (command.action === 'bio-gun-fire') return fireSnakeGun(state, side, command.target)
  return command.action === 'bio-transform' ? transformDevice(state, side, command.target) : state
}

function physicalDeviceCommand({
  state,
  side,
  command,
}: ArsenalInvocation): FightState | undefined {
  if (command.action === 'bio-receiver-give') return performBiohazardReceiver(state, side)
  if (command.action === 'bio-camera-read') return readCamera(state, side)
  if (command.action === 'bio-signal') return readSignal(state, side)
  if (command.action === 'bio-recover') return recoverDevice(state, side, command.target)
  if (command.action === 'bio-oyster-hide') return hideOyster(state, side)
  return undefined
}

function transformDevice(state: FightState, side: FightSide, id?: string): FightState {
  if (state[side].aura < 20) return state
  const actor = state[side]
  const other = side === 'player' ? 'opponent' : 'player'
  if (id === other) id = `weapon:${other}`
  const gun = id === `weapon:${other}` && touchGun(state, side)
  const item = gun ? touchedBiohazardGun(state, other) : carriedDevice(actor, id)
  if (!item) return state
  const active: BiohazardDevice = {
    ...item,
    phase: 'preparing',
    ...devicePosition({ gun, item, actor }),
    frames: 0,
    life: bioDeviceLifetime(item.kind),
  }
  const devices = [
    ...(actor.biohazardDevices ?? []).filter((entry) => entry.id !== item.id),
    active,
  ]
  return {
    ...state,
    [side]: { ...actor, aura: actor.aura - 20, biohazardDevices: devices },
    ...(gun
      ? {
          [other]: {
            ...state[other],
            biohazardGunRounds: item.ammo,
            biohazardGun: { owner: side, deviceId: item.id },
          },
        }
      : {}),
  }
}

function devicePosition({
  gun,
  item,
  actor,
}: {
  gun: boolean
  item: BiohazardDevice
  actor: FightState['player']
}): { x: number; y: number } {
  return gun ? { x: item.x, y: item.y } : { x: actor.x, y: actor.y }
}

function bioDeviceLifetime(kind: BiohazardDevice['kind']): number {
  return kind === 'transmitter' ? 2 * 60 * 60 * 60 : 300 * 60
}

function carriedDevice(actor: FightState['player'], id?: string): BiohazardDevice | undefined {
  return actor.biohazardDevices?.find((entry) => entry.id === id && entry.phase === 'carried')
}

export function touchGun(state: FightState, side: FightSide): boolean {
  const other = side === 'player' ? 'opponent' : 'player'
  const target = state[other]
  return (
    hasBiohazardGun(target) &&
    !target.biohazardGun &&
    !target.weaponsConfiscated &&
    !target.hanzoProjection &&
    Math.hypot(state[side].x - target.x, state[side].y - target.y) <= 6
  )
}

function fireSnakeGun(state: FightState, side: FightSide, id?: string): FightState {
  const item = state[side].biohazardDevices?.find((entry) => entry.id === id)
  if (!item || item.kind !== 'gun' || item.phase !== 'active' || !item.ammo) return state
  const next = storeBioDevice(state, side, { ...item, ammo: item.ammo - 1 })
  const weaponSide = item.weaponSide
  if (!weaponSide) return state
  return {
    ...next,
    [side]: { ...next[side], biohazardRecovery: 12 },
    [weaponSide]: {
      ...next[weaponSide],
      biohazardGunRounds: item.ammo - 1,
      ...(hasPrinceSidearm(next[weaponSide]) ? { princeSidearmRounds: item.ammo - 1 } : {}),
      ...((next[weaponSide].nenOwner ?? next[weaponSide].id) === 'camilla'
        ? { camillaRounds: item.ammo - 1 }
        : {}),
    },
    nextProjectileId: state.nextProjectileId + 1,
    projectiles: [...state.projectiles, snakeBullet(state, side, item)],
  }
}

function readCamera(state: FightState, side: FightSide): FightState {
  const item = state[side].biohazardDevices?.find((entry) => entry.kind === 'camera')
  if (!item || item.phase === 'broken' || !deviceInReach(state, side, item)) return state
  return { ...state, [side]: { ...state[side], biohazardFootage: [...(item.recordings ?? [])] } }
}

function readSignal(state: FightState, side: FightSide): FightState {
  const receiver = state[side].biohazardReceiver ?? { owner: side, deviceId: 'kit:transmitter' }
  const item = state[receiver.owner].biohazardDevices?.find(
    (entry) => entry.id === receiver.deviceId,
  )
  if (!item || item.phase === 'broken' || !hasEquipment(state[side], 'tracker-receiver'))
    return state
  return {
    ...state,
    [side]: {
      ...state[side],
      biohazardSignal: {
        frame: state.frame,
        x: item.phase === 'carried' || item.swallowed ? state[receiver.owner].x : item.x,
        y: item.phase === 'carried' || item.swallowed ? state[receiver.owner].y + 4 : item.y,
      },
    },
  }
}

function moveCamera(state: FightState, side: FightSide, target?: string): FightState {
  const item = state[side].biohazardDevices?.find((entry) => entry.kind === 'camera')
  if (!item || item.phase !== 'active' || !['left', 'right', 'stop'].includes(target ?? ''))
    return state
  const destinationX = target === 'stop' ? item.x : target === 'left' ? 7 : 93
  if (destinationX === item.destinationX) return state
  return storeBioDevice(state, side, { ...item, destinationX })
}

function hideOyster(state: FightState, side: FightSide): FightState {
  const item = state[side].biohazardDevices?.find((entry) => entry.kind === 'transmitter')
  if (!item?.swallowed || !['active', 'dropped'].includes(item.phase)) return state
  const cover = biohazardHidingPlace(state, side)
  return storeBioDevice(state, side, {
    ...item,
    swallowed: false,
    x: cover?.x ?? state[side].x,
    y: cover?.y ?? 0,
    concealedUnder: cover?.id,
  })
}

function recoverDevice(state: FightState, side: FightSide, id?: string): FightState {
  const item = state[side].biohazardDevices?.find((entry) => entry.id === id)
  if (!item || item.phase === 'broken' || !deviceInReach(state, side, item)) return state
  const next = storeBioDevice(state, side, {
    ...item,
    phase: 'carried',
    swallowed: false,
    destinationX: undefined,
    concealedUnder: undefined,
  })
  return releaseDeviceGun(next, side, item)
}

export function deviceInReach(state: FightState, side: FightSide, item: BiohazardDevice): boolean {
  return item.phase === 'carried' || Math.hypot(item.x - state[side].x, item.y - state[side].y) <= 6
}

export function storeBioDevice(
  state: FightState,
  side: FightSide,
  item: BiohazardDevice,
): FightState {
  return {
    ...state,
    [side]: {
      ...state[side],
      biohazardDevices: state[side].biohazardDevices!.map((entry) =>
        entry.id === item.id ? item : entry,
      ),
    },
  }
}

export function releaseDeviceGun(
  state: FightState,
  side: FightSide,
  item: BiohazardDevice,
): FightState {
  const victim = item.weaponSide
  if (!victim || state[victim].biohazardGun?.owner !== side) return state
  return {
    ...state,
    [side]: {
      ...state[side],
      biohazardDevices: state[side].biohazardDevices?.filter((held) => held.id !== item.id),
    },
    [victim]: { ...state[victim], biohazardGun: undefined },
  }
}

/** Normal optics records appearances, never hidden Nen, true identity or future inputs. */
export function cameraSees(
  state: FightState,
  item: BiohazardDevice,
  side: FightSide,
): CameraSample | null {
  const target = state[side === 'player' ? 'opponent' : 'player']
  if (Math.abs(target.x - item.x) > 30) return null
  const blocked = !priorityLineOfSight(state, {
    x: item.x,
    y: item.y + 2,
    targetX: target.x,
    targetY: target.y + 10,
  })
  return blocked
    ? null
    : { frame: state.frame, x: target.x, y: target.y, appearance: battleAppearance(target) }
}

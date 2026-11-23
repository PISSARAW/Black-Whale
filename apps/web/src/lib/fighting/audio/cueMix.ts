import type { FightSoundEvent, FightSoundKind } from './events'
import type { FightChannel } from './settings'

type Channel = Exclude<FightChannel, 'cinematics'>
const CHANNELS: Partial<Record<FightSoundKind, Channel>> = {
  intro: 'music',
  stage: 'music',
  clock: 'tension',
  watch: 'tension',
  windup: 'voices',
  wakeup: 'voices',
  step: 'movement',
  dash: 'movement',
  jump: 'movement',
  land: 'movement',
  fall: 'movement',
  crouch: 'movement',
  guard: 'movement',
  hatsu: 'techniques',
  nen: 'techniques',
  charge: 'techniques',
  projectile: 'techniques',
  'emperor-on': 'techniques',
  'emperor-off': 'techniques',
  heartbeat: 'techniques',
  armour: 'techniques',
  sun: 'techniques',
  transform: 'techniques',
  projection: 'techniques',
  page: 'techniques',
  gum: 'techniques',
  seal: 'techniques',
  lsdf: 'techniques',
  effect: 'techniques',
  'easter-egg': 'techniques',
  'assist-action': 'techniques',
  score: 'interface',
  'assist-ready': 'interface',
  'nen-low': 'interface',
  'nen-empty': 'interface',
  'hatsu-ready': 'interface',
  'charge-ready': 'interface',
  refused: 'interface',
  'health-low': 'interface',
}
const DECISIVE = new Set<FightSoundKind>(['finish', 'burst', 'ko-clash', 'breach', 'throw-tech'])
const FOREGROUND = new Set<FightSoundKind>([
  'start',
  'impact',
  'assist-entry',
  'assist-action',
  'assist-interrupted',
  'projectile-intercept',
])

export function fightCueMix(event: FightSoundEvent): { channel: Channel; priority: number } {
  const channel = CHANNELS[event.kind] ?? 'effects'
  if (DECISIVE.has(event.kind) || event.impact?.parried) return { channel, priority: 3 }
  if (FOREGROUND.has(event.kind)) return { channel, priority: 2 }
  return { channel, priority: channel === 'interface' ? 1 : 0 }
}

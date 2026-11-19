import { performDeviceCommand } from './deviceActions'
import { ownsDeviceBiohazard } from './biohazardDevices'
import { touchesDevice, holdsDevice } from './physicalDevices'
import type { PhysicalDeviceKind } from './deviceTypes'
import type { PreparedEntity } from './preparationTypes'
import type { ArsenalActionId, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

const NAMES: Record<PhysicalDeviceKind, [string, string]> = {
  camera: ['Caméra', 'Camera'],
  firearm: ['Arme à feu', 'Firearm'],
  transmitter: ['Émetteur', 'Transmitter'],
  receiver: ['Récepteur', 'Receiver'],
}
const LABELS: Partial<Record<ArsenalActionId, [string, string]>> = {
  'biohazard-device-cancel': ['Biohazard · Interrompre le contact', 'Biohazard · Stop touching'],
  'biohazard-device': ['Biohazard · Transformer au contact', 'Biohazard · Transform by touch'],
  'biohazard-device-end': [
    'Biohazard · Rendre sa forme à l’objet',
    'Biohazard · Restore the object',
  ],
  'biohazard-swallow': ['Avaler l’huître-émetteur', 'Swallow the oyster transmitter'],
  'biohazard-place': ['Ressortir et déposer l’huître', 'Regurgitate and place the oyster'],
  'biohazard-cat-left': ['Chat · Aller à gauche', 'Cat · Walk left'],
  'biohazard-cat-right': ['Chat · Aller à droite', 'Cat · Walk right'],
  'biohazard-cat-recall': ['Chat · Revenir vers moi', 'Cat · Return to me'],
  'biohazard-cat-stay': ['Chat · Rester ici', 'Cat · Stay here'],
  'device-pickup': ['Prendre l’objet', 'Pick up the object'],
  'device-drop': ['Déposer l’objet', 'Put the object down'],
  'device-record': ['Enregistrement · Marche/arrêt', 'Recording · Start/stop'],
  'device-watch': [
    'Lire les images et paroles enregistrées',
    'Watch the recorded images and speech',
  ],
  'device-fire': ['Tirer une balle réelle', 'Fire one real bullet'],
  'device-signal': ['Consulter le récepteur', 'Read the receiver'],
  'device-face-left': ['Caméra · Viser à gauche', 'Camera · Aim left'],
  'device-face-right': ['Caméra · Viser à droite', 'Camera · Aim right'],
}
export function deviceOptions(state: FightState, side: FightSide): ArsenalOption[] {
  return (state.battlefield?.entities ?? [])
    .filter((entry) => entry.kind === 'device' && entry.device && entry.present && entry.health > 0)
    .flatMap((entry) => optionsForDevice(state, side, entry))
}
function optionsForDevice(
  state: FightState,
  side: FightSide,
  entry: PreparedEntity,
): ArsenalOption[] {
  const device = entry.device!,
    actions: ArsenalActionId[] = []
  if (!device.carrier && touchesDevice(state, side, entry)) actions.push('device-pickup')
  if (holdsDevice(state, side, entry) && !device.swallowed) actions.push('device-drop')
  actions.push(...biohazardDeviceOptions(state, side, entry))
  actions.push(...deviceFunctionOptions(state, side, entry))
  return actions.map((action) => makeOption(state, side, { entry, action }))
}
function biohazardDeviceOptions(
  state: FightState,
  side: FightSide,
  entry: PreparedEntity,
): ArsenalActionId[] {
  const device = entry.device!,
    actions: ArsenalActionId[] = []
  if (device.transforming?.owner === side) actions.push('biohazard-device-cancel')
  if (device.form?.owner === side) actions.push('biohazard-device-end')
  if (!device.form && ownsDeviceBiohazard(state, side) && device.kind !== 'receiver')
    actions.push('biohazard-device')
  return actions
}
function deviceFunctionOptions(
  state: FightState,
  side: FightSide,
  entry: PreparedEntity,
): ArsenalActionId[] {
  const creature = creatureFunctionOptions(state, side, entry)
  if (creature) return creature
  const device = entry.device!
  if (!touchesDevice(state, side, entry) && device.form?.owner !== side) return []
  if (device.kind === 'camera')
    return ['device-record', 'device-watch', 'device-face-left', 'device-face-right']
  return device.kind === 'firearm'
    ? ['device-fire']
    : device.kind === 'receiver'
      ? ['device-signal']
      : []
}
function creatureFunctionOptions(
  state: FightState,
  side: FightSide,
  entry: PreparedEntity,
): ArsenalActionId[] | null {
  const device = entry.device!
  if (device.form?.kind === 'oyster')
    return device.swallowed && holdsDevice(state, side, entry)
      ? ['biohazard-place']
      : ['biohazard-swallow']
  if (device.form?.kind !== 'cat' || device.form.owner !== side) return null
  const actions: ArsenalActionId[] = [
    'biohazard-cat-left',
    'biohazard-cat-right',
    'biohazard-cat-stay',
    'biohazard-cat-recall',
  ]
  if (touchesDevice(state, side, entry))
    actions.push('device-record', 'device-watch', 'device-face-left', 'device-face-right')
  return actions
}
function makeOption(
  state: FightState,
  side: FightSide,
  input: { entry: PreparedEntity; action: ArsenalActionId },
): ArsenalOption {
  const { entry, action } = input,
    device = entry.device!,
    label = LABELS[action]!,
    name = NAMES[device.kind]
  const command = { action, target: entry.id }
  return {
    command,
    labelFr: `${name[0]} · ${label[0]}`,
    labelEn: `${name[1]} · ${label[1]}`,
    ready: performDeviceCommand(state, side, command) !== state,
    conditionFr:
      'Objet réel présent : contact initial, fonction et stock conservés. Transformation interrompue si le contact est rompu. L’huître dure environ deux heures simulées ; les autres durées, coûts et stocks sont des réglages de scénario.',
    conditionEn:
      'A real object must be present: initial touch, original function and stock are preserved. Breaking contact interrupts transformation. The oyster lasts about two simulated hours; other durations, costs and stocks are scenario tuning.',
  }
}

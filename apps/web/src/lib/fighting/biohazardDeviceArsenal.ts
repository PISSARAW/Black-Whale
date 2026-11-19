import { biohazardDeviceReady, performBiohazardDevice, touchGun } from './legacyBiohazardDevices'
import { biohazardAuthority } from './biohazard'
import { hasEquipment } from './preparationWorld'
import { hinrighCounterOptions } from './hinrighCounter'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

export function biohazardDeviceOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (
    !biohazardAuthority(state[side]) &&
    !state[side].biohazardDevices?.length &&
    !hasEquipment(state[side], 'tracker-receiver')
  )
    return []
  const commands: { command: ArsenalCommand; fr: string; en: string }[] = []
  commands.push(...deviceCommands(state, side))
  if (hasEquipment(state[side], 'tracker-receiver'))
    commands.push({
      command: { action: 'bio-receiver-give' },
      fr: 'Récepteur · Donner en main propre',
      en: 'Receiver · Hand over',
    })
  if (touchGun(state, side))
    commands.push({
      command: {
        action: 'bio-transform',
        target: side === 'player' ? 'opponent' : 'player',
      },
      fr: 'Toucher l’arme adverse · Serpent',
      en: 'Touch enemy gun · Snake',
    })
  commands.push(
    {
      command: { action: 'bio-camera-read' },
      fr: 'Caméra · Consulter l’enregistrement',
      en: 'Camera · Review footage',
    },
    {
      command: { action: 'bio-signal' },
      fr: 'Émetteur · Lire la position',
      en: 'Transmitter · Read position',
    },
    {
      command: { action: 'bio-oyster-hide' },
      fr: 'Huître · Régurgiter et dissimuler',
      en: 'Oyster · Regurgitate and hide',
    },
  )
  return [
    ...hinrighCounterOptions(state, side),
    ...commands.map(({ command, fr, en }) => ({
      command,
      labelFr: fr,
      labelEn: en,
      ready:
        command.action === 'bio-signal'
          ? biohazardDeviceReady(state, side) && hasEquipment(state[side], 'tracker-receiver')
          : performBiohazardDevice({ state, side, command }) !== state,
      conditionFr:
        'Objet réel, contact et préparation vulnérable. La caméra conserve uniquement ce qu’elle filme ; lecture à proximité. Le récepteur se transmet à un destinataire consentant au contact. Après deux heures, l’huître redevient un émetteur fonctionnel. Munitions, cadence, portée et coût : réglages du duel.',
      conditionEn:
        'Real object, touch and interruptible preparation. The camera records only what it sees; review requires proximity. Hand the receiver to a consenting recipient at hand reach. After two hours the oyster reverts to a working transmitter. Ammo, cadence, range and cost are duel tuning.',
    })),
  ]
}

function deviceCommands(state: FightState, side: FightSide) {
  const commands: { command: ArsenalCommand; fr: string; en: string }[] = []
  for (const item of state[side].biohazardDevices ?? []) {
    const name = {
      camera: ['Caméra-chat', 'Cat camera'],
      transmitter: ['Émetteur-huître', 'Oyster transmitter'],
      gun: ['Arme-serpent', 'Snake gun'],
    }[item.kind]
    commands.push({
      command: { action: 'bio-transform', target: item.id },
      fr: `Transformer · ${name[0]}`,
      en: `Transform · ${name[1]}`,
    })
    if (item.phase !== 'carried')
      commands.push({
        command: { action: 'bio-recover', target: item.id },
        fr: `Reprendre · ${name[0]}`,
        en: `Recover · ${name[1]}`,
      })
    if (item.kind === 'gun')
      commands.push({
        command: { action: 'bio-gun-fire', target: item.id },
        fr: `Arme-serpent · Tirer (${item.ammo ?? 0})`,
        en: `Snake gun · Fire (${item.ammo ?? 0})`,
      })
    if (item.kind === 'camera' && item.phase === 'active')
      for (const [target, fr, en] of [
        ['left', 'gauche', 'left'],
        ['right', 'droite', 'right'],
        ['stop', 'arrêter', 'stop'],
      ])
        commands.push({
          command: { action: 'bio-camera-move', target },
          fr: `Chat · ${fr}`,
          en: `Cat · ${en}`,
        })
  }
  return commands
}

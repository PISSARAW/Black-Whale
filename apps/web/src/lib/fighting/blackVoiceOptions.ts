import { performBlackVoiceCommand } from './blackVoiceAction'
import { voiceTargets, type VoiceTarget } from './blackVoiceTargets'
import type { ArsenalActionId, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

type AddOption = (action: ArsenalActionId, text: [string, string], target?: string) => void
export function blackVoiceOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const options: ArsenalOption[] = []
  const add: AddOption = (action, text, target) => {
    const command = { action, target }
    options.push({
      command,
      labelFr: `Black Voice · ${text[0]}`,
      labelEn: `Black Voice · ${text[1]}`,
      ready: performBlackVoiceCommand(state, side, command) !== state,
      conditionFr:
        'Téléphone original associé et deux antennes matérielles au maximum. Livre et objets occupent leurs mains. Aucun délai de libération automatique.',
      conditionEn:
        'Original paired phone and at most two physical antennas. Book and objects occupy their hands. No automatic release timer.',
    })
  }
  if (state[side].blackVoiceGear) gearOptions(add)
  for (const target of voiceTargets(state)) subjectOptions({ state, side, target }, add)
  for (const entry of state.battlefield?.entities ?? []) {
    if (entry.kind !== 'black-voice' || !entry.present) continue
    const phone = entry.blackVoicePiece?.part === 'phone'
    add(
      'voice-pickup',
      phone
        ? ['Ramasser le téléphone', 'Pick up the phone']
        : ['Ramasser l’antenne', 'Pick up the antenna'],
      entry.id,
    )
  }
  return options
}
function gearOptions(add: AddOption) {
  add('voice-arm', ['Sortir une antenne', 'Draw an antenna'])
  add('voice-phone', ['Prendre le téléphone', 'Hold the phone'])
  add('voice-pocket', ['Ranger les objets tenus', 'Pocket held objects'])
  add('voice-drop', ['Déposer le téléphone', 'Drop the phone'], 'phone')
  add('voice-drop', ['Déposer une antenne', 'Drop an antenna'], 'antenna')
}
function subjectOptions(
  context: { state: FightState; side: FightSide; target: VoiceTarget },
  add: AddOption,
) {
  const { state, side, target } = context
  const name = target.body?.id ?? (target.entity?.kind === 'morena' ? 'Morena' : 'partisan')
  if (state[side].id === 'chrollo')
    add('voice-implant', [`Implanter · ${name}`, `Implant · ${name}`], target.id)
  if (!target.control) return
  add('voice-remove', [`Retirer l’antenne · ${name}`, `Remove antenna · ${name}`], target.id)
  if (target.control.owner !== side) return
  add(
    'voice-watch',
    [`Regarder par ses yeux · ${name}`, `Watch through their eyes · ${name}`],
    target.id,
  )
  add('voice-stay', [`Immobiliser · ${name}`, `Stay still · ${name}`], target.id)
  add('voice-retreat', [`Faire reculer · ${name}`, `Retreat · ${name}`], target.id)
  add('voice-approach', [`Faire approcher · ${name}`, `Approach · ${name}`], target.id)
  add(
    'voice-attack',
    [`Attaquer l’autre combattant · ${name}`, `Attack the other fighter · ${name}`],
    target.id,
  )
  add(
    'voice-spoken-attack',
    [`Dicter l’ordre d’attaque · ${name}`, `Speak the attack order · ${name}`],
    target.id,
  )
}

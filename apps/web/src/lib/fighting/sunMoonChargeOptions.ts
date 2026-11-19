import { ENTITY_LABELS } from './preparationEntityLabels'
import type { PreparedEntity } from './preparationTypes'
import type { ObjectMark } from './sunMoonObjectHands'
import { performSunMoonCharge } from './sunMoonCharge'
import type { ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

export function sunMoonChargeOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (state[side].id !== 'chrollo') return []
  const pending = state.arena?.pending[side]
  if (pending?.charge)
    return [
      {
        command: { action: 'sun-moon-release' },
        ready: true,
        labelFr: `Relâcher le contact · ${((300 - pending.frames) / 60).toFixed(1)} / 5 s`,
        labelEn: `Release contact · ${((300 - pending.frames) / 60).toFixed(1)} / 5 s`,
        conditionFr: 'La marque reste en place avec la charge déjà obtenue.',
        conditionEn: 'The mark remains with the charge already reached.',
      },
    ]
  return (state.battlefield?.entities ?? [])
    .filter(chargeableObject)
    .flatMap((entry) =>
      (['sun', 'moon'] as const).map((mark) => chargeOption(state, side, { entry, mark })),
    )
}
function chargeableObject(entry: PreparedEntity): boolean {
  return Boolean(entry.arena && entry.present && entry.health > 0)
}
function chargeOption(
  state: FightState,
  side: FightSide,
  context: { entry: PreparedEntity; mark: ObjectMark },
): ArsenalOption {
  const { entry, mark } = context
  const command = {
    action: mark === 'sun' ? ('sun-moon-charge-sun' as const) : ('sun-moon-charge-moon' as const),
    target: entry.id,
  }
  return {
    command,
    ready: performSunMoonCharge(state, side, command) !== state,
    labelFr: `${mark === 'sun' ? 'Soleil' : 'Lune'} · charger cinq secondes · ${ENTITY_LABELS.fr[entry.kind]} (${Math.round(entry.x)})`,
    labelEn: `${mark === 'sun' ? 'Sun' : 'Moon'} · charge for five seconds · ${ENTITY_LABELS.en[entry.kind]} (${Math.round(entry.x)})`,
    conditionFr:
      'Contact continu de la main requise, page active et 12 aura. Une rupture conserve la marque sans compléter sa charge.',
    conditionEn:
      'Continuous required-hand contact, active page and 12 aura. Interrupted contact preserves the mark without completing its charge.',
  }
}

import { hasBodyguardFirearm } from './bodyguardFirearms'
import { addServiceHandgun } from './serviceHandgun'
import type { ArcadeFighter } from './types'

export function addBodyguardPistol(
  options: Omit<Parameters<typeof addServiceHandgun>[0], 'owner' | 'hand'> & {
    fighter: ArcadeFighter
  },
): void {
  const { fighter } = options
  if (!hasBodyguardFirearm(fighter.id) || ['theta', 'musse'].includes(fighter.id)) return
  addServiceHandgun({
    ...options,
    owner: fighter.id,
    hand: fighter.id === 'kurapika' ? 'left' : 'right',
  })
}

import { signatureOpeningId, signatureTransitionId } from './alternateSignatureAttacks'
import { ALTERNATE_SIGNATURE_MOVES } from './alternateSignatureMoves'
import { FIGHTING_ROSTER } from './roster'
import type { CombatFighter } from './combatRoutes'
import type { SignatureCombo } from './signatureCombos'

export const ALTERNATE_SIGNATURE_COMBOS: readonly SignatureCombo[] = FIGHTING_ROSTER.map(
  ({ id }) => {
    const attack = ALTERNATE_SIGNATURE_MOVES[id]
    if (!attack) throw Error(`Missing alternate signature for ${id}`)
    const finisher = `${id}:${attack.id}` as const
    return {
      id: `${id}:alternate-signature`,
      fighter: id as CombatFighter,
      opponent: id === 'kurapika' ? 'hisoka' : 'kurapika',
      ...(id === 'kurapika' ? { initialGap: 15 } : {}),
      title: attack.name,
      requirement: [
        'Lance l’ouverture au sol et confirme chaque touche avant le mouvement suivant.',
        'Start the opening on the ground and confirm each hit before the next move.',
      ],
      steps: [
        { signatureAttack: signatureOpeningId(finisher) },
        { signatureAttack: signatureTransitionId(finisher) },
        { signatureAttack: finisher },
      ],
    }
  },
)

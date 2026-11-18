import type { DirectionalEnding } from '../../src/lib/fighting/directionalChain'
import { directionalTechnique } from '../../src/lib/fighting/directionalTechniques'
import { COMBAT_FIGHTERS } from '../../src/lib/fighting/combatRoutes'
import type { FighterId } from '../../src/lib/fighting/types'

export const ENDINGS: readonly DirectionalEnding[] = ['ground', 'air', 'close', 'carry']
/** Closing order: the two loudest techniques end the edit. */
const FINALE: FighterId[] = ['franklin', 'biscuit']

/**
 * Strict ground → air → close → carry rotation over the 40 fighters. Fighters whose
 * close or carry finish reaches a personal technique take those slots first, so the
 * rotation shows as many full-screen Hatsu as the roster allows.
 */
export function lineup(only?: readonly string[]) {
  const roster = (COMBAT_FIGHTERS as readonly FighterId[]).filter(
    (id) => !only || only.includes(id),
  )
  const pool = roster.filter((id) => !FINALE.includes(id))
  const finale = FINALE.filter((id) => roster.includes(id))
  const order: { id: FighterId; ending: DirectionalEnding }[] = []
  const total = roster.length
  for (let slot = 0; slot < total; slot++) {
    const ending = ENDINGS[slot % 4]
    let carriesLeft = 0
    for (let s = slot; s < total; s++) if (s % 4 === 3) carriesLeft++
    const reserved = ending === 'carry' && carriesLeft <= finale.length
    if (reserved || (pool.length === 0 && finale.length)) {
      order.push({ id: finale.shift()!, ending })
      continue
    }
    const wants = pool.findIndex((id) => directionalTechnique(id, ending))
    const plain = pool.findIndex(
      (id) => !directionalTechnique(id, 'carry') && !directionalTechnique(id, 'close'),
    )
    const pick = wants >= 0 && ending !== 'ground' && ending !== 'air' ? wants : plain >= 0 ? plain : 0
    order.push({ id: pool.splice(pick, 1)[0], ending })
  }
  return order
}

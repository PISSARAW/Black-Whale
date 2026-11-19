import { performGumResuscitation } from './gumResuscitationAction'
import { physicalBodyKey } from './fightBodyIdentity'
import { recordFightDeath } from './fightDeaths'
import { resolveFightOutcome } from './fightOutcome'
import { DAMAGED_BODY_PARTS, DAMAGED_SURFACES } from './bodyDamage'
import type { FightState } from './types'

/** Replay the declared ch.357 circumstances, including the order given before death.
 * This is a historical premise, never a free resurrection attached to every zero-HP hit.
 */
export function prepareHisokaAsphyxia(state: FightState): FightState {
  const preparation = state.environment.preparation
  if (preparation?.mode !== 'scenario' || !preparation.resources.includes('hisoka-asphyxia'))
    return state
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const programmed = performGumResuscitation(next, side, { action: 'gum-program-resuscitation' })
    if (programmed === next) continue
    const body = programmed[side]
    next = {
      ...programmed,
      preparedAsphyxia: [...(next.preparedAsphyxia ?? []), side],
      [side]: {
        ...body,
        arenaRecovery: 0,
        bodyDamage: {
          parts: [
            ...new Set([
              ...(body.bodyDamage?.parts ?? []),
              ...DAMAGED_BODY_PARTS,
              ...DAMAGED_SURFACES,
            ]),
          ],
        },
        openWounds: Math.max(body.openWounds ?? 0, 4),
        asphyxiaCertificate: {
          bodyKey: physicalBodyKey(programmed, side),
          cause: 'asphyxia',
          heartIntact: true,
          lungsIntact: true,
          airwayClear: true,
          oxygenRestored: true,
          viable: true,
          traumaHealth: Math.max(1, Math.floor(body.health / 2)),
        },
      },
    }
  }
  return next
}
export function beginPreparedAsphyxia(state: FightState): FightState {
  if (!state.preparedAsphyxia?.length) return state
  let next: FightState = { ...state, preparedAsphyxia: undefined }
  for (const side of state.preparedAsphyxia) {
    next = recordFightDeath(
      { ...next, [side]: { ...next[side], health: 0, pose: 'ko' } },
      {
        victimSide: side,
        killerSide: null,
        cause: 'asphyxia',
        fatalCondition: true,
      },
    )
  }
  return resolveFightOutcome(next)
}

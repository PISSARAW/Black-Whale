import { resolveHatsuImpact } from './hatsu'
import { recordDolphinEffects } from './kurapikaDolphin'
import { otherSide } from './frameData'
import { sleepingBody } from './hanzoProjection'
import type { ImpactDefence } from './combatDamage'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** Grimmel pierces defensive Nen and swaps minds; it is not a damaging martial carrier. */
export function resolveHalkenburgContact(context: {
  state: FightState
  side: FightSide
  defence: ImpactDefence
  spent: ArcadeFighter
}): FightState | null {
  const { state, side, spent } = context
  const attack = state[side].attack
  if (attack?.hatsuSource !== 'halkenburg' || !state[side].hatsuEffects.arrowNocked) return null
  const target = otherSide(side)
  const body = sleepingBody(state[target])
  const touched: FightState = {
    ...state,
    [side]: spent,
    impact: {
      sequence: (state.impact?.sequence ?? 0) + 1,
      attacker: side,
      kind: attack.kind,
      damage: 0,
      blocked: false,
      parried: false,
      avoided: false,
      critical: false,
      knockdown: false,
      counterHit: false,
      punish: false,
      antiAir: false,
      wallSplat: false,
      invulnerable: false,
      comboHits: 0,
      damageScale: 1,
      points: 0,
      zone: 'torso',
      concealed: Boolean(attack.concealed),
      projectileId: null,
      position: { x: body.x, y: body.y + 6 },
    },
    hitstop: 0,
  }
  const swapped = resolveHatsuImpact({
    state: touched,
    side,
    defenderSide: target,
    source: 'halkenburg',
    moveId: attack.moveId,
    blocked: false,
    concealed: attack.concealed,
  })
  return recordDolphinEffects(state, swapped, side)
}

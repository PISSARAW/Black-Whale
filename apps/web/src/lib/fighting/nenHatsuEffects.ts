import { nenOperationCategory, nenOperationPower } from './nenOperations'
import { fightAbility } from './nenAbility'
import type { FightSide, FightState, FighterHatsuEffects } from './types'

// Only durations which are explicitly duel tuning. A canonical oath, death,
// consent, target condition, or fixed rule (e.g. Judgment Chain) is never scaled.
const CONTROL_DURATIONS: readonly (keyof FighterHatsuEffects)[] = ['restrainedFrames']

export function scaleNenControl(
  before: FightState,
  after: FightState,
  owner: FightSide,
): FightState {
  const fighter = before[owner]
  const ability = fightAbility(fighter)
  if (!nenOperationCategory(ability, 'control')) return after
  const factor = nenOperationPower(fighter, { ability, operation: 'control' })
  return (['player', 'opponent'] as const).reduce((state, side) => {
    const effects = { ...state[side].hatsuEffects }
    for (const key of CONTROL_DURATIONS) {
      const previous = before[side].hatsuEffects[key]
      const current = effects[key]
      if (typeof previous === 'number' && typeof current === 'number' && current > previous)
        Object.assign(effects, { [key]: previous + Math.round((current - previous) * factor) })
    }
    return { ...state, [side]: { ...state[side], hatsuEffects: effects } }
  }, after)
}

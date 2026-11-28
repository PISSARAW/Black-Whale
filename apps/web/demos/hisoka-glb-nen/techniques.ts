import { createFightState } from '../../src/lib/fighting/fightState'
import { advanceNen, applyAuraContext } from '../../src/lib/fighting/nen'
import { EMPTY_INPUT, type ArcadeFighter, type FightInput } from '../../src/lib/fighting/types'

export const TRIALS = [
  { id: 'ten', label: 'Ten', input: {} },
  { id: 'ren', label: 'Ren', input: { aura: true } },
  { id: 'ken', label: 'Ken', input: { aura: true, guard: true } },
  { id: 'ryu-hands', label: 'Ryu · mains', input: { aura: true, focusHands: true } },
  { id: 'ryu-feet', label: 'Ryu · pieds', input: { aura: true, focusFeet: true } },
  { id: 'ko', label: 'Ko · mains', input: { guard: true, focusHands: true } },
  { id: 'shu', label: 'Shu · carte', input: { shu: true } },
  { id: 'gyo', label: 'Gyo', input: { gyo: true } },
  { id: 'in', label: 'In', input: { conceal: true } },
  { id: 'zetsu', label: 'Zetsu', input: { zetsuIntent: true } },
  { id: 'ryu-transfer', label: 'Ryu · transfert', input: { aura: true, focusHands: true } },
] as const satisfies readonly { id: string; label: string; input: Partial<FightInput> }[]

export const RYU_SWITCH_SECONDS = 1.2

export function createNenTrial(index: number) {
  const trial = TRIALS[index]
  const input: FightInput = { ...EMPTY_INPUT, directControls: true, ...trial.input }
  const feet = { ...input, focusHands: false, focusFeet: true }
  let fighter: ArcadeFighter = createFightState('hisoka', 'machi').player
  let frame = 0
  return (seconds: number) => {
    const desired = Math.max(1, Math.round(seconds * 60))
    while (frame < desired) {
      const current = trial.id === 'ryu-transfer' && frame >= RYU_SWITCH_SECONDS * 60 ? feet : input
      fighter = advanceNen(applyAuraContext(fighter, current), 1 / 60)
      frame++
    }
    return fighter
  }
}

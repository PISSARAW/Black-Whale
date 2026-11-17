import { fighterDefinition } from './roster'
import type { DowsingQuestion } from './dowsingTypes'
import type { ArcadeFighter } from './types'

export function dowsingAnswerText(
  fighter: ArcadeFighter,
  question: DowsingQuestion,
  lie: boolean,
): string {
  if (question === 'identity') return identityAnswer(fighter, lie)
  if (question === 'in')
    return (lie ? !fighter.nen.in : fighter.nen.in)
      ? 'Je dissimule mon aura avec In.'
      : 'Je ne dissimule pas mon aura avec In.'
  const mode = fighter.nen.on ? 'on' : fighter.nen.mode
  return `Mon état de Nen est ${lie ? (mode === 'zetsu' ? 'ten' : 'zetsu') : mode}.`
}
function identityAnswer(fighter: ArcadeFighter, lie: boolean): string {
  const identity = fighter.nenOwner ?? fighter.id
  const stated = lie ? (identity === 'hisoka' ? 'kurapika' : 'hisoka') : identity
  return `Je suis ${fighterDefinition(stated).name}.`
}

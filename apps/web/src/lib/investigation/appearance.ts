import type { InvestigationSubject } from './case'
import type { HumanAppearance } from '../tour/humanAppearance'

export function subjectSceneAppearance(subject: InvestigationSubject) {
  const human: HumanAppearance = {
    role: subject.isDead ? 'victim' : 'witness',
    identity: subject.characterId ?? subject.id,
    pose: subject.isDead ? 'fallen' : 'idle',
    aura: 'none',
  }
  return subject.isDead
    ? { colour: 0xd85b50, size: 0.62, y: 0.1, human }
    : { colour: subject.color, size: 0.42, y: 0, human }
}

import type { InvestigationSubject } from './case'

export function subjectSceneAppearance(subject: InvestigationSubject) {
  return subject.isDead
    ? { colour: 0xd85b50, size: 0.62, y: 0.1 }
    : { colour: subject.color, size: 0.42, y: 0 }
}

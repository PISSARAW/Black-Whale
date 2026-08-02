import type { Locale } from '$lib/i18n'
import { room1014Case, type InvestigationCase } from './case'

const subjectCopy: Record<string, Partial<InvestigationCase['subjects'][number]>> = {
  kurapika: { role: 'Investigator', status: 'Nen user · alert', dialogue: 'An attack happened in the middle of the group. We must not confuse what we suspect with what we can prove.' },
  bill: { role: 'Witness', status: 'Nen user · cooperative', dialogue: 'I was facing the room. I saw the guard collapse, but no weapon or attacker touched him.' },
  loberry: { role: 'Central witness', status: 'Possessed · alone in seeing the doll', dialogue: 'A masked girl stood behind Furykov. I swear she was there, but nobody else seemed able to see her.' },
  furykov: { role: 'Benjamin guard', status: 'Declared Nen user · hostile observer', dialogue: 'I saw no masked girl behind me. The creatures attached to Barrigen’s neck, however, were materialised and visible to everyone.' },
  belerainte: { role: 'Tubeppa guard', status: 'Declared Nen user · cooperative', dialogue: 'Six people in this room already know Nen, but only Furykov and I declared it. The killer may be hiding among those who remain silent.' },
  sakata: { role: 'Zhang Lei guard', status: 'Armed witness · not initiated in Nen', dialogue: 'I fired at the creatures when they appeared around his neck. The bullets struck them, but Barrigen was already doomed.' },
  body: { name: 'Barrigen’s body', role: 'Victim', status: 'Examine', dialogue: 'The body has been drained of blood. Four white creatures attached themselves to his neck; the guards could see them and tried to pull them away.' },
}

const questionCopy: Record<string, { prompt: string; response: string }> = {
  'kurapika-method': { prompt: 'What can we already establish about the ability?', response: 'The creatures are materialised and controlled. The doll follows another visibility rule. Those are properties, not the user’s identity.' },
  'bill-seen': { prompt: 'What did you see when the attack happened?', response: 'Four white shapes around Barrigen’s neck. They were visible and the guards tried to tear them away.' },
  'bill-duration': { prompt: 'How long did we have to react?', response: 'Almost no time. Eleven seconds at most between the creatures appearing and his death.' },
  'loberry-figure': { prompt: 'Describe the masked presence exactly.', response: 'A small decorative girl wearing a mask. She stood behind Furykov. When I pointed her out, nobody was looking in the right place.' },
  'loberry-control': { prompt: 'Were you controlling her?', response: 'No. I could only see her. She forced herself on me, and my panic drew everyone’s attention.' },
  'furykov-doll': { prompt: 'Was the doll behind you?', response: 'Loberry says so. I saw nothing behind my back. That suggests a perception condition, not an absence.' },
  'belerainte-users': { prompt: 'How many participants know Nen?', response: 'Six, according to the count in the room. Furykov and I declared ourselves; four others remain silent.' },
  'sakata-shots': { prompt: 'What did you fire at?', response: 'The white creatures. My shots hit them; they were neither Loberry’s hallucination nor invisible.' },
  'sakata-time': { prompt: 'Could you have saved Barrigen by firing sooner?', response: 'No. Their combined action was too fast; we only had about eleven seconds.' },
}

const evidenceCopy: Record<string, { title: string; claim: string; source: string }> = {
  'visibility-split': { title: 'Two visibility rules', claim: 'Only Loberry and the user can see the doll, while everyone can see the four materialised creatures.', source: 'Cross-examination of Loberry and Furykov' },
  'six-nen-users': { title: 'Six Nen users in the class', claim: 'Six participants already know Nen; only Furykov and Belerainte declared it.', source: 'Count made during the lesson' },
  wounds: { title: 'Multiple puncture wounds', claim: 'Four materialised creatures pierced Barrigen and drained his blood.', source: 'Examination of the body' },
  'death-window': { title: 'Eleven seconds', claim: 'Four creatures acting together need only about eleven seconds to kill.', source: 'Condition of the body and observed sequence' },
  'bill-testimony': { title: 'Visible creatures', claim: 'Bill and the guards saw the white creatures and tried to pull them off the victim.', source: 'Bill’s testimony' },
  'loberry-vision': { title: 'The doll nobody sees', claim: 'Loberry is the only witness who sees the masked doll diverting the group’s attention.', source: 'Loberry’s testimony' },
  'nen-residue': { title: 'Aura anomaly', claim: 'The attackers are materialised and remotely controlled; the doll follows a different visibility rule.', source: 'Kurapika’s analysis' },
}

const hypothesisCopy: Record<string, { label: string; explanation: string }> = {
  'ordinary-weapon': { label: 'Ordinary animals attacked Barrigen', explanation: 'This does not explain either the speed of the blood loss or the doll visible to only one person.' },
  accident: { label: 'Loberry killed Barrigen herself', explanation: 'Her testimony is central, but seeing the doll does not prove she controls the creatures.' },
  'hidden-nen': { label: 'A hidden user triggered a remote Nen ability', explanation: 'This connects the diversion imposed on Loberry, the four materialised creatures and the coordinated killing. It does not reveal the user’s identity.' },
}

const objectiveCopy: Record<string, string> = {
  'inspect-victim': 'Establish the cause of death',
  'compare-witnesses': 'Compare what each person could see',
  'identify-method': 'Identify the Nen mechanism',
}

export function localizedRoom1014Case(locale: Locale): InvestigationCase {
  if (locale === 'fr') return room1014Case
  return {
    ...room1014Case,
    title: 'Eleven seconds',
    subtitle: 'Room 1014 incident',
    location: 'Tier 1 · Apartment 1014',
    objective: 'Establish how the attack worked without claiming to know the assassin.',
    subjects: room1014Case.subjects.map((subject) => ({
      ...subject,
      ...subjectCopy[subject.id],
      questions: subject.questions.map((question) => ({ ...question, ...questionCopy[question.id] })),
    })),
    evidence: room1014Case.evidence.map((evidence) => ({ ...evidence, ...evidenceCopy[evidence.id] })),
    hypotheses: room1014Case.hypotheses.map((hypothesis) => ({ ...hypothesis, ...hypothesisCopy[hypothesis.id] })),
    objectives: room1014Case.objectives.map((objective) => ({ ...objective, label: objectiveCopy[objective.id] })),
  }
}

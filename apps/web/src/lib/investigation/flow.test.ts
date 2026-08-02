import { describe, expect, it } from 'vitest'
import { evaluateHypothesis, room1014Case } from './case'
import { confrontWitnesses } from './confrontation'
import { questionIsAvailable } from './interrogation'
import { buildFinalReport } from './report'

describe('complete investigation flow', () => {
  it('solves the case through observation, interrogation and confrontation', () => {
    const discovered = new Set<string>()
    const inspect = (subjectId: string) => {
      const subject = room1014Case.subjects.find((item) => item.id === subjectId)!
      subject.evidenceIds.forEach((id) => discovered.add(id))
    }
    const ask = (subjectId: string, questionId: string) => {
      const subject = room1014Case.subjects.find((item) => item.id === subjectId)!
      const question = subject.questions.find((item) => item.id === questionId)!
      expect(questionIsAvailable(question, discovered)).toBe(true)
      question.evidenceIds.forEach((id) => discovered.add(id))
    }

    inspect('body')
    ask('bill', 'bill-seen')
    ask('loberry', 'loberry-figure')
    inspect('kurapika')

    const confrontation = confrontWitnesses(['loberry', 'furykov'], discovered)
    confrontation.evidenceIds.forEach((id) => discovered.add(id))

    const verdict = evaluateHypothesis(room1014Case, 'hidden-nen', discovered)
    expect(verdict.status).toBe('solved')
    expect(buildFinalReport(room1014Case, verdict).disposition).toContain('auteur non identifié')
  })
})

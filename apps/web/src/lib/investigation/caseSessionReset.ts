import { caseProgressStorageKey, forgetCaseStanding } from './portfolio'
import type { CaseSession } from './caseSession.svelte'

export function resetCaseSession(session: CaseSession) {
  session.stopReplay()
  session.replaySecond = 0
  session.activeTab = 'evidence'
  session.interviewStance = 'neutral'
  session.scenePhenomenon = 'doll'
  session.hatsuEffectKind = null
  session.reportOpen = false
  session.discoveredIds = []
  session.selectedEvidenceIds = []
  session.selectedHypothesisId = null
  session.conclusionSelections = {}
  session.verdict = null
  session.solved = false
  session.log = []
  session.hatsuUseKeys = []
  session.nenAuraRemaining = 100
  session.hatsuResult = null
  session.askedQuestionKeys = []
  session.activeResponse = null
  session.activeCooperation = null
  session.witnessDispositions = {}
  session.confrontationKeys = []
  session.confrontationWitnessIds = []
  session.confrontationResult = null
  session.notebookOpen = false
  session.activeSubjectId = null
  session.briefingOpen = true
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(caseProgressStorageKey(session.investigation.id))
  forgetCaseStanding(localStorage, session.definition.metadata.slug)
}

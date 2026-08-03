import { get } from 'svelte/store'

import { locale } from '$lib/i18n'
import {
  activeHatsu,
  emperorTimeLifeHours,
  hatsuPanelOpen,
  spendEmperorTimeHours,
} from '$lib/nen/hatsuState'

import type { InvestigationHatsuUse } from './hatsu'
import { resolveInvestigationHatsu } from './hatsuSystem'
import { playInvestigationHatsuSound } from './hatsuPresentation'
import type { ConfrontationResult } from './confrontation'
import { confrontWitnesses } from './confrontation'
import { questionIsAvailable } from './interrogation'
import { resolveInterview, type InterviewStance, type WitnessDisposition } from './interview'
import { assessHypothesesFromEvidence } from './v3Runtime'
import { buildFinalReport } from './report'
import { sceneNodes, visibleSightLines, type ScenePhenomenon } from './geometry'
import { caseProgressStorageKey } from './portfolio'
import {
  freshProgress,
  loadProgress,
  serializeProgress,
  type InvestigationLogEntry,
} from './progress'
import {
  evaluateHypothesis,
  type InvestigationSubject,
  type InvestigationTab,
  type Verdict,
} from './case'
import type { InvestigationCaseDefinition } from './definition'
import type { HatsuInteractionKind } from '$lib/nen/hatsuRegistry'

/**
 * How a witness stands before the first question is put to them.
 *
 * The investigator trusts the investigation; a body trusts nothing and feels
 * nothing; everyone else starts halfway and under some strain. Nobody answers
 * an accusation well.
 */
function openingDisposition(subject: InvestigationSubject): WitnessDisposition {
  return {
    subjectId: subject.id,
    trust: subject.isDead ? 0 : subject.role === 'Enquêteur' ? 80 : 50,
    stress: subject.isDead ? 0 : 35,
    preferredStances: subject.role === 'Enquêteur' ? ['neutral'] : ['neutral', 'empathetic'],
    resistedStances: ['accusatory'],
  }
}

/**
 * One visitor's passage through one case file.
 *
 * Everything here is the visitor's, not the case's: what they have found, whom
 * they have questioned and how, which hypothesis they are building, how far
 * into the eleven seconds they have scrubbed. The case itself — evidence,
 * testimony, objectives — is read through `definition`, and read rather than
 * held because it is localized: switching language rebuilds it, and a session
 * that had copied it would go on logging in the language the visitor left.
 *
 * It lived inside `InvestigationCaseView` as twenty-eight `$state` bindings and
 * the twenty functions that move them, which is what made the component
 * unopenable. The panels now take this object and call it.
 */
export class CaseSession {
  #definition: () => InvestigationCaseDefinition
  #labels: () => { refused: string }

  constructor(options: {
    definition: () => InvestigationCaseDefinition
    labels: () => { refused: string }
  }) {
    this.#definition = options.definition
    this.#labels = options.labels
  }

  get definition() {
    return this.#definition()
  }

  get investigation() {
    return this.#definition().content
  }

  notebookOpen = $state(false)
  activeTab = $state<InvestigationTab>('evidence')
  activeSubjectId = $state<string | null>(null)
  discoveredIds = $state<string[]>([])
  selectedEvidenceIds = $state<string[]>([])
  selectedHypothesisId = $state<string | null>(null)
  verdict = $state<Verdict | null>(null)
  briefingOpen = $state(true)
  solved = $state(false)
  log = $state<InvestigationLogEntry[]>([])
  hatsuUseKeys = $state<string[]>([])
  hatsuResult = $state<InvestigationHatsuUse | null>(null)
  hatsuEffectKind = $state<HatsuInteractionKind | null>(null)
  hatsuEffectSequence = $state(0)
  hatsuEffectTarget = $state('')
  askedQuestionKeys = $state<string[]>([])
  activeResponse = $state<string | null>(null)
  interviewStance = $state<InterviewStance>('neutral')
  witnessDispositions = $state<Record<string, WitnessDisposition>>({})
  confrontationKeys = $state<string[]>([])
  confrontationWitnessIds = $state<string[]>([])
  confrontationResult = $state<ConfrontationResult | null>(null)
  scenePhenomenon = $state<ScenePhenomenon>('doll')
  replaySecond = $state(0)
  replayPlaying = $state(false)
  reportOpen = $state(false)

  #replayTimer: ReturnType<typeof setInterval> | null = null

  activeSubject = $derived(
    this.investigation.subjects.find((subject) => subject.id === this.activeSubjectId) ?? null,
  )
  discoveredEvidence = $derived(
    this.investigation.evidence.filter((evidence) => this.discoveredIds.includes(evidence.id)),
  )
  hypothesisAssessments = $derived(
    assessHypothesesFromEvidence({
      hypotheses: this.investigation.hypotheses,
      evidence: this.investigation.evidence,
      discoveredEvidenceIds: this.discoveredIds,
      viewerId: this.investigation.investigator,
    }),
  )
  progress = $derived(
    Math.round((this.discoveredIds.length / this.investigation.evidence.length) * 100),
  )
  completedObjectives = $derived(
    this.investigation.objectives.filter((objective) =>
      objective.requiredEvidenceIds.every((id) => this.discoveredIds.includes(id)),
    ).length,
  )
  planNodes = $derived(sceneNodes(this.investigation))
  planNodeById = $derived(new Map(this.planNodes.map((node) => [node.id, node])))
  planSightLines = $derived(
    visibleSightLines(this.scenePhenomenon, this.definition.scene.sightLines),
  )
  replayFrame = $derived(this.definition.replay[this.replaySecond] ?? this.definition.replay[0])
  reportVerdict = $derived(
    this.solved
      ? evaluateHypothesis(
          this.investigation,
          this.investigation.canonicalHypothesisId,
          this.discoveredIds,
        )
      : this.verdict,
  )
  finalReport = $derived(
    this.reportVerdict && this.reportVerdict.status === 'solved'
      ? buildFinalReport(this.investigation, this.reportVerdict)
      : null,
  )
  reportGroups = $derived(
    this.finalReport
      ? [
          {
            label: 'Faits établis',
            evidence: this.finalReport.established,
            tone: 'text-emerald-200',
          },
          { label: 'Déductions', evidence: this.finalReport.deductions, tone: 'text-amber-100' },
          { label: 'Témoignages', evidence: this.finalReport.testimony, tone: 'text-sky-200' },
        ]
      : [],
  )

  /** Reads back what this device remembers of the case, filtered to what still exists. */
  restore = () => {
    const investigation = this.investigation
    const saved = loadProgress(
      localStorage,
      investigation.id,
      caseProgressStorageKey(investigation.id),
    )
    this.discoveredIds = saved.discoveredIds.filter((id) =>
      investigation.evidence.some((evidence) => evidence.id === id),
    )
    this.selectedEvidenceIds = saved.selectedEvidenceIds.filter((id) =>
      this.discoveredIds.includes(id),
    )
    this.selectedHypothesisId = investigation.hypotheses.some(
      (hypothesis) => hypothesis.id === saved.selectedHypothesisId,
    )
      ? saved.selectedHypothesisId
      : null
    this.solved = saved.solved
    this.hatsuUseKeys = saved.hatsuUseKeys
    this.askedQuestionKeys = saved.askedQuestionKeys
    this.confrontationKeys = saved.confrontationKeys
    this.activeTab = saved.activeTab
    this.activeSubjectId = investigation.subjects.some(
      (subject) => subject.id === saved.activeSubjectId,
    )
      ? saved.activeSubjectId
      : null
    this.replaySecond = saved.replaySecond
    this.witnessDispositions = saved.witnessDispositions
    this.log = saved.log
    this.briefingOpen = !saved.started
  }

  persist = (started = true) => {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(
      caseProgressStorageKey(this.investigation.id),
      serializeProgress({
        ...freshProgress(this.investigation.id),
        started,
        discoveredIds: this.discoveredIds,
        selectedEvidenceIds: this.selectedEvidenceIds,
        selectedHypothesisId: this.selectedHypothesisId,
        solved: this.solved,
        hatsuUseKeys: this.hatsuUseKeys,
        askedQuestionKeys: this.askedQuestionKeys,
        confrontationKeys: this.confrontationKeys,
        activeTab: this.activeTab,
        activeSubjectId: this.activeSubjectId,
        replaySecond: this.replaySecond,
        witnessDispositions: this.witnessDispositions,
        log: this.log,
      }),
    )
  }

  addLog = (entry: InvestigationLogEntry) => {
    if (this.log.some((item) => item.id === entry.id)) return
    this.log = [...this.log, entry].slice(-30)
  }

  discover = (ids: string[]) => {
    const newIds = ids.filter((id) => !this.discoveredIds.includes(id))
    this.discoveredIds = [...new Set([...this.discoveredIds, ...ids])]
    for (const id of newIds) {
      const evidence = this.investigation.evidence.find((item) => item.id === id)
      if (evidence) this.addLog({ id: `discovery:${id}`, kind: 'DISCOVERY', label: evidence.title })
    }
    this.persist()
  }

  handlePick = (id: string) => {
    if (this.activeSubjectId) return
    const subject = this.investigation.subjects.find((item) => item.id === id)
    if (!subject) return
    this.activeSubjectId = id
    this.hatsuResult = null
    this.activeResponse = null
    this.discover(subject.evidenceIds)
    this.persist()
  }

  openSubject = (id: string) => {
    const subject = this.investigation.subjects.find((item) => item.id === id)
    if (!subject) return
    this.activeSubjectId = id
    this.hatsuResult = null
    this.activeResponse = null
    this.discover(subject.evidenceIds)
    this.persist()
  }

  openNotebook = (tab: InvestigationTab = 'evidence') => {
    this.activeTab = tab
    this.activeSubjectId = null
    this.notebookOpen = true
    this.persist()
  }

  selectNotebookTab = (tab: InvestigationTab) => {
    this.activeTab = tab
    this.persist()
  }

  toggleEvidence = (id: string) => {
    this.verdict = null
    this.selectedEvidenceIds = this.selectedEvidenceIds.includes(id)
      ? this.selectedEvidenceIds.filter((item) => item !== id)
      : [...this.selectedEvidenceIds, id]
    this.persist()
  }

  chooseHypothesis = (id: string) => {
    this.selectedHypothesisId = id
    this.verdict = null
    const hypothesis = this.investigation.hypotheses.find((item) => item.id === id)
    if (hypothesis)
      this.addLog({ id: `hypothesis:${id}`, kind: 'HYPOTHESIS', label: hypothesis.label })
    this.persist()
  }

  submitVerdict = () => {
    if (!this.selectedHypothesisId) return
    this.verdict = evaluateHypothesis(
      this.investigation,
      this.selectedHypothesisId,
      this.selectedEvidenceIds,
    )
    if (this.verdict.status === 'solved') this.solved = true
    this.addLog({
      id: `verdict:${this.log.filter((entry) => entry.kind === 'VERDICT').length + 1}`,
      kind: 'VERDICT',
      label: this.verdict.title,
    })
    this.persist()
    if (this.verdict.status === 'solved') {
      this.notebookOpen = false
      this.reportOpen = true
    }
  }

  useActiveHatsu = () => {
    const hatsu = get(activeHatsu)
    if (!hatsu) {
      hatsuPanelOpen.set(true)
      return
    }
    const subject = this.activeSubject
    if (!subject) return

    const result = resolveInvestigationHatsu(hatsu, {
      subjectId: subject.id,
      rules: this.definition.hatsuRules,
      context: {
        availableEvidenceIds: this.discoveredIds,
        remainingLifeHours: get(emperorTimeLifeHours),
      },
      locale: get(locale),
    })
    const alreadyUsed = this.hatsuUseKeys.includes(result.key)
    this.hatsuResult = result
    this.hatsuEffectKind = hatsu.kind
    this.hatsuEffectTarget = subject.name
    this.hatsuEffectSequence += 1
    playInvestigationHatsuSound(hatsu.kind, result)
    if (!alreadyUsed) {
      this.hatsuUseKeys = [...this.hatsuUseKeys, result.key]
      if (result.lifeHours > 0) spendEmperorTimeHours(result.lifeHours)
      this.discover(result.evidenceIds)
      this.addLog({
        id: `hatsu:${result.key}`,
        kind: 'HATSU',
        label: `${hatsu.name} · ${result.title}`,
      })
      this.persist()
    }
  }

  askQuestion = (questionId: string) => {
    const subject = this.activeSubject
    if (!subject) return
    const question = subject.questions.find((item) => item.id === questionId)
    if (!question || !questionIsAvailable(question, this.discoveredIds)) return
    const key = `${subject.id}:${question.id}`
    const disposition = this.witnessDispositions[subject.id] ?? openingDisposition(subject)
    const outcome = resolveInterview(
      disposition,
      {
        questionId,
        stance: this.interviewStance,
        leverageEvidenceIds: question.requiredEvidenceIds,
        requiredTrust: 45,
        baseEvidenceIds: question.evidenceIds,
        cooperativeEvidenceIds: [],
      },
      this.discoveredIds,
    )
    this.witnessDispositions = {
      ...this.witnessDispositions,
      [subject.id]: outcome.nextDisposition,
    }
    this.activeResponse =
      outcome.cooperation === 'refused' ? this.#labels().refused : question.response
    if (outcome.cooperation === 'refused') {
      this.persist()
      return
    }
    if (!this.askedQuestionKeys.includes(key)) {
      this.askedQuestionKeys = [...this.askedQuestionKeys, key]
      this.discover(outcome.revealedEvidenceIds)
      this.addLog({ id: `question:${key}`, kind: 'DISCOVERY', label: question.prompt })
      this.persist()
    }
  }

  toggleConfrontationWitness = (id: string) => {
    this.confrontationResult = null
    this.reportOpen = false
    this.confrontationWitnessIds = this.confrontationWitnessIds.includes(id)
      ? this.confrontationWitnessIds.filter((item) => item !== id)
      : [...this.confrontationWitnessIds.slice(-1), id]
  }

  performConfrontation = () => {
    const result = confrontWitnesses(this.confrontationWitnessIds, this.discoveredIds)
    this.confrontationResult = result
    if (result.tone === 'insufficient' || this.confrontationKeys.includes(result.key)) return
    this.confrontationKeys = [...this.confrontationKeys, result.key]
    this.discover(result.evidenceIds)
    this.addLog({ id: `confrontation:${result.key}`, kind: 'DISCOVERY', label: result.title })
    this.persist()
  }

  startInvestigation = () => {
    this.briefingOpen = false
    this.persist()
  }

  resetInvestigation = () => {
    this.discoveredIds = []
    this.selectedEvidenceIds = []
    this.selectedHypothesisId = null
    this.verdict = null
    this.solved = false
    this.log = []
    this.hatsuUseKeys = []
    this.hatsuResult = null
    this.askedQuestionKeys = []
    this.activeResponse = null
    this.witnessDispositions = {}
    this.confrontationKeys = []
    this.confrontationWitnessIds = []
    this.confrontationResult = null
    this.notebookOpen = false
    this.activeSubjectId = null
    this.briefingOpen = true
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(caseProgressStorageKey(this.investigation.id))
    }
  }

  stopReplay = () => {
    this.replayPlaying = false
    if (this.#replayTimer) clearInterval(this.#replayTimer)
    this.#replayTimer = null
  }

  toggleReplay = () => {
    if (this.replayPlaying) {
      this.stopReplay()
      return
    }
    if (this.replaySecond >= 11) this.replaySecond = 0
    this.replayPlaying = true
    this.#replayTimer = setInterval(() => {
      if (this.replaySecond >= 11) {
        this.stopReplay()
        return
      }
      this.replaySecond += 1
    }, 700)
  }

  seekReplay = (second: number) => {
    this.stopReplay()
    this.replaySecond = second
    this.persist()
  }

  /** Escape closes one layer at a time, outermost first. */
  closeTopLayer = () => {
    if (this.reportOpen) this.reportOpen = false
    else if (this.briefingOpen) this.briefingOpen = false
    else if (this.notebookOpen) this.notebookOpen = false
    else if (this.activeSubjectId) this.activeSubjectId = null
  }
}

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
import { confrontationCopy } from './confrontationCopy'
import { describeVerdict } from './verdictCopy'
import { questionIsAvailable } from './interrogation'
import {
  openingDisposition,
  resolveInterview,
  type InterviewStance,
  type InterviewOutcome,
  type WitnessDisposition,
} from './interview'
import { buildFinalReport } from './report'
import { sceneNodes, visibleSightLines, type ScenePhenomenon } from './geometry'
import { caseProgressStorageKey, forgetCaseStanding, recordCaseStanding } from './portfolio'
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
import { assessComposedConclusion } from './conclusion'
import { buildNotebookGraph } from './notebookGraph'

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
  conclusionSelections = $state<Record<string, string>>({})
  verdict = $state<Verdict | null>(null)
  briefingOpen = $state(true)
  solved = $state(false)
  log = $state<InvestigationLogEntry[]>([])
  hatsuUseKeys = $state<string[]>([])
  nenAuraRemaining = $state(100)
  hatsuResult = $state<InvestigationHatsuUse | null>(null)
  hatsuEffectKind = $state<HatsuInteractionKind | null>(null)
  hatsuEffectSequence = $state(0)
  hatsuEffectTarget = $state('')
  askedQuestionKeys = $state<string[]>([])
  activeResponse = $state<string | null>(null)
  activeCooperation = $state<InterviewOutcome['cooperation'] | null>(null)
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
  reviewedSubjectIds = $derived(
    this.investigation.subjects
      .filter((subject) => this.subjectReviewed(subject))
      .map((subject) => subject.id),
  )
  notebookGraph = $derived(
    buildNotebookGraph({
      definition: this.definition,
      discoveredEvidenceIds: this.discoveredIds,
      reviewedSubjectIds: this.reviewedSubjectIds,
    }),
  )
  /** Whether the visitor has learned something from this person: evidence, or an answer. */
  subjectReviewed = (subject: InvestigationSubject) =>
    subject.evidenceIds.some((id) => this.discoveredIds.includes(id)) ||
    this.askedQuestionKeys.some((key) => key.startsWith(`${subject.id}:`))
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
  composedConclusion = $derived(
    assessComposedConclusion({
      investigation: this.investigation,
      definition: this.definition.conclusion,
      selections: this.conclusionSelections,
      evidenceIds: this.selectedEvidenceIds,
    }),
  )
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
      ? buildFinalReport(this.definition, this.reportVerdict)
      : null,
  )
  /** The report's evidence by kind; the panel names each kind in the visitor's language. */
  reportGroups = $derived(
    this.finalReport
      ? ([
          { kind: 'established', evidence: this.finalReport.established, tone: 'text-emerald-200' },
          { kind: 'deductions', evidence: this.finalReport.deductions, tone: 'text-amber-100' },
          { kind: 'testimony', evidence: this.finalReport.testimony, tone: 'text-sky-200' },
        ] as const)
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
    this.conclusionSelections = Object.fromEntries(
      Object.entries(saved.conclusionSelections).filter(([dimensionId, optionId]) =>
        this.definition.conclusion.dimensions
          .find((dimension) => dimension.id === dimensionId)
          ?.options.some((option) => option.id === optionId),
      ),
    )
    this.solved = saved.solved
    this.hatsuUseKeys = saved.hatsuUseKeys
    this.nenAuraRemaining = saved.nenAuraRemaining
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
        conclusionSelections: this.conclusionSelections,
        solved: this.solved,
        hatsuUseKeys: this.hatsuUseKeys,
        nenAuraRemaining: this.nenAuraRemaining,
        askedQuestionKeys: this.askedQuestionKeys,
        confrontationKeys: this.confrontationKeys,
        activeTab: this.activeTab,
        activeSubjectId: this.activeSubjectId,
        replaySecond: this.replaySecond,
        witnessDispositions: this.witnessDispositions,
        log: this.log,
      }),
    )
    recordCaseStanding(localStorage, {
      caseId: this.definition.metadata.slug,
      started,
      solved: this.solved,
      conclusionId: this.investigation.canonicalHypothesisId,
    })
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
    this.activeCooperation = null
    this.interviewStance = 'neutral'
    this.discover(subject.evidenceIds)
    this.persist()
  }

  openSubject = (id: string) => {
    const subject = this.investigation.subjects.find((item) => item.id === id)
    if (!subject) return
    this.activeSubjectId = id
    this.hatsuResult = null
    this.activeResponse = null
    this.activeCooperation = null
    this.interviewStance = 'neutral'
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

  chooseConclusionOption = (dimensionId: string, optionId: string) => {
    this.conclusionSelections = { ...this.conclusionSelections, [dimensionId]: optionId }
    this.verdict = null
    this.persist()
  }

  submitVerdict = () => {
    const composed = this.composedConclusion
    if (!composed.hypothesisId || !composed.verdict) return
    this.selectedHypothesisId = composed.hypothesisId
    this.verdict = composed.verdict
    if (this.verdict.status === 'solved') this.solved = true
    this.addLog({
      id: `verdict:${this.log.filter((entry) => entry.kind === 'VERDICT').length + 1}`,
      kind: 'VERDICT',
      label: describeVerdict(this.verdict, this.investigation, get(locale)).title,
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
        remainingAura: this.nenAuraRemaining,
      },
      locale: get(locale),
    })
    const alreadyUsed = this.hatsuUseKeys.includes(result.key)
    this.hatsuResult = result
    this.hatsuEffectKind = hatsu.kind
    this.hatsuEffectTarget = subject.name
    this.hatsuEffectSequence += 1
    playInvestigationHatsuSound(hatsu.kind, result)
    // A refused or unaffordable use costs nothing and stays open to a retry.
    if (result.usable && !alreadyUsed) {
      this.hatsuUseKeys = [...this.hatsuUseKeys, result.key]
      if (result.lifeHours > 0) spendEmperorTimeHours(result.lifeHours)
      this.nenAuraRemaining = Math.max(0, this.nenAuraRemaining - result.auraCost)
      this.discover(result.evidenceIds)
      this.addLog({
        id: `hatsu:${result.key}`,
        kind: 'HATSU',
        label: `${hatsu.name} · ${result.title}`,
      })
      this.persist()
    }
  }

  setInterviewStance = (stance: InterviewStance) => {
    this.interviewStance = stance
    this.activeResponse = null
    this.activeCooperation = null
  }

  askQuestion = (questionId: string) => {
    const subject = this.activeSubject
    if (!subject) return
    const question = subject.questions.find((item) => item.id === questionId)
    if (!question || !questionIsAvailable(question, this.discoveredIds)) return
    const key = `${subject.id}:${question.id}`
    const disposition =
      this.witnessDispositions[subject.id] ??
      openingDisposition(subject, this.definition.metadata.investigatorId)
    const outcome = resolveInterview(
      disposition,
      {
        questionId,
        stance: this.interviewStance,
        preferredStances: question.preferredStances,
        resistedStances: question.resistedStances,
        leverageEvidenceIds: question.requiredEvidenceIds,
        requiredTrust: question.requiredTrust,
        baseEvidenceIds: question.evidenceIds,
        cooperativeEvidenceIds: question.cooperativeEvidenceIds,
      },
      this.discoveredIds,
    )
    this.witnessDispositions = {
      ...this.witnessDispositions,
      [subject.id]: outcome.nextDisposition,
    }
    this.activeCooperation = outcome.cooperation
    this.activeResponse =
      outcome.cooperation === 'refused'
        ? this.#labels().refused
        : outcome.cooperation === 'open'
          ? question.cooperativeResponse
          : question.response
    if (outcome.cooperation === 'refused') {
      this.persist()
      return
    }
    this.discover(outcome.revealedEvidenceIds)
    if (!this.askedQuestionKeys.includes(key)) {
      this.askedQuestionKeys = [...this.askedQuestionKeys, key]
      this.addLog({ id: `question:${key}`, kind: 'DISCOVERY', label: question.prompt })
    }
    this.persist()
  }

  toggleConfrontationWitness = (id: string) => {
    this.confrontationResult = null
    this.reportOpen = false
    this.confrontationWitnessIds = this.confrontationWitnessIds.includes(id)
      ? this.confrontationWitnessIds.filter((item) => item !== id)
      : [...this.confrontationWitnessIds.slice(-1), id]
  }

  performConfrontation = () => {
    const result = confrontWitnesses({
      witnessIds: this.confrontationWitnessIds,
      discoveredEvidenceIds: this.discoveredIds,
      confrontations: this.definition.confrontations,
      copy: confrontationCopy(get(locale)),
    })
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
    this.stopReplay()
    this.replaySecond = 0
    this.activeTab = 'evidence'
    this.interviewStance = 'neutral'
    this.scenePhenomenon = 'doll'
    this.hatsuEffectKind = null
    this.reportOpen = false
    this.discoveredIds = []
    this.selectedEvidenceIds = []
    this.selectedHypothesisId = null
    this.conclusionSelections = {}
    this.verdict = null
    this.solved = false
    this.log = []
    this.hatsuUseKeys = []
    this.nenAuraRemaining = 100
    this.hatsuResult = null
    this.askedQuestionKeys = []
    this.activeResponse = null
    this.activeCooperation = null
    this.witnessDispositions = {}
    this.confrontationKeys = []
    this.confrontationWitnessIds = []
    this.confrontationResult = null
    this.notebookOpen = false
    this.activeSubjectId = null
    this.briefingOpen = true
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(caseProgressStorageKey(this.investigation.id))
      forgetCaseStanding(localStorage, this.definition.metadata.slug)
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

<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { centroid } from '$lib/tour/hatsu'
  import { theShip } from '$lib/tour/blueprint'
  import TourScene from '$lib/components/tour/TourScene.svelte'
  import TourModeFullscreen from '$lib/components/tour/TourModeFullscreen.svelte'
  import { locale, t } from '$lib/i18n'
  import {
    evaluateHypothesis,
    type Evidence,
    type InvestigationTab,
    type Verdict,
  } from '$lib/investigation/case'
  import { caseById, DEFAULT_INVESTIGATION_CASE_ID } from '$lib/investigation/catalog'
  import {
    INVESTIGATION_STORAGE_KEY,
    freshProgress,
    parseProgress,
    serializeProgress,
    type InvestigationLogEntry,
  } from '$lib/investigation/progress'
  import { investigationHatsuUse, type InvestigationHatsuUse } from '$lib/investigation/hatsu'
  import { questionIsAvailable } from '$lib/investigation/interrogation'
  import { confrontWitnesses, type ConfrontationResult } from '$lib/investigation/confrontation'
  import { sceneNodes, visibleSightLines, type ScenePhenomenon } from '$lib/investigation/geometry'
  import { buildFinalReport } from '$lib/investigation/report'
  import {
    activeHatsu,
    closeHatsuGate,
    emperorTimeLifeHours,
    hatsuPanelOpen,
    openHatsuGate,
    spendEmperorTimeHours,
  } from '$lib/nen/hatsuState'
  import type { Apparition } from '$lib/tour/apparitions'
  import type { Space, Vec2 } from '$lib/tour/types'

  const ship = theShip()
  const initialDefinition = caseById(DEFAULT_INVESTIGATION_CASE_ID, 'fr')!
  const definition = $derived(caseById(DEFAULT_INVESTIGATION_CASE_ID, $locale)!)
  const investigation = $derived(definition.content)
  const ui = $derived(
    $locale === 'fr'
      ? {
          description:
            "Explorez la chambre 1014, confrontez les témoignages et reconstituez l'attaque de Silent Majority.",
          dossier: 'Dossier',
          chapter: 'chapitre',
          choose: 'Choisir',
          notebook: 'Carnet d’enquête',
          solved: 'Affaire résolue',
          items: 'éléments',
          people: 'Personnes et éléments',
          objectives: 'Objectifs',
          close: 'Fermer',
          closeTestimony: 'Fermer le témoignage',
          closeNotebook: 'Fermer le carnet',
          briefing: 'Briefing · Jour 2 · 09:00',
          briefingBody:
            'Le premier cours de Nen vient de devenir une scène de crime. Barrigen est mort devant toute la classe. Une seule personne affirme avoir vu une présence masquée ; plusieurs autres ont vu les créatures qui ont tué.',
          mission: 'Ordre de mission',
          canonLimit:
            'L’identité de l’utilisateur de Silent Majority n’est pas connue dans le canon. Une enquête rigoureuse doit savoir s’arrêter avant l’accusation.',
          saved: 'Progression sauvegardée sur cet appareil',
          enter: 'Entrer dans la scène',
          activeCase: 'dossier actif',
          needsEvidence: 'Nécessite un nouvel élément',
          nenAnalysis: 'Analyse Nen',
          noHatsu: 'Aucun Hatsu actif',
          useTarget: 'Utiliser sur cette cible',
          chooseHatsu: 'Choisir un Hatsu',
          inspectNotebook: 'Examiner dans le carnet',
          recorded: (count: number) =>
            `+ ${count} élément${count > 1 ? 's' : ''} consigné${count > 1 ? 's' : ''}`,
          tabs: [
            ['evidence', 'Preuves'],
            ['people', 'Personnes'],
            ['timeline', 'Chronologie'],
            ['deduction', 'Déduction'],
          ] as const,
          collected: 'Éléments collectés',
          sourceCaution: 'Une source n’est pas nécessairement une certitude.',
          emptyNotebook: 'Le carnet est vide. Examinez la scène et interrogez les témoins.',
          reset: 'Réinitialiser',
          spoilers: 'Spoilers',
          perspective: 'Perspective',
        }
      : {
          description:
            'Explore room 1014, compare testimony and reconstruct the Silent Majority attack.',
          dossier: 'Case file',
          chapter: 'chapter',
          choose: 'Choose',
          notebook: 'Investigation notebook',
          solved: 'Case solved',
          items: 'items',
          people: 'People and evidence',
          objectives: 'Objectives',
          close: 'Close',
          closeTestimony: 'Close testimony',
          closeNotebook: 'Close notebook',
          briefing: 'Briefing · Day 2 · 09:00',
          briefingBody:
            'The first Nen lesson has become a crime scene. Barrigen died in front of the entire class. One person claims to have seen a masked presence; several others saw the creatures that killed him.',
          mission: 'Mission order',
          canonLimit:
            'The identity of the Silent Majority user is not known in canon. A rigorous investigation must stop before making an accusation.',
          saved: 'Progress saved on this device',
          enter: 'Enter the scene',
          activeCase: 'active case',
          needsEvidence: 'Requires new evidence',
          nenAnalysis: 'Nen analysis',
          noHatsu: 'No active Hatsu',
          useTarget: 'Use on this target',
          chooseHatsu: 'Choose a Hatsu',
          inspectNotebook: 'Review in notebook',
          recorded: (count: number) => `+ ${count} evidence item${count > 1 ? 's' : ''} recorded`,
          tabs: [
            ['evidence', 'Evidence'],
            ['people', 'People'],
            ['timeline', 'Timeline'],
            ['deduction', 'Deduction'],
          ] as const,
          collected: 'Collected evidence',
          sourceCaution: 'A source is not necessarily a certainty.',
          emptyNotebook: 'The notebook is empty. Examine the scene and question the witnesses.',
          reset: 'Reset',
          spoilers: 'Spoilers',
          perspective: 'Perspective',
        },
  )

  let tierId = $state(initialDefinition.scene.tierId)
  let currentSpace = $state<Space | null>(null)
  let position = $state<Vec2>([0, 0])
  let heading = $state(Math.PI)
  let jumpTo = $state<string | null>(initialDefinition.scene.spaceId)

  let notebookOpen = $state(false)
  let activeTab = $state<InvestigationTab>('evidence')
  let activeSubjectId = $state<string | null>(null)
  let discoveredIds = $state<string[]>([])
  let selectedEvidenceIds = $state<string[]>([])
  let selectedHypothesisId = $state<string | null>(null)
  let verdict = $state<Verdict | null>(null)
  let briefingOpen = $state(true)
  let solved = $state(false)
  let log = $state<InvestigationLogEntry[]>([])
  let hatsuUseKeys = $state<string[]>([])
  let hatsuResult = $state<InvestigationHatsuUse | null>(null)
  let askedQuestionKeys = $state<string[]>([])
  let activeResponse = $state<string | null>(null)
  let confrontationKeys = $state<string[]>([])
  let confrontationWitnessIds = $state<string[]>([])
  let confrontationResult = $state<ConfrontationResult | null>(null)
  let scenePhenomenon = $state<ScenePhenomenon>('doll')
  let replaySecond = $state(0)
  let replayPlaying = $state(false)
  let replayTimer: ReturnType<typeof setInterval> | null = null
  let reportOpen = $state(false)

  const activeSubject = $derived(
    investigation.subjects.find((subject) => subject.id === activeSubjectId) ?? null,
  )
  const discoveredEvidence = $derived(
    investigation.evidence.filter((evidence) => discoveredIds.includes(evidence.id)),
  )
  const progress = $derived(
    Math.round((discoveredIds.length / investigation.evidence.length) * 100),
  )
  const completedObjectives = $derived(
    investigation.objectives.filter((objective) =>
      objective.requiredEvidenceIds.every((id) => discoveredIds.includes(id)),
    ).length,
  )
  const planNodes = $derived(sceneNodes(investigation))
  const planNodeById = $derived(new Map(planNodes.map((node) => [node.id, node])))
  const planSightLines = $derived(visibleSightLines(scenePhenomenon, definition.scene.sightLines))
  const replayFrame = $derived(definition.replay[replaySecond] ?? definition.replay[0])
  const reportVerdict = $derived(
    solved
      ? evaluateHypothesis(investigation, investigation.canonicalHypothesisId, discoveredIds)
      : verdict,
  )
  const finalReport = $derived(
    reportVerdict && reportVerdict.status === 'solved'
      ? buildFinalReport(investigation, reportVerdict)
      : null,
  )
  const reportGroups = $derived(
    finalReport
      ? [
          { label: 'Faits établis', evidence: finalReport.established, tone: 'text-emerald-200' },
          { label: 'Déductions', evidence: finalReport.deductions, tone: 'text-amber-100' },
          { label: 'Témoignages', evidence: finalReport.testimony, tone: 'text-sky-200' },
        ]
      : [],
  )

  onDestroy(() => {
    if (replayTimer) clearInterval(replayTimer)
  })

  function stopReplay() {
    replayPlaying = false
    if (replayTimer) clearInterval(replayTimer)
    replayTimer = null
  }

  function toggleReplay() {
    if (replayPlaying) {
      stopReplay()
      return
    }
    if (replaySecond >= 11) replaySecond = 0
    replayPlaying = true
    replayTimer = setInterval(() => {
      if (replaySecond >= 11) {
        stopReplay()
        return
      }
      replaySecond += 1
    }, 700)
  }

  function seekReplay(second: number) {
    stopReplay()
    replaySecond = second
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return
    if (reportOpen) reportOpen = false
    else if (briefingOpen) briefingOpen = false
    else if (notebookOpen) notebookOpen = false
    else if (activeSubjectId) activeSubjectId = null
  }

  onMount(() => {
    openHatsuGate({
      admits: (kind) => definition.hatsuRules.some((rule) => rule.kinds.includes(kind)),
      reason:
        "Seules les techniques capables d'observer, d'analyser ou de reproduire la scène ont une prise sur ce dossier.",
    })
    const saved = parseProgress(localStorage.getItem(INVESTIGATION_STORAGE_KEY), investigation.id)
    discoveredIds = saved.discoveredIds.filter((id) =>
      investigation.evidence.some((evidence) => evidence.id === id),
    )
    selectedEvidenceIds = saved.selectedEvidenceIds.filter((id) => discoveredIds.includes(id))
    selectedHypothesisId = investigation.hypotheses.some(
      (hypothesis) => hypothesis.id === saved.selectedHypothesisId,
    )
      ? saved.selectedHypothesisId
      : null
    solved = saved.solved
    hatsuUseKeys = saved.hatsuUseKeys
    askedQuestionKeys = saved.askedQuestionKeys
    confrontationKeys = saved.confrontationKeys
    log = saved.log
    briefingOpen = !saved.started
    return closeHatsuGate
  })

  function persist(started = true) {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(
      INVESTIGATION_STORAGE_KEY,
      serializeProgress({
        ...freshProgress(investigation.id),
        started,
        discoveredIds,
        selectedEvidenceIds,
        selectedHypothesisId,
        solved,
        hatsuUseKeys,
        askedQuestionKeys,
        confrontationKeys,
        log,
      }),
    )
  }

  function addLog(entry: InvestigationLogEntry) {
    if (log.some((item) => item.id === entry.id)) return
    log = [...log, entry].slice(-30)
  }

  const interactables = $derived.by(() => {
    const space = ship.spaces.get(SCENE_SPACE_ID)
    const center = space ? centroid(space) : ([0, 0] as Vec2)
    return investigation.subjects.map((subject) => ({
      ...subject,
      position: [center[0] + subject.posOffset[0], center[1] + subject.posOffset[1]] as Vec2,
    }))
  })

  const extras = $derived.by(() => {
    const people = interactables.map(
      (subject) =>
        ({
          id: subject.id,
          kind: 'avatar',
          colour: subject.color,
          size: 0.42,
          y: 0,
          at: subject.position,
          tierId: SCENE_TIER_ID,
          spaceId: SCENE_SPACE_ID,
          stage: 0,
          human: {
            role: subject.isDead ? 'victim' : 'witness',
            identity: `investigation:${subject.id}`,
            pose: subject.isDead ? 'fallen' : 'idle',
            aura: 'none',
          },
          hidden: false,
          pick: true,
        }) as Apparition,
    )
    const furykov = interactables.find((subject) => subject.id === 'furykov')
    if (!furykov) return people
    const doll: Apparition = {
      id: 'silent-majority-doll',
      kind: 'avatar',
      colour: 0x171717,
      size: 0.42,
      y: 0,
      at: [furykov.position[0], furykov.position[1] + 0.85],
      tierId: SCENE_TIER_ID,
      spaceId: SCENE_SPACE_ID,
      stage: 0,
      human: {
        role: 'silent-majority',
        identity: 'silent-majority',
        pose: 'idle',
        aura: 'none',
      },
      hidden: false,
      pick: false,
    }
    return [...people, doll]
  })

  function discover(ids: string[]) {
    const newIds = ids.filter((id) => !discoveredIds.includes(id))
    discoveredIds = [...new Set([...discoveredIds, ...ids])]
    for (const id of newIds) {
      const evidence = investigation.evidence.find((item) => item.id === id)
      if (evidence) addLog({ id: `discovery:${id}`, kind: 'DISCOVERY', label: evidence.title })
    }
    persist()
  }

  function handlePick(id: string) {
    if (activeSubjectId) return
    const subject = investigation.subjects.find((item) => item.id === id)
    if (!subject) return
    activeSubjectId = id
    hatsuResult = null
    activeResponse = null
    discover(subject.evidenceIds)
  }

  function openSubject(id: string) {
    const subject = investigation.subjects.find((item) => item.id === id)
    if (!subject) return
    activeSubjectId = id
    hatsuResult = null
    activeResponse = null
    discover(subject.evidenceIds)
  }

  function openNotebook(tab: InvestigationTab = 'evidence') {
    activeTab = tab
    activeSubjectId = null
    notebookOpen = true
  }

  function toggleEvidence(id: string) {
    verdict = null
    selectedEvidenceIds = selectedEvidenceIds.includes(id)
      ? selectedEvidenceIds.filter((item) => item !== id)
      : [...selectedEvidenceIds, id]
    persist()
  }

  function chooseHypothesis(id: string) {
    selectedHypothesisId = id
    verdict = null
    const hypothesis = investigation.hypotheses.find((item) => item.id === id)
    if (hypothesis) addLog({ id: `hypothesis:${id}`, kind: 'HYPOTHESIS', label: hypothesis.label })
    persist()
  }

  function submitVerdict() {
    if (!selectedHypothesisId) return
    verdict = evaluateHypothesis(investigation, selectedHypothesisId, selectedEvidenceIds)
    if (verdict.status === 'solved') solved = true
    addLog({
      id: `verdict:${log.filter((entry) => entry.kind === 'VERDICT').length + 1}`,
      kind: 'VERDICT',
      label: verdict.title,
    })
    persist()
    if (verdict.status === 'solved') {
      notebookOpen = false
      reportOpen = true
    }
  }

  function useActiveHatsu() {
    if (!$activeHatsu) {
      hatsuPanelOpen.set(true)
      return
    }
    if (!activeSubject) return

    const result = investigationHatsuUse($activeHatsu, activeSubject.id)
    const alreadyUsed = hatsuUseKeys.includes(result.key)
    hatsuResult = result
    if (!alreadyUsed) {
      hatsuUseKeys = [...hatsuUseKeys, result.key]
      if (result.lifeHours > 0) spendEmperorTimeHours(result.lifeHours)
      discover(result.evidenceIds)
      addLog({
        id: `hatsu:${result.key}`,
        kind: 'HATSU',
        label: `${$activeHatsu.name} · ${result.title}`,
      })
      persist()
    }
  }

  function askQuestion(questionId: string) {
    if (!activeSubject) return
    const question = activeSubject.questions.find((item) => item.id === questionId)
    if (!question || !questionIsAvailable(question, discoveredIds)) return
    const key = `${activeSubject.id}:${question.id}`
    activeResponse = question.response
    if (!askedQuestionKeys.includes(key)) {
      askedQuestionKeys = [...askedQuestionKeys, key]
      discover(question.evidenceIds)
      addLog({ id: `question:${key}`, kind: 'DISCOVERY', label: question.prompt })
      persist()
    }
  }

  function toggleConfrontationWitness(id: string) {
    confrontationResult = null
    reportOpen = false
    confrontationWitnessIds = confrontationWitnessIds.includes(id)
      ? confrontationWitnessIds.filter((item) => item !== id)
      : [...confrontationWitnessIds.slice(-1), id]
  }

  function performConfrontation() {
    const result = confrontWitnesses(confrontationWitnessIds, discoveredIds)
    confrontationResult = result
    if (result.tone === 'insufficient' || confrontationKeys.includes(result.key)) return
    confrontationKeys = [...confrontationKeys, result.key]
    discover(result.evidenceIds)
    addLog({ id: `confrontation:${result.key}`, kind: 'DISCOVERY', label: result.title })
    persist()
  }

  function startInvestigation() {
    briefingOpen = false
    persist()
  }

  function resetInvestigation() {
    discoveredIds = []
    selectedEvidenceIds = []
    selectedHypothesisId = null
    verdict = null
    solved = false
    log = []
    hatsuUseKeys = []
    hatsuResult = null
    askedQuestionKeys = []
    activeResponse = null
    confrontationKeys = []
    confrontationWitnessIds = []
    confrontationResult = null
    notebookOpen = false
    activeSubjectId = null
    briefingOpen = true
    if (typeof localStorage !== 'undefined') localStorage.removeItem(INVESTIGATION_STORAGE_KEY)
  }

  function evidenceTone(evidence: Evidence) {
    if (evidence.truthStatus === 'CONFIRMED') return 'border-emerald-400/40 text-emerald-200'
    if (evidence.truthStatus === 'CONTESTED') return 'border-red-400/40 text-red-200'
    return 'border-amber-300/40 text-amber-100'
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
  <title>Investigation · {investigation.title}</title>
  <meta name="description" content={ui.description} />
</svelte:head>

<div class="relative h-screen w-full overflow-hidden bg-[#050809] font-sans text-[#f4ead4]">
  <TourModeFullscreen />
  <TourScene
    {ship}
    bind:tierId
    bind:currentSpace
    bind:position
    bind:heading
    bind:jumpTo
    {extras}
    onPick={handlePick}
    touchLabels={{ move: $t.tour.touch.move, cast: $t.tour.touch.cast }}
    soundLabels={{ silence: $t.tour.sound.silence, restore: $t.tour.sound.restore }}
    loadingLabel={$t.tour.loading}
    unsupportedLabel={$t.tour.unsupported}
  />

  <div
    class="pointer-events-none absolute inset-x-0 top-0 z-20 h-48 bg-gradient-to-b from-black/90 to-transparent"
  ></div>
  <div
    class="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-44 bg-gradient-to-t from-black/85 to-transparent"
  ></div>

  <header
    class="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col items-start justify-between gap-3 p-3 sm:flex-row sm:gap-4 sm:p-6"
  >
    <div class="max-w-xl border-l-2 border-[#d6b35a] pl-4 drop-shadow-lg">
      <p class="text-[10px] font-bold uppercase tracking-[0.28em] text-[#d6b35a]">
        {ui.dossier}
        {investigation.id} · {ui.chapter}
        {investigation.chapter}
      </p>
      <h1 class="mt-1 font-serif text-2xl leading-none text-white sm:text-4xl">
        {investigation.title}
      </h1>
      <p class="mt-2 text-xs text-white/65 sm:text-sm">
        {investigation.location} · {investigation.objective}
      </p>
    </div>

    <div class="pointer-events-auto flex w-full items-stretch justify-end gap-2 sm:w-auto">
      <button
        class="min-w-0 flex-1 border border-white/20 bg-black/80 px-3 py-2 text-left backdrop-blur transition hover:border-white/50 sm:flex-none"
        onclick={() => hatsuPanelOpen.set(true)}
      >
        <span class="block text-[9px] uppercase tracking-[0.2em] text-white/40">Hatsu</span>
        <span
          class="mt-1 block max-w-28 truncate text-xs font-semibold"
          style:color={$activeHatsu?.color ?? '#ffffff'}>{$activeHatsu?.name ?? ui.choose}</span
        >
      </button>
      <button
        class="min-w-0 flex-1 border border-[#d6b35a]/50 bg-black/80 px-4 py-3 text-left backdrop-blur transition hover:border-[#f0cf76] hover:bg-black sm:min-w-32 sm:flex-none"
        onclick={() => (solved ? (reportOpen = true) : openNotebook('evidence'))}
      >
        <span class="block text-[9px] uppercase tracking-[0.22em] text-[#d6b35a]"
          >{ui.notebook}</span
        >
        <span class="mt-1 block text-sm font-semibold text-white"
          >{solved
            ? ui.solved
            : `${discoveredIds.length}/${investigation.evidence.length} ${ui.items}`}</span
        >
        <span class="mt-2 block h-1 overflow-hidden bg-white/10"
          ><span class="block h-full bg-[#d6b35a] transition-all" style:width={`${progress}%`}
          ></span></span
        >
      </button>
    </div>
  </header>

  <aside class="pointer-events-none absolute bottom-5 left-4 z-30 hidden w-64 sm:block">
    <p class="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white/45">
      {ui.people}
    </p>
    <div class="grid grid-cols-2 gap-1.5">
      {#each investigation.subjects as subject}
        <button
          class="pointer-events-auto border bg-black/70 px-3 py-2 text-left backdrop-blur transition {discoveredIds.some(
            (id) => subject.evidenceIds.includes(id),
          )
            ? 'border-[#d6b35a]/60'
            : 'border-white/15 hover:border-white/40'}"
          onclick={() => openSubject(subject.id)}
        >
          <span class="block truncate text-xs font-semibold text-white">{subject.name}</span>
          <span class="mt-0.5 block truncate text-[9px] uppercase tracking-wider text-white/45"
            >{subject.role}</span
          >
        </button>
      {/each}
    </div>
  </aside>

  <aside class="pointer-events-none absolute bottom-5 right-4 z-30 hidden w-72 lg:block">
    <div class="border border-white/15 bg-black/75 p-4 backdrop-blur">
      <div class="flex items-center justify-between">
        <p class="text-[9px] font-bold uppercase tracking-[0.2em] text-[#d6b35a]">
          {ui.objectives}
        </p>
        <span class="font-mono text-[10px] text-white/40"
          >{completedObjectives}/{investigation.objectives.length}</span
        >
      </div>
      <ul class="mt-3 space-y-2">
        {#each investigation.objectives as objective}
          {@const complete = objective.requiredEvidenceIds.every((id) =>
            discoveredIds.includes(id),
          )}
          <li class="flex gap-2 text-xs {complete ? 'text-emerald-200' : 'text-white/50'}">
            <span>{complete ? '✓' : '○'}</span><span>{objective.label}</span>
          </li>
        {/each}
      </ul>
    </div>
  </aside>

  <div class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
    <div
      class="h-2 w-2 rounded-full border border-white/70 bg-black/20 shadow-[0_0_8px_black]"
    ></div>
  </div>

  {#if activeSubject}
    <button
      class="absolute inset-0 z-40 cursor-default bg-black/30"
      aria-label={ui.closeTestimony}
      onclick={() => (activeSubjectId = null)}
    ></button>
    <div
      class="absolute bottom-2 left-1/2 z-50 max-h-[calc(100vh-1rem)] w-[calc(100%-1rem)] max-w-3xl -translate-x-1/2 overflow-y-auto border border-white/20 bg-[#0b1012]/95 p-4 shadow-2xl backdrop-blur-md sm:bottom-5 sm:w-[calc(100%-2rem)] sm:p-7"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subject-name"
    >
      <div class="flex items-start justify-between gap-5">
        <div>
          <p class="text-[9px] font-bold uppercase tracking-[0.24em] text-[#d6b35a]">
            {activeSubject.role}
          </p>
          <h2 id="subject-name" class="mt-1 font-serif text-2xl text-white">
            {activeSubject.name}
          </h2>
          <p class="mt-1 text-xs text-white/45">{activeSubject.status}</p>
        </div>
        <button
          class="px-2 text-2xl text-white/45 hover:text-white"
          onclick={() => (activeSubjectId = null)}
          aria-label={ui.close}>×</button
        >
      </div>
      <blockquote
        class="mt-5 border-l border-[#d6b35a]/50 pl-4 font-serif text-lg leading-relaxed text-white/85"
      >
        « {activeSubject.dialogue} »
      </blockquote>
      {#if activeSubject.questions.length > 0}
        <div class="mt-5 grid gap-2 sm:grid-cols-2">
          {#each activeSubject.questions as question}
            {@const available = questionIsAvailable(question, discoveredIds)}
            {@const asked = askedQuestionKeys.includes(`${activeSubject.id}:${question.id}`)}
            <button
              class="border p-3 text-left text-xs transition {asked
                ? 'border-emerald-400/35 bg-emerald-400/[0.06] text-emerald-100'
                : available
                  ? 'border-white/20 text-white/75 hover:border-[#d6b35a]/60'
                  : 'cursor-not-allowed border-white/5 text-white/25'}"
              disabled={!available}
              onclick={() => askQuestion(question.id)}
            >
              <span class="block">{asked ? '✓ ' : ''}{question.prompt}</span>
              {#if !available}<span class="mt-1 block text-[9px] uppercase tracking-wider"
                  >{ui.needsEvidence}</span
                >{/if}
            </button>
          {/each}
        </div>
      {/if}
      {#if activeResponse}
        <div
          class="mt-3 border-l-2 border-[#d6b35a] bg-[#d6b35a]/[0.06] px-4 py-3 text-sm leading-relaxed text-white/70"
          aria-live="polite"
        >
          « {activeResponse} »
        </div>
      {/if}
      <div class="mt-5 border border-white/10 bg-black/25 p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">
              {ui.nenAnalysis}
            </p>
            <p class="mt-1 text-sm font-semibold" style:color={$activeHatsu?.color ?? '#ffffff'}>
              {$activeHatsu?.name ?? ui.noHatsu}
            </p>
          </div>
          <button
            class="border px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition {$activeHatsu
              ? 'border-white/30 text-white hover:border-white/60'
              : 'border-[#d6b35a]/50 text-[#e8cc84] hover:bg-[#d6b35a]/10'}"
            onclick={useActiveHatsu}>{$activeHatsu ? ui.useTarget : ui.chooseHatsu}</button
          >
        </div>
        {#if hatsuResult}
          <div
            class="mt-4 border-l-2 pl-3 {hatsuResult.tone === 'success'
              ? 'border-emerald-400'
              : hatsuResult.tone === 'forbidden'
                ? 'border-red-400'
                : 'border-amber-300'}"
            aria-live="polite"
          >
            <p class="text-xs font-semibold text-white">{hatsuResult.title}</p>
            <p class="mt-1 text-xs leading-relaxed text-white/55">{hatsuResult.finding}</p>
            {#if hatsuResult.lifeHours > 0}<p
                class="mt-2 font-mono text-[9px] uppercase tracking-wider text-red-200"
              >
                Vie consommée · +{hatsuResult.lifeHours} h · total {$emperorTimeLifeHours} h
              </p>{/if}
          </div>
        {/if}
      </div>
      {#if activeSubject.evidenceIds.length > 0}
        <div
          class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4"
        >
          <p class="text-xs text-emerald-200">
            {ui.recorded(activeSubject.evidenceIds.length)}
          </p>
          <button
            class="border border-[#d6b35a]/50 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#e8cc84] hover:bg-[#d6b35a]/10"
            onclick={() => openNotebook('evidence')}>{ui.inspectNotebook}</button
          >
        </div>
      {/if}
    </div>
  {/if}

  {#if notebookOpen}
    <button
      class="absolute inset-0 z-40 bg-black/65 backdrop-blur-sm"
      aria-label={ui.closeNotebook}
      onclick={() => (notebookOpen = false)}
    ></button>
    <div
      class="absolute inset-y-0 right-0 z-50 flex w-full max-w-3xl flex-col border-l border-[#d6b35a]/35 bg-[#0a0d0e] shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-label="Carnet d’enquête"
    >
      <header class="flex items-start justify-between border-b border-white/10 p-5 sm:p-7">
        <div>
          <p class="text-[9px] font-bold uppercase tracking-[0.25em] text-[#d6b35a]">
            {investigation.investigator} · {ui.activeCase}
          </p>
          <h2 class="mt-1 font-serif text-2xl text-white sm:text-3xl">{investigation.subtitle}</h2>
        </div>
        <button
          class="px-2 text-3xl text-white/45 hover:text-white"
          onclick={() => (notebookOpen = false)}
          aria-label="Fermer">×</button
        >
      </header>

      <nav
        class="grid grid-cols-2 border-b border-white/10 sm:grid-cols-4"
        aria-label="Sections du carnet"
      >
        {#each ui.tabs as tab}
          <button
            class="border-r border-white/10 px-2 py-3 text-[9px] font-bold uppercase tracking-wider transition sm:text-[10px] {activeTab ===
            tab[0]
              ? 'bg-[#d6b35a]/12 text-[#f0cf76]'
              : 'text-white/45 hover:text-white'}"
            onclick={() => (activeTab = tab[0] as InvestigationTab)}>{tab[1]}</button
          >
        {/each}
      </nav>

      <div class="flex-1 overflow-y-auto p-5 sm:p-7">
        {#if activeTab === 'evidence'}
          <div class="mb-5 flex items-end justify-between gap-4">
            <div>
              <p class="text-xs uppercase tracking-widest text-[#d6b35a]">{ui.collected}</p>
              <p class="mt-1 text-sm text-white/50">
                {ui.sourceCaution}
              </p>
            </div>
            <span class="font-mono text-sm text-white/40"
              >{discoveredIds.length}/{investigation.evidence.length}</span
            >
          </div>
          {#if discoveredEvidence.length === 0}
            <div
              class="border border-dashed border-white/20 p-10 text-center text-sm text-white/45"
            >
              {ui.emptyNotebook}
            </div>
          {:else}
            <div class="space-y-3">
              {#each discoveredEvidence as evidence}
                <article class="border border-white/10 bg-white/[0.025] p-4">
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 class="font-serif text-lg text-white">{evidence.title}</h3>
                      <p class="mt-1 text-sm leading-relaxed text-white/65">{evidence.claim}</p>
                    </div>
                    <span
                      class="border px-2 py-1 text-[9px] uppercase tracking-wider {evidenceTone(
                        evidence,
                      )}"
                      >{evidence.truthStatus === 'CONFIRMED'
                        ? 'confirmé'
                        : evidence.truthStatus === 'DEDUCTION'
                          ? 'déduit'
                          : 'impliqué'}</span
                    >
                  </div>
                  <p class="mt-3 text-[10px] uppercase tracking-wider text-white/35">
                    {evidence.source} · ch. {evidence.chapter} · {evidence.method.replaceAll(
                      '_',
                      ' ',
                    )}
                  </p>
                  <div class="mt-3 flex flex-wrap gap-2 border-t border-white/5 pt-3">
                    {#each evidence.canonicalRefs as reference}
                      <a
                        class="border border-white/10 px-2 py-1 text-[9px] text-white/45 transition hover:border-[#d6b35a]/50 hover:text-[#e8cc84]"
                        href={reference.href}
                        title={reference.id}
                      >
                        ↗ {reference.label}
                      </a>
                    {/each}
                  </div>
                </article>
              {/each}
            </div>
          {/if}
          {#if log.length > 0}
            <div class="mt-8 border-t border-white/10 pt-5">
              <p class="text-[10px] font-bold uppercase tracking-widest text-white/40">
                Journal d’enquête
              </p>
              <ol class="mt-3 space-y-2">
                {#each [...log].reverse().slice(0, 8) as entry}
                  <li class="flex items-center gap-3 text-xs text-white/50">
                    <span
                      class="w-20 shrink-0 font-mono text-[9px] uppercase tracking-wider text-[#d6b35a]/70"
                      >{entry.kind === 'DISCOVERY'
                        ? 'indice'
                        : entry.kind === 'HYPOTHESIS'
                          ? 'piste'
                          : entry.kind === 'HATSU'
                            ? 'hatsu'
                            : 'verdict'}</span
                    ><span>{entry.label}</span>
                  </li>
                {/each}
              </ol>
            </div>
          {/if}
        {:else if activeTab === 'people'}
          <div class="grid gap-3 sm:grid-cols-2">
            {#each investigation.subjects as subject}
              <button
                class="border border-white/10 bg-white/[0.025] p-4 text-left hover:border-[#d6b35a]/40"
                onclick={() => {
                  notebookOpen = false
                  openSubject(subject.id)
                }}
              >
                <p class="text-[9px] uppercase tracking-widest text-[#d6b35a]">{subject.role}</p>
                <h3 class="mt-1 font-serif text-xl text-white">{subject.name}</h3>
                <p class="mt-1 text-xs text-white/45">{subject.status}</p>
                <p
                  class="mt-4 text-[10px] uppercase tracking-wider {discoveredIds.some((id) =>
                    subject.evidenceIds.includes(id),
                  )
                    ? 'text-emerald-200'
                    : 'text-white/30'}"
                >
                  {discoveredIds.some((id) => subject.evidenceIds.includes(id))
                    ? 'Consigné · revoir'
                    : 'À examiner'}
                </p>
              </button>
            {/each}
          </div>
          <section class="mt-8 border-t border-white/10 pt-6">
            <p class="text-[10px] font-bold uppercase tracking-widest text-[#d6b35a]">
              Confronter deux déclarations
            </p>
            <p class="mt-2 text-sm text-white/45">
              Sélectionnez deux témoins. Une divergence précise peut devenir une déduction.
            </p>
            <div class="mt-4 flex flex-wrap gap-2">
              {#each investigation.subjects.filter((subject) => !subject.isDead && subject.id !== 'kurapika') as subject}
                <button
                  class="border px-3 py-2 text-xs transition {confrontationWitnessIds.includes(
                    subject.id,
                  )
                    ? 'border-[#d6b35a] bg-[#d6b35a]/10 text-[#f0cf76]'
                    : 'border-white/15 text-white/55 hover:border-white/35'}"
                  onclick={() => toggleConfrontationWitness(subject.id)}>{subject.name}</button
                >
              {/each}
            </div>
            <button
              class="mt-4 border border-[#d6b35a]/60 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#e8cc84] enabled:hover:bg-[#d6b35a]/10 disabled:opacity-30"
              disabled={confrontationWitnessIds.length !== 2}
              onclick={performConfrontation}>Confronter les versions</button
            >
            {#if confrontationResult}
              <div
                class="mt-4 border-l-2 px-4 py-3 {confrontationResult.tone === 'deduction'
                  ? 'border-emerald-400 bg-emerald-400/[0.06]'
                  : confrontationResult.tone === 'corroboration'
                    ? 'border-sky-300 bg-sky-300/[0.05]'
                    : 'border-amber-300 bg-amber-300/[0.05]'}"
                aria-live="polite"
              >
                <p class="text-sm font-semibold text-white">{confrontationResult.title}</p>
                <p class="mt-1 text-xs leading-relaxed text-white/60">
                  {confrontationResult.finding}
                </p>
              </div>
            {/if}
          </section>
        {:else if activeTab === 'timeline'}
          <section class="mb-5 overflow-hidden border border-[#d6b35a]/25 bg-black/35">
            <div class="grid min-h-44 sm:grid-cols-[0.72fr_1fr]">
              <div
                class="relative flex items-center justify-center overflow-hidden border-b border-white/10 p-6 sm:border-b-0 sm:border-r"
              >
                <div
                  class="absolute inset-0 opacity-20"
                  style:background={`radial-gradient(circle at center, ${replayFrame.stage === 'death' ? '#7f1d1d' : '#d6b35a'}, transparent 65%)`}
                ></div>
                <div class="relative text-center">
                  <p class="font-mono text-5xl text-white">
                    {replayFrame.second.toString().padStart(2, '0')}
                  </p>
                  <p class="mt-1 text-[9px] font-bold uppercase tracking-[0.25em] text-[#d6b35a]">
                    seconde
                  </p>
                  <div
                    class="mt-4 flex justify-center gap-1.5"
                    aria-label={`${replayFrame.snakes} créatures actives`}
                  >
                    {#each Array(4) as _, index}<span
                        class="block h-6 w-1.5 rounded-full transition {index < replayFrame.snakes
                          ? 'bg-[#e8f3f5] shadow-[0_0_8px_white]'
                          : 'bg-white/10'}"
                      ></span>{/each}
                  </div>
                  <div class="mt-4 h-1.5 w-28 overflow-hidden bg-white/10">
                    <div
                      class="h-full bg-red-500 transition-all"
                      style:width={`${replayFrame.bloodLevel}%`}
                    ></div>
                  </div>
                  <p class="mt-1 text-[8px] uppercase tracking-wider text-white/30">
                    volume sanguin
                  </p>
                </div>
              </div>
              <div class="flex flex-col justify-between p-5">
                <div>
                  <p class="text-[9px] font-bold uppercase tracking-widest text-white/35">
                    Reconstitution synchronisée
                  </p>
                  <h3 class="mt-2 font-serif text-2xl text-white">{replayFrame.title}</h3>
                  <p class="mt-2 text-sm leading-relaxed text-white/55">
                    {replayFrame.description}
                  </p>
                </div>
                <div class="mt-5">
                  <input
                    class="w-full accent-[#d6b35a]"
                    type="range"
                    min="0"
                    max="11"
                    step="1"
                    value={replaySecond}
                    oninput={(event) => seekReplay(Number(event.currentTarget.value))}
                    aria-label="Seconde de la reconstitution"
                  />
                  <div class="mt-3 flex items-center justify-between">
                    <button
                      class="border border-[#d6b35a]/60 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#e8cc84] hover:bg-[#d6b35a]/10"
                      onclick={toggleReplay}
                      >{replayPlaying
                        ? 'Pause'
                        : replaySecond >= 11
                          ? 'Rejouer'
                          : 'Lecture'}</button
                    >
                    <span class="font-mono text-[9px] text-white/30">00:00 — 00:11</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section class="mb-8 border border-white/10 bg-white/[0.02] p-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-[10px] font-bold uppercase tracking-widest text-[#d6b35a]">
                  Plan des lignes de vue
                </p>
                <p class="mt-1 text-xs text-white/40">Position relative au moment de l’attaque</p>
              </div>
              <div class="flex border border-white/10">
                {#each [['doll', 'Poupée'], ['snakes', 'Créatures']] as layer}
                  <button
                    class="px-3 py-2 text-[9px] font-bold uppercase tracking-wider {scenePhenomenon ===
                    layer[0]
                      ? 'bg-[#d6b35a]/15 text-[#f0cf76]'
                      : 'text-white/35 hover:text-white'}"
                    onclick={() => (scenePhenomenon = layer[0] as ScenePhenomenon)}
                    >{layer[1]}</button
                  >
                {/each}
              </div>
            </div>
            <svg
              class="mt-4 h-auto w-full border border-white/5 bg-black/35"
              viewBox="0 0 400 260"
              role="img"
              aria-label={`Lignes de vue · ${scenePhenomenon === 'doll' ? 'poupée' : 'créatures'}`}
            >
              <rect
                x="8"
                y="8"
                width="384"
                height="244"
                rx="4"
                fill="none"
                stroke="rgba(255,255,255,.12)"
              />
              {#each planSightLines as line}
                {@const from = planNodeById.get(line.observerId)}
                {@const to = planNodeById.get(line.targetId)}
                {#if from && to}
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={scenePhenomenon === 'doll' ? '#d6b35a' : '#7dd3fc'}
                    stroke-width="1.5"
                    stroke-dasharray={scenePhenomenon === 'doll' ? '4 3' : 'none'}
                    opacity=".7"
                  />
                {/if}
              {/each}
              {#each planNodes as node}
                <g>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.isDead ? 10 : 7}
                    fill={node.isDead ? '#7f1d1d' : '#182126'}
                    stroke={node.id === 'loberry' && scenePhenomenon === 'doll'
                      ? '#d6b35a'
                      : 'rgba(255,255,255,.45)'}
                    stroke-width="1.5"
                  />
                  <text
                    x={node.x}
                    y={node.y + 19}
                    text-anchor="middle"
                    fill="rgba(255,255,255,.65)"
                    font-size="8">{node.label}</text
                  >
                </g>
              {/each}
              <text
                x="92"
                y="30"
                fill={scenePhenomenon === 'doll' ? '#d6b35a' : '#7dd3fc'}
                font-size="9"
              >
                {scenePhenomenon === 'doll'
                  ? 'Poupée derrière Furykov · visible par Loberry seule'
                  : 'Créatures matérialisées · visibles par tous'}
              </text>
            </svg>
          </section>
          <ol class="relative ml-2 border-l border-[#d6b35a]/30 pl-7">
            {#each [['T − 00:11', 'Loberry désigne une poupée que personne d’autre ne voit.', 'loberry-vision'], ['T − 00:08', 'Quatre créatures blanches se fixent au cou de Barrigen.', 'bill-testimony'], ['T + 00:00', 'Barrigen s’effondre, entièrement vidé de son sang.', 'wounds'], ['Après', 'Kurapika recherche un mécanisme de Nen.', 'nen-residue']] as event}
              <li class="relative mb-8 last:mb-0">
                <span
                  class="absolute -left-[2.08rem] top-1 h-2.5 w-2.5 rounded-full border border-[#d6b35a] {discoveredIds.includes(
                    event[2],
                  )
                    ? 'bg-[#d6b35a]'
                    : 'bg-[#0a0d0e]'}"
                ></span>
                <p class="font-mono text-[10px] text-[#d6b35a]">{event[0]}</p>
                <p
                  class="mt-1 text-sm {discoveredIds.includes(event[2])
                    ? 'text-white/75'
                    : 'text-white/25 blur-[3px] select-none'}"
                >
                  {event[1]}
                </p>
              </li>
            {/each}
          </ol>
        {:else}
          <div class="max-w-2xl">
            <p class="text-xs uppercase tracking-widest text-[#d6b35a]">Construire la conclusion</p>
            <h3 class="mt-2 font-serif text-2xl text-white">
              Que s’est-il passé pendant ces onze secondes ?
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-white/50">
              Choisissez une hypothèse puis uniquement les éléments qui la soutiennent. Le verdict
              évaluera aussi les contradictions.
            </p>

            <div class="mt-6 space-y-2">
              {#each investigation.hypotheses as hypothesis}
                <button
                  class="w-full border p-4 text-left transition {selectedHypothesisId ===
                  hypothesis.id
                    ? 'border-[#d6b35a] bg-[#d6b35a]/10'
                    : 'border-white/10 hover:border-white/30'}"
                  onclick={() => chooseHypothesis(hypothesis.id)}
                >
                  <span class="flex items-center gap-3"
                    ><span
                      class="h-3 w-3 rounded-full border {selectedHypothesisId === hypothesis.id
                        ? 'border-[#d6b35a] bg-[#d6b35a]'
                        : 'border-white/35'}"
                    ></span><span class="font-serif text-lg text-white">{hypothesis.label}</span
                    ></span
                  >
                </button>
              {/each}
            </div>

            <p class="mt-7 text-[10px] font-bold uppercase tracking-widest text-white/45">
              Pièces versées au raisonnement · {selectedEvidenceIds.length}
            </p>
            <div class="mt-3 grid gap-2 sm:grid-cols-2">
              {#each discoveredEvidence as evidence}
                <button
                  class="border p-3 text-left text-xs transition {selectedEvidenceIds.includes(
                    evidence.id,
                  )
                    ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-100'
                    : 'border-white/10 text-white/55 hover:border-white/30'}"
                  onclick={() => toggleEvidence(evidence.id)}
                >
                  <span class="mr-2">{selectedEvidenceIds.includes(evidence.id) ? '✓' : '○'}</span
                  >{evidence.title}
                </button>
              {/each}
            </div>

            <button
              class="mt-6 w-full border border-[#d6b35a] bg-[#d6b35a] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-black transition enabled:hover:bg-[#f0cf76] disabled:cursor-not-allowed disabled:opacity-30"
              disabled={!selectedHypothesisId || selectedEvidenceIds.length === 0}
              onclick={submitVerdict}>Soumettre la reconstruction</button
            >

            {#if verdict}
              <article
                class="mt-5 border p-5 {verdict.status === 'solved'
                  ? 'border-emerald-400/50 bg-emerald-400/[0.07]'
                  : verdict.status === 'contradicted'
                    ? 'border-red-400/50 bg-red-400/[0.07]'
                    : 'border-amber-300/40 bg-amber-300/[0.06]'}"
                aria-live="polite"
              >
                <p class="text-[9px] font-bold uppercase tracking-widest text-white/45">
                  Analyse du raisonnement
                </p>
                <h4 class="mt-1 font-serif text-2xl text-white">{verdict.title}</h4>
                <p class="mt-2 text-sm leading-relaxed text-white/65">{verdict.summary}</p>
                {#if verdict.contradictions.length > 0}<p class="mt-4 text-xs text-red-200">
                    Contradiction : {verdict.contradictions.map((item) => item.title).join(' · ')}
                  </p>{/if}
                {#if verdict.missing.length > 0}<p class="mt-3 text-xs text-amber-100/75">
                    À établir : {verdict.missing.map((item) => item.title).join(' · ')}
                  </p>{/if}
                {#if verdict.status === 'solved'}<p
                    class="mt-4 border-t border-white/10 pt-4 text-xs leading-relaxed text-emerald-100/80"
                  >
                    Limite épistémique : l’enquêteur peut démontrer l’usage d’un Nen dissimulé, mais
                    pas encore nommer son utilisateur. La vérité du lecteur reste séparée du
                    verdict.
                  </p>{/if}
              </article>
            {/if}
          </div>
        {/if}
      </div>

      <footer
        class="flex items-center justify-between border-t border-white/10 px-5 py-3 text-[9px] uppercase tracking-wider text-white/30 sm:px-7"
      >
        <span>{ui.perspective} · {investigation.investigator}</span>
        <span class="flex items-center gap-4"
          ><button class="text-white/40 hover:text-red-200" onclick={resetInvestigation}
            >{ui.reset}</button
          ><span>{ui.spoilers} · ch. {investigation.chapter}</span></span
        >
      </footer>
    </div>
  {/if}

  {#if reportOpen && finalReport}
    <div
      class="absolute inset-0 z-[65] overflow-y-auto bg-[#050809]/96 p-4 backdrop-blur-md sm:p-8"
    >
      <article class="mx-auto max-w-5xl border border-emerald-400/30 bg-[#0a0f0f] shadow-2xl">
        <header class="flex items-start justify-between gap-5 border-b border-white/10 p-6 sm:p-9">
          <div>
            <p class="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-300">
              Rapport final · {finalReport.caseId}
            </p>
            <h2 class="mt-2 font-serif text-4xl text-white sm:text-5xl">{finalReport.title}</h2>
            <p class="mt-3 text-sm uppercase tracking-wider text-emerald-200/70">
              {finalReport.disposition}
            </p>
          </div>
          <button
            class="text-3xl text-white/40 hover:text-white"
            aria-label="Fermer le rapport"
            onclick={() => (reportOpen = false)}>×</button
          >
        </header>

        <div class="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.1fr_0.9fr]">
          <section>
            <p class="text-[10px] font-bold uppercase tracking-widest text-[#d6b35a]">
              Reconstitution retenue
            </p>
            <ol class="mt-4 space-y-4 border-l border-[#d6b35a]/30 pl-6">
              {#each finalReport.mechanism as step, index}
                <li class="relative text-sm leading-relaxed text-white/70">
                  <span
                    class="absolute -left-[2.05rem] flex h-5 w-5 items-center justify-center rounded-full border border-[#d6b35a]/50 bg-[#0a0f0f] font-mono text-[8px] text-[#d6b35a]"
                    >{index + 1}</span
                  >{step}
                </li>
              {/each}
            </ol>

            <div class="mt-8 grid gap-3 sm:grid-cols-3">
              {#each reportGroups as group}
                <div class="border border-white/10 p-3">
                  <p class="text-[9px] font-bold uppercase tracking-wider {group.tone}">
                    {group.label} · {group.evidence.length}
                  </p>
                  <ul class="mt-2 space-y-1">
                    {#each group.evidence as evidence}<li
                        class="text-xs leading-snug text-white/50"
                      >
                        {evidence.title}
                      </li>{/each}
                  </ul>
                </div>
              {/each}
            </div>
          </section>

          <aside class="space-y-6">
            <section class="border border-red-400/20 bg-red-400/[0.04] p-5">
              <p class="text-[10px] font-bold uppercase tracking-widest text-red-200">
                Inconnues persistantes
              </p>
              <ul class="mt-3 space-y-2">
                {#each finalReport.unknowns as unknown}<li
                    class="flex gap-2 text-xs leading-relaxed text-white/60"
                  >
                    <span class="text-red-300">?</span><span>{unknown}</span>
                  </li>{/each}
              </ul>
            </section>
            <section class="border border-white/10 p-5">
              <p class="text-[10px] font-bold uppercase tracking-widest text-white/40">
                Hypothèses écartées
              </p>
              <ul class="mt-3 space-y-2">
                {#each finalReport.rejectedHypotheses as hypothesis}<li
                    class="text-xs text-white/50"
                  >
                    × {hypothesis}
                  </li>{/each}
              </ul>
            </section>
            <p class="text-xs leading-relaxed text-amber-100/55">
              Conclusion procédurale : le mécanisme peut être communiqué aux gardes. Toute
              accusation nominative dépasserait les éléments disponibles au chapitre {investigation.chapter}.
            </p>
          </aside>
        </div>

        <footer
          class="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 px-6 py-5 sm:px-9"
        >
          <span class="text-[9px] uppercase tracking-wider text-white/30"
            >Signé · {investigation.investigator}</span
          >
          <div class="flex gap-2">
            <button
              class="border border-white/20 px-4 py-2 text-[10px] uppercase tracking-wider text-white/55 hover:text-white"
              onclick={() => {
                reportOpen = false
                openNotebook('evidence')
              }}>Revoir les pièces</button
            ><button
              class="border border-emerald-400/40 px-4 py-2 text-[10px] uppercase tracking-wider text-emerald-200 hover:bg-emerald-400/10"
              onclick={() => (reportOpen = false)}>Retour à la scène</button
            >
          </div>
        </footer>
      </article>
    </div>
  {/if}

  {#if briefingOpen}
    <div
      class="absolute inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#050809]/95 p-4 backdrop-blur-md"
    >
      <section class="w-full max-w-3xl border border-[#d6b35a]/35 bg-[#0b0f10] shadow-2xl">
        <div class="border-b border-white/10 p-6 sm:p-9">
          <p class="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d6b35a]">
            {ui.briefing}
          </p>
          <h2 class="mt-3 font-serif text-4xl text-white sm:text-6xl">{investigation.title}</h2>
          <p class="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
            {ui.briefingBody}
          </p>
        </div>
        <div class="grid gap-7 p-6 sm:grid-cols-[1fr_0.8fr] sm:p-9">
          <div>
            <p class="text-[10px] font-bold uppercase tracking-widest text-white/40">
              {ui.mission}
            </p>
            <p class="mt-3 font-serif text-xl leading-relaxed text-white/85">
              {investigation.objective}
            </p>
            <p class="mt-4 text-xs leading-relaxed text-amber-100/65">
              {ui.canonLimit}
            </p>
          </div>
          <ol class="space-y-3 border-l border-white/10 pl-6">
            {#each investigation.objectives as objective, index}
              <li class="flex gap-3 text-sm text-white/65">
                <span class="font-mono text-[#d6b35a]">0{index + 1}</span><span
                  >{objective.label}</span
                >
              </li>
            {/each}
          </ol>
        </div>
        <div
          class="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 px-6 py-5 sm:px-9"
        >
          <p class="text-[9px] uppercase tracking-wider text-white/30">
            {ui.saved}
          </p>
          <button
            class="border border-[#d6b35a] bg-[#d6b35a] px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-black hover:bg-[#f0cf76]"
            onclick={startInvestigation}>{ui.enter}</button
          >
        </div>
      </section>
    </div>
  {/if}
</div>

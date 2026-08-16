<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte'
  import { centroid } from '$lib/tour/hatsu'
  import { theShip, crossingsOn } from '$lib/tour/blueprint'
  import TourScene from '$lib/components/tour/TourScene.svelte'
  import TourModeFullscreen from '$lib/components/tour/TourModeFullscreen.svelte'
  import TourMinimapPanel from '$lib/components/tour/TourMinimapPanel.svelte'
  import InvestigationHatsuEffect from './InvestigationHatsuEffect.svelte'
  import CaseSubjectPanel from './case/CaseSubjectPanel.svelte'
  import CaseBinder from './case/CaseBinder.svelte'
  import CaseReportPanel from './case/CaseReportPanel.svelte'
  import CaseBriefing from './case/CaseBriefing.svelte'
  import { locale, t } from '$lib/i18n'
  import { caseById } from '$lib/investigation/catalog'
  import { caseUi } from '$lib/investigation/caseLabels'
  import { CaseSession } from '$lib/investigation/caseSession.svelte'
  import { subjectSceneAppearance } from '$lib/investigation/appearance'
  import { activeHatsu, closeHatsuGate, hatsuPanelOpen, openHatsuGate } from '$lib/nen/hatsuState'
  import type { Apparition } from '$lib/tour/apparitions'
  import type { Space, Vec2 } from '$lib/tour/types'
  import { ModeNenState } from '$lib/nen/modeState.svelte'
  import GameManualOverlay from '$lib/components/tour/GameManualOverlay.svelte'

  /**
   * The room, and the dossier over it.
   *
   * This component is the scene — the deck, the people standing in it, the
   * heads-up chrome — and the four panels the visitor opens on top of it. What
   * they have found and whom they have questioned is `CaseSession`; what the
   * chrome says is `caseLabels`; each panel is its own file under `case/`.
   * Seventeen hundred lines of it were one file, which is a dossier nobody can
   * open either.
   */
  let { caseId }: { caseId: string } = $props()

  const ship = theShip()
  const modeNen = new ModeNenState()
  const initialCaseId = untrack(() => caseId)
  const initialDefinition = caseById(initialCaseId, 'fr')!
  const definition = $derived(caseById(caseId, $locale)!)
  const investigation = $derived(definition.content)
  const ui = $derived(caseUi($locale))

  const session = new CaseSession({ definition: () => definition, labels: () => ui })

  let tierId = $state(initialDefinition.scene.tierId)
  let currentSpace = $state<Space | null>(null)
  let position = $state<Vec2>([0, 0])
  let heading = $state(Math.PI)
  let jumpTo = $state<string | null>(initialDefinition.scene.spaceId)
  let manualOpen = $state(false)

  const nameOf = (entity: { name: string; nameFr?: string | null } | null | undefined) => {
    if (!entity) return ''
    return $locale === 'fr' && entity.nameFr ? entity.nameFr : entity.name
  }

  function selectTier(id: string) {
    tierId = id
  }

  const plan = $derived(ship.plans.get(tierId)!)
  const crossings = $derived(crossingsOn(ship, tierId))
  const decks = $derived(
    ship.decks.map((tier) => ({
      id: tier.id,
      label: nameOf(tier),
      active: tier.id === tierId,
    })),
  )

  onDestroy(() => {
    session.stopReplay()
  })

  const interactables = $derived.by(() => {
    const space = ship.spaces.get(definition.scene.spaceId)
    const center = space ? centroid(space) : ([0, 0] as Vec2)
    return investigation.subjects.map((subject) => ({
      ...subject,
      position: [center[0] + subject.posOffset[0], center[1] + subject.posOffset[1]] as Vec2,
    }))
  })

  const extras = $derived.by(() => {
    const people = interactables.map((subject) => {
      const appearance = subjectSceneAppearance(subject)
      return {
        id: subject.id,
        kind: 'avatar',
        colour: appearance.colour,
        size: appearance.size,
        y: appearance.y,
        at: subject.position,
        tierId: definition.scene.tierId,
        spaceId: definition.scene.spaceId,
        stage: 0,
        human: {
          role: subject.isDead ? 'victim' : 'witness',
          identity: `investigation:${subject.id}`,
          pose: subject.isDead ? 'fallen' : 'idle',
          aura: 'none',
        },
        hidden: false,
        pick: true,
      } as Apparition
    })
    const furykov = interactables.find((subject) => subject.id === 'furykov')
    if (!furykov) return people
    const doll: Apparition = {
      id: 'silent-majority-doll',
      kind: 'avatar',
      colour: 0x171717,
      size: 0.42,
      y: 0,
      at: [furykov.position[0], furykov.position[1] + 0.85],
      tierId: definition.scene.tierId,
      spaceId: definition.scene.spaceId,
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

  onMount(() => {
    openHatsuGate({
      admits: (kind) => definition.hatsuRules.some((rule) => rule.kinds.includes(kind)),
      reason: ui.hatsuGateReason,
    })
    session.restore()
    return closeHatsuGate
  })

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === '?' || event.key === 'h' || event.key === 'H') {
      manualOpen = !manualOpen
      event.preventDefault()
      return
    }
    if (manualOpen) return // Block game inputs while manual is open
    if (event.key !== 'Escape') return
    session.closeTopLayer()
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
  <title>Investigation · {investigation.title}</title>
  <meta name="description" content={ui.description} />
</svelte:head>

<div class="relative h-[100dvh] w-full overflow-hidden bg-[#050809] font-sans text-[#f4ead4]">
  <TourModeFullscreen />
  <TourMinimapPanel
    {plan}
    {position}
    {heading}
    currentSpaceId={currentSpace?.id ?? null}
    {decks}
    {crossings}
    {nameOf}
    onSelectDeck={selectTier}
    onSelectPlan={(space) => {
      position = centroid(space)
      currentSpace = space
    }}
  />
  <TourScene
    {ship}
    bind:tierId
    bind:currentSpace
    bind:position
    bind:heading
    bind:jumpTo
    {extras}
    nen={modeNen.value}
    onNenChange={modeNen.use}
    onPick={session.handlePick}
    touchLabels={{ move: $t.tour.touch.move, cast: $t.tour.touch.cast }}
    soundLabels={{ silence: $t.tour.sound.silence, restore: $t.tour.sound.restore }}
    loadingLabel={$t.tour.loading}
    unsupportedLabel={$t.tour.unsupported}
  />
  <InvestigationHatsuEffect
    kind={session.hatsuEffectKind}
    sequence={session.hatsuEffectSequence}
    target={session.hatsuEffectTarget}
    forbidden={session.hatsuResult?.tone === 'forbidden'}
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
    <div
      class="relative max-w-xl overflow-hidden rounded-xl border border-sky-300/30 bg-[#0a0f1c]/80 p-4 backdrop-blur-md shadow-[0_0_20px_rgba(56,189,248,0.2)]"
    >
      <div
        class="absolute -left-1 top-1/2 h-8 w-2 -translate-y-1/2 rounded-r bg-sky-400 shadow-[0_0_10px_#38bdf8]"
      ></div>
      <p
        class="text-[10px] font-bold uppercase tracking-[0.28em] text-sky-300 drop-shadow-[0_0_5px_rgba(56,189,248,0.5)]"
      >
        {ui.dossier}
        {investigation.id} · {ui.chapter}
        {investigation.chapter}
      </p>
      <h1 class="mt-1 font-black text-2xl leading-none text-white drop-shadow-md sm:text-4xl">
        {investigation.title}
      </h1>
      <p class="mt-2 text-xs text-sky-100/70 sm:text-sm">
        {investigation.location} · {investigation.objective}
      </p>
    </div>

    <div class="pointer-events-auto flex w-full items-stretch justify-end gap-3 sm:w-auto">
      <button
        class="group relative min-w-0 flex-1 overflow-hidden rounded-lg border border-sky-400/20 bg-[#0a0f1c]/90 px-4 py-2 text-left backdrop-blur-md transition-all hover:border-sky-400/60 hover:shadow-[0_0_15px_rgba(56,189,248,0.3)] sm:flex-none"
        onclick={() => hatsuPanelOpen.set(true)}
      >
        <span
          class="absolute inset-0 bg-gradient-to-br from-sky-400/0 via-sky-400/5 to-sky-400/10 opacity-0 transition-opacity group-hover:opacity-100"
        ></span>
        <span class="relative z-10 flex items-center gap-2">
          <span class="block h-2 w-2 rounded-full bg-fuchsia-400 shadow-[0_0_5px_#e879f9]"></span>
          <span class="block text-[9px] font-bold uppercase tracking-[0.2em] text-sky-300/70"
            >Hatsu</span
          >
        </span>
        <span
          class="relative z-10 mt-1 block max-w-28 truncate text-xs font-black tracking-wide drop-shadow-md"
          style:color={$activeHatsu?.color ?? '#ffffff'}>{$activeHatsu?.name ?? ui.choose}</span
        >
      </button>
      <button
        class="group relative min-w-0 flex-1 overflow-hidden rounded-lg border border-sky-400/40 bg-sky-900/60 px-5 py-3 text-left backdrop-blur-md transition-all hover:border-sky-400 hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] sm:min-w-32 sm:flex-none"
        onclick={() =>
          session.solved ? (session.reportOpen = true) : session.openNotebook('evidence')}
      >
        <span
          class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"
        ></span>
        <span class="relative z-10 flex items-center justify-between gap-3">
          <span
            class="block text-[9px] font-bold uppercase tracking-[0.22em] text-sky-300 drop-shadow-[0_0_5px_rgba(56,189,248,0.5)]"
          >
            BOOK
          </span>
          <span
            class="flex h-5 w-5 items-center justify-center rounded-full border border-sky-300/50 bg-sky-400/20 text-[10px] text-sky-100"
          >
            {session.solved ? '✓' : session.discoveredIds.length}
          </span>
        </span>
        <span class="relative z-10 mt-1 block text-sm font-black text-white drop-shadow-md"
          >{session.solved ? ui.solved : `${ui.items}`}</span
        >
        <span
          class="relative z-10 mt-2 block h-1 overflow-hidden rounded-full bg-sky-950 shadow-inner"
          ><span
            class="block h-full rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8] transition-all"
            style:width={`${session.progress}%`}
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
      {#each investigation.subjects as subject (subject.id)}
        <button
          class="pointer-events-auto border bg-black/70 px-3 py-2 text-left backdrop-blur transition {session.discoveredIds.some(
            (id) => subject.evidenceIds.includes(id),
          )
            ? 'border-[#d6b35a]/60'
            : 'border-white/15 hover:border-white/40'}"
          onclick={() => session.openSubject(subject.id)}
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
          >{session.completedObjectives}/{investigation.objectives.length}</span
        >
      </div>
      <ul class="mt-3 space-y-2">
        {#each investigation.objectives as objective (objective.id)}
          {@const complete = objective.requiredEvidenceIds.every((id) =>
            session.discoveredIds.includes(id),
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

  <CaseSubjectPanel {session} {ui} />
  <CaseBinder {session} {ui} />
  <CaseReportPanel {session} {ui} />
  <CaseBriefing {session} {ui} />

  <GameManualOverlay
    open={manualOpen}
    title="Investigation Mode"
    titleFr="Mode Investigation"
    objective="Explore the crime scene, gather evidence, interrogate witnesses, and solve the mystery using Nen."
    objectiveFr="Explorez la scène de crime, rassemblez des preuves, interrogez les témoins et résolvez le mystère en utilisant le Nen."
    controls={[
      { keys: ['W', 'A', 'S', 'D'], description: 'Move around', descriptionFr: 'Se déplacer' },
      {
        keys: ['Click'],
        description: 'Inspect object / Speak to witness',
        descriptionFr: 'Inspecter objet / Parler au témoin',
      },
      { keys: ['H'], description: 'Open Hatsu Panel', descriptionFr: 'Ouvrir le panneau Hatsu' },
      {
        keys: ['N'],
        description: 'Use Ren/Gyo (Toggle aura)',
        descriptionFr: 'Utiliser Ren/Gyo (Activer aura)',
      },
      {
        keys: ['Esc'],
        description: 'Close current panel',
        descriptionFr: 'Fermer le panneau actuel',
      },
    ]}
    onClose={() => (manualOpen = false)}
  />
</div>

<script lang="ts">
  import ModeCommand from '$lib/components/game/ModeCommand.svelte'
  import { modeShortcut, runModeCommand } from '$lib/components/game/modeKeyboard'
  import ModeHudGauge from '$lib/components/game/ModeHudGauge.svelte'
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
      // Only Loberry and its user see the doll; the visitor needs Gyo to catch it.
      hidden: true,
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

  let aimedExtra = $state<string | null>(null)
  const casePanelOpen = $derived(
    session.briefingOpen || session.reportOpen || session.notebookOpen || !!session.activeSubjectId,
  )

  function examineAim() {
    if (aimedExtra && !casePanelOpen && !manualOpen) session.handlePick(aimedExtra)
  }

  function openEvidence() {
    if (session.solved) session.reportOpen = true
    else session.openNotebook('evidence')
  }

  function handleKeydown(event: KeyboardEvent) {
    const code = modeShortcut(event)
    if (code === '?') return runModeCommand(event, () => (manualOpen = !manualOpen))
    if (manualOpen) return
    if (code === 'Escape' && casePanelOpen) return runModeCommand(event, session.closeTopLayer)
    if (casePanelOpen || $hatsuPanelOpen) return
    if (code === 'KeyM') runModeCommand(event, openEvidence)
    if (code === 'KeyL' || code === 'KeyH') runModeCommand(event, () => hatsuPanelOpen.set(true))
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
  <title>Investigation · {investigation.title}</title>
  <meta name="description" content={ui.description} />
</svelte:head>

<div
  class="relative h-[calc(100dvh-var(--header-height))] w-full overflow-hidden bg-[#050809] font-sans text-[#f4ead4]"
>
  <TourModeFullscreen />
  <TourMinimapPanel
    compact
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
    bind:aimedExtra
    onPick={session.handlePick}
    onPhysicalNenAction={examineAim}
    inputDisabled={manualOpen || casePanelOpen || $hatsuPanelOpen}
    modeKeyboard
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
    class="mode-hud pointer-events-none absolute inset-x-0 top-12 z-30 flex flex-col items-start justify-between gap-3 p-3 sm:flex-row sm:gap-4 sm:p-6"
  >
    <div class="mode-hud-surface min-w-0 max-w-xl p-3 sm:p-4">
      <p class="mode-hud-label">
        {ui.dossier} · {investigation.subtitle} · {ui.chapter}
        {investigation.chapter}
      </p>
      <h1 class="mode-hud-title mt-1">
        {investigation.title}
      </h1>
      <p class="mt-2 text-xs text-sky-100/70 sm:text-sm">
        {investigation.location} · {investigation.objective}
      </p>
    </div>

    <div
      class="pointer-events-auto grid w-[calc(100%-5rem)] shrink-0 grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-2 self-end sm:w-auto sm:self-start"
    >
      <button
        type="button"
        class="mode-hud-button hatsu-button text-left"
        aria-keyshortcuts="L H"
        onclick={() => hatsuPanelOpen.set(true)}
      >
        <span class="mode-hud-label"><kbd aria-hidden="true">L</kbd> Hatsu</span>
        <span style:color={$activeHatsu?.color ?? '#ffffff'}>{$activeHatsu?.name ?? ui.choose}</span
        >
      </button>
      <button
        type="button"
        class="mode-hud-button evidence-button text-left"
        data-primary={session.solved ? '' : undefined}
        aria-keyshortcuts="M"
        onclick={openEvidence}
      >
        <span class="mode-hud-label"><kbd aria-hidden="true">M</kbd> {ui.book}</span>
        <span>{session.solved ? ui.solved : ui.items}</span>
        <span class="mode-hud-value" aria-hidden="true">
          {session.solved ? '✓' : session.discoveredIds.length}
        </span>
        <span class="sr-only">
          {session.discoveredIds.length} · {Math.round(session.progress)}%
        </span>
        <span class="evidence-track" aria-hidden="true">
          <span style:width={`${session.progress}%`}></span>
        </span>
      </button>
    </div>
  </header>

  <div
    class="mode-hud pointer-events-none absolute bottom-5 right-4 z-30 grid w-72 max-w-[calc(100%-2rem)] gap-2"
    data-tone="gold"
  >
    <aside class="mode-hud-surface hidden p-3 sm:block">
      <p class="mode-hud-label mb-2">
        {ui.people}
      </p>
      <div class="grid grid-cols-2 gap-1.5">
        {#each investigation.subjects as subject (subject.id)}
          <button
            class="mode-hud-button pointer-events-auto subject-button text-left"
            data-primary={session.subjectReviewed(subject) ? '' : undefined}
            onclick={() => session.openSubject(subject.id)}
          >
            <span class="block text-xs font-semibold text-white">{subject.name}</span>
            <span class="mode-hud-label mt-0.5 block">{subject.role}</span>
          </button>
        {/each}
      </div>
    </aside>

    <aside class="mode-hud-surface hidden p-3 lg:block">
      <ModeHudGauge
        label={ui.objectives}
        value={session.completedObjectives}
        max={investigation.objectives.length}
        kind="progressbar"
      />
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
    </aside>
  </div>

  <div class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
    <div class="h-2 w-2 rounded-full border border-white/70 bg-black/20"></div>
  </div>

  {#if !casePanelOpen && !manualOpen && !$hatsuPanelOpen}
    <div class="mode-hud mode-hud-actions case-actions absolute right-3 z-30 justify-end">
      <ModeCommand
        label="Gyo"
        shortcut="G"
        pressed={modeNen.value.gyo}
        onclick={() => modeNen.use({ type: 'GYO', on: !modeNen.value.gyo })}
      />
      <ModeCommand
        label={$locale === 'fr' ? 'Examiner' : 'Inspect'}
        shortcut="F"
        primary
        disabled={!aimedExtra}
        onclick={examineAim}
      />
    </div>
  {/if}

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
      { keys: ['?'], description: 'Show this manual', descriptionFr: 'Afficher ce manuel' },
      {
        keys: ['G'],
        description: 'Gyo (See what is hidden)',
        descriptionFr: 'Gyo (Voir ce qui est caché)',
      },
      { keys: ['F'], description: 'Inspect the target', descriptionFr: 'Examiner la cible visée' },
      { keys: ['L', 'H'], description: 'Choose a Hatsu', descriptionFr: 'Choisir un Hatsu' },
      { keys: ['M'], description: 'Open the notebook', descriptionFr: 'Ouvrir le carnet' },
      { keys: ['R'], description: 'Ren (Raise aura)', descriptionFr: "Ren (Intensifier l'aura)" },
      { keys: ['N'], description: 'En (Sweep area)', descriptionFr: 'En (Balayer la zone)' },
      {
        keys: ['Esc'],
        description: 'Close current panel',
        descriptionFr: 'Fermer le panneau actuel',
      },
    ]}
    onClose={() => (manualOpen = false)}
  />
</div>

<style>
  .case-actions {
    bottom: max(0.75rem, env(safe-area-inset-bottom));
  }
  @media (min-width: 640px) {
    .case-actions {
      right: 19rem;
    }
  }
  @media (pointer: coarse) {
    .case-actions {
      bottom: calc(11.25rem + env(safe-area-inset-bottom));
    }
  }

  .hatsu-button,
  .evidence-button,
  .subject-button {
    display: grid;
    justify-items: start;
  }
  .evidence-button {
    grid-template-columns: minmax(0, 1fr) auto;
    justify-content: stretch;
    gap: 0.2rem 0.6rem;
  }
  .evidence-button .mode-hud-value {
    justify-self: end;
  }
  .evidence-button > :first-child {
    grid-column: 1 / -1;
  }
  .evidence-track {
    justify-self: stretch;
    grid-column: 1 / -1;
    height: 0.3rem;
    min-width: 5rem;
    overflow: hidden;
    background: #03080d;
  }
  .evidence-track span {
    display: block;
    height: 100%;
    background: var(--mode-accent);
  }
</style>

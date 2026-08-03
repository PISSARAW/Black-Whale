<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import Seo from '$lib/components/Seo.svelte'
  import TourScene from '$lib/components/tour/TourScene.svelte'
  import TourModeFullscreen from '$lib/components/tour/TourModeFullscreen.svelte'
  import { buildArena } from '$lib/hunt/arena'
  import { ModeNenState } from '$lib/nen/modeState.svelte'
  import { createNenTechniqueState, transitionNen, type NenTechniqueAction } from '@black-whale/nen-engine'
  import { isNenControlCode } from '$lib/nen/controls'
  import { buildNavGraph } from '$lib/hunt/navmesh'
  import { floorOf, theShip, crossingsOn, type Crossing } from '$lib/tour/blueprint'
  import { centroid, EMPTY_WORLD } from '$lib/tour/hatsu'
  import { interiorPoint } from '$lib/tour/geometry'
  import TourMinimapPanel from '$lib/components/tour/TourMinimapPanel.svelte'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import { link, locale, t } from '$lib/i18n'
  import type { Apparition } from '$lib/tour/apparitions'
  import type { Space, Vec2 } from '$lib/tour/types'
  import {
    infiltrationReducer,
    initialInfiltrationState,
    type InfiltrationAction,
    type WitnessId,
  } from '$lib/infiltration/state'
  import { INFILTRATION_DT, reconstruction, updateInfiltration } from '$lib/infiltration/loop'
  import { INFILTRATION_HATSU, planHatsu, type ForgerySurface } from '$lib/infiltration/hatsu'

  import type { CoverRole } from '$lib/infiltration/social/cover'
  import { evaluateRun } from '$lib/infiltration/balance'
  import { MISSIONS, selectMission } from '$lib/infiltration/missions/definitions'
  import { seedFromText } from '$lib/infiltration/missions/random'
  import type { MissionId } from '$lib/infiltration/missions/types'
  import { decodeSave, encodeSave } from '$lib/infiltration/persistence'
  import { causalTimeline, debriefAxes } from '$lib/infiltration/debrief'
  import { applyConsequences, initialCampaign, type CampaignState } from '$lib/infiltration/campaign'
  import { infiltrationHatsuManifestations } from '$lib/infiltration/hatsuPresentation'
  import { playInfiltrationHatsuSound } from '$lib/audio/infiltrationHatsuSounds'

  const modeNen = new ModeNenState()
  const ship = theShip()
  const arena = buildArena()
  const graph = buildNavGraph(arena)
  let plan = $state(ship.plans.get(arena.tierId)!)
  const extraction = arena.spaces[0]
  const defaultSeed = seedFromText('black-whale-v2')
  const forgerySurfaces: ForgerySurface[] = ['work-order', 'door-sign', 'register-copy']
  const disguiseIdentities: CoverRole[] = ['maintenance', 'security', 'service', 'messenger']
  let selectedMission = $state<MissionId>('missing-report')
  let campaign = $state<CampaignState>(initialCampaign())

  const roomName = (space: Space | undefined | null) =>
    space ? ($locale === 'fr' ? space.nameFr : space.name) : '—'

  const nameOf = (entity: Space | { name: string; nameFr: string } | undefined) => {
    if (!entity) return '—'
    return $locale === 'fr' ? entity.nameFr : entity.name
  }

  let tierId = $state(arena.tierId)

  function selectTier(id: string) {
    tierId = id
    const newPlan = ship.plans.get(id)
    if (newPlan) {
      plan = newPlan
      const newArena = buildArena()
      if (newArena.tierId === id) {
        const newSpace = newArena.spaces.find((s) => s.id === currentSpace?.id) ?? newArena.spaces[0]
        position = centroid(newSpace)
        currentSpace = newSpace
      }
    }
  }

  const crossings = $derived(crossingsOn(ship, tierId))
  const decks = $derived(
    ship.decks.map((tier) => ({
      id: tier.id,
      label: nameOf(tier),
      active: tier.id === tierId,
    })),
  )

  function freshGame() {
    const selection = selectMission(selectedMission, defaultSeed)
    const objective = arena.spaces[selection.variant.objectiveIndex]
    return initialInfiltrationState({
      playerAt: { position: interiorPoint(extraction.footprint), spaceId: extraction.id },
      objectiveSpaceId: objective.id,
      extractionSpaceId: extraction.id,
      selection,
      witnesses: selection.definition.witnesses.map((definition, index) => {
        const space = arena.spaces[definition.spaceIndex]
        const neighbours = graph.edges.get(space.id) ?? []
        const rotated = neighbours.map((_, routeIndex) =>
          neighbours[(routeIndex + selection.variant.routeOffset) % neighbours.length],
        )
        return {
        id: definition.id,
        position: centroid(space),
        heading: index % 2 === 0 ? 0 : Math.PI,
        spaceId: space.id,
        sight: definition.sight,
        social: definition.social,
        usesEn: definition.usesEn,
        route: [space.id, ...rotated],
      }}),
    })
  }

  const spawn = interiorPoint(extraction.footprint)
  let game = $state(freshGame())
  let position = $state<Vec2>(spawn)
  let heading = $state(0)
  let currentSpace = $state<Space | null>(extraction)
  let engaged = $state(false)
  let briefing = $state(true)
  let frame = 0
  let owed = 0
  let last = 0
  let autosave: ReturnType<typeof setInterval> | undefined

  let finished = $derived(game.outcome !== 'playing')
  let objective = $derived(arena.spaces.find((space) => space.id === game.objectiveSpaceId)!)
  let canCopy = $derived(currentSpace?.id === objective.id && !game.documentCopied)
  let canVerify = $derived(
    currentSpace?.id === objective.id && game.documentCopied && !game.authorConfirmed,
  )
  let canExtract = $derived(currentSpace?.id === extraction.id && game.documentCopied)
  let report = $derived(reconstruction(game))
  let hatsuPlan = $derived(planHatsu(game))
  let balance = $derived(evaluateRun(game))
  let verdict = $derived(debriefAxes(game))
  let timeline = $derived(causalTimeline(game))
  let scoutDestinations = $derived(
    game.hatsu.scout?.active
      ? (graph.edges.get(game.hatsu.scout.spaceId) ?? [])
          .map((id) => arena.spaces.find((space) => space.id === id))
          .filter((space): space is Space => !!space)
      : [],
  )
  let nearbyHatsuTargets = $derived(
    game.witnesses.filter((witness) => witness.spaceId === currentSpace?.id),
  )
  let needsHatsuTarget = $derived(
    ['secret-window', 'bloody-mary', 'body-and-soul'].includes(game.hatsu.id),
  )

  const colours: Record<WitnessId, number> = {
    steward: 0x58a6ff,
    guard: 0xffb347,
    nenGuard: 0xff4f64,
  }

  function witnessNen(witness: (typeof game.witnesses)[number]) {
    let nen = createNenTechniqueState<'head' | 'torso' | 'hands' | 'feet'>()
    if (witness.id !== 'nenGuard') {
      nen.mode = 'zetsu'
      return nen
    }
    if (witness.challenged) nen = transitionNen(nen, { type: 'KEN', on: true }).state
    if (witness.usesEn) nen = transitionNen(nen, { type: 'EN', radius: 8 }).state
    return nen
  }

  let figures = $derived(
    game.witnesses.map((witness): Apparition => ({
      id: witness.id,
      kind: 'avatar',
      colour: colours[witness.id],
      size: 0.42,
      y: floorOf(
        arena.spaces.find((space) => space.id === witness.spaceId)!,
        plan.tier,
      ),
      at: witness.position,
      heading: witness.heading,
      tierId: arena.tierId,
      spaceId: witness.spaceId,
      stage: 0,
      human: {
        role: witness.id === 'steward' ? 'steward' : witness.id === 'nenGuard' ? 'nen-guard' : 'guard',
        identity: `infiltration:${witness.id}`,
        alert: witness.challenged || witness.investigating !== null,
        pose: witness.investigating ? 'search' : 'walk',
        aura: witness.usesEn ? 'ten' : 'none',
        nen: witnessNen(witness),
      },
      hidden: false,
    })),
  )
  let hatsuFigures = $derived<Apparition[]>(
    infiltrationHatsuManifestations(game).map((manifestation) => {
      const space = arena.spaces.find((candidate) => candidate.id === manifestation.spaceId) ?? extraction
      return {
        ...manifestation, y: floorOf(space, plan.tier) + 1.1, heading: 0,
        tierId: arena.tierId, stage: manifestation.stage ?? 0, hidden: false,
      }
    }),
  )

  function moveScoutTo(space: Space) {
    send({
      type: 'SCOUT_MOVE', position: centroid(space), spaceId: space.id,
      visibleToGuard: game.witnesses.some((witness) => witness.spaceId === space.id),
    })
  }

  function send(action: InfiltrationAction) {
    const wasPlaying = game.outcome === 'playing'
    const prior = game
    game = infiltrationReducer(game, action)
    if (action.type === 'CAST_HATSU' && game !== prior) playInfiltrationHatsuSound(game.hatsu.id)
    if (wasPlaying && game.outcome === 'escaped') {
      campaign = applyConsequences(campaign, {
        missionId: game.mission.id,
        discoveredSpaces: [...new Set(game.witnesses.map((witness) => witness.spaceId))],
        compromisedRole: game.coverIntegrity < 50 ? game.cover.role : undefined,
        learnedProcedure: game.security.level !== 'normal' ? game.security.level : undefined,
      })
      localStorage.setItem('black-whale:infiltration:campaign:v1', JSON.stringify(campaign))
    }
  }

  function useStandardNen(action: NenTechniqueAction) {
    modeNen.use(action)
    if (action.type === 'TEN' && game.player.nen === 'zetsu') send({ type: 'ZETSU' })
    if (action.type === 'ZETSU' && game.player.nen !== 'zetsu') send({ type: 'ZETSU' })
  }

  function act() {
    if (canCopy) send({ type: 'COPY' })
    else if (canVerify) send({ type: 'VERIFY' })
    else if (canExtract) send({ type: 'EXTRACT' })
  }

  function onKeyDown(event: KeyboardEvent) {
    if (finished || event.repeat) return
    if (game.challenge && event.code === 'Digit1') {
      send({ type: 'ANSWER', answer: 'workOrder' })
      event.preventDefault()
      return
    } else if (game.challenge && event.code === 'Digit2') {
      send({ type: 'ANSWER', answer: 'bluff' })
      event.preventDefault()
      return
    } else if (briefing && ['Digit1', 'Digit2', 'Digit3'].includes(event.code)) {
      const ability = INFILTRATION_HATSU[Number(event.code.at(-1)) - 1]
      if (ability) send({ type: 'SELECT_HATSU', id: ability.id })
      event.preventDefault()
      return
    } else if (briefing && event.code === 'Enter') {
      briefing = false
      event.preventDefault()
      return
    } else if (briefing) return
    if (isNenControlCode(event.code)) return
    if (event.code === 'KeyV') send({ type: 'DIVERT' })
    else return
    event.preventDefault()
  }

  function tick(now: number) {
    frame = requestAnimationFrame(tick)
    const elapsed = last === 0 ? 0 : (now - last) / 1000
    last = now
    if (briefing || finished) return
    owed = Math.min(0.25, owed + elapsed)
    const moved = Math.hypot(
      position[0] - game.player.position[0],
      position[1] - game.player.position[1],
    )
    send({
      type: 'WALKED',
      position,
      spaceId: currentSpace?.id ?? null,
      moving: moved > 0.001,
      speed: elapsed > 0 ? moved / elapsed : 0,
    })
    while (owed >= INFILTRATION_DT && game.outcome === 'playing') {
      game = updateInfiltration(game, { dt: INFILTRATION_DT, graph, arena })
      owed -= INFILTRATION_DT
    }
  }

  function again() {
    game = freshGame()
    position = game.player.position
    briefing = true
    owed = 0
    last = 0
  }

  function chooseMission(id: MissionId) {
    selectedMission = id
    game = freshGame()
    position = game.player.position
    currentSpace = extraction
    resetClock()
  }

  onMount(() => {
    try {
      const storedCampaign = JSON.parse(localStorage.getItem('black-whale:infiltration:campaign:v1') ?? 'null')
      if (storedCampaign?.version === 1) campaign = storedCampaign
    } catch { /* A corrupt campaign never blocks a mission. */ }
    const saved = decodeSave(localStorage.getItem('black-whale:infiltration:v3') ?? localStorage.getItem('black-whale:infiltration:v2') ?? '')
    if (saved?.state.outcome === 'playing') {
      game = saved.state
      selectedMission = saved.state.mission.id
      position = saved.state.player.position
      currentSpace = arena.spaces.find((space) => space.id === saved.state.player.spaceId) ?? extraction
    }
    autosave = setInterval(() => {
      if (game.outcome === 'playing' && !briefing)
        localStorage.setItem('black-whale:infiltration:v3', encodeSave(game))
    }, 3000)
    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('visibilitychange', resetClock)
    frame = requestAnimationFrame(tick)
  })
  onDestroy(() => {
    if (autosave) clearInterval(autosave)
    if (typeof window === 'undefined') return
    window.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('visibilitychange', resetClock)
    cancelAnimationFrame(frame)
  })

  function resetClock() {
    last = 0
    owed = 0
  }
</script>

<Seo
  title={$t.infiltration.seoTitle}
  description={$t.infiltration.seoDescription}
  jsonLd={breadcrumbSchema([
    { name: $t.common.home, path: $link('/') },
    { name: $t.infiltration.title, path: $link('/infiltration') },
  ])}
/>

<div class="relative h-screen w-full overflow-hidden bg-black text-white">
  <TourModeFullscreen />
  <TourMinimapPanel
    ship={ship}
    tierId={tierId}
    plan={plan}
    position={position}
    heading={heading}
    currentSpaceId={currentSpace?.id ?? null}
    decks={decks}
    crossings={crossings}
    nameOf={nameOf}
    onSelectDeck={selectTier}
    onSelectPlan={(space) => {
      position = centroid(space)
      currentSpace = space
    }}
  />
  <p class="sr-only" aria-live="polite">
    {$t.infiltration.alert}
    {Math.round(game.alert)}%. {$t.infiltration.integrity}
    {Math.round(game.coverIntegrity)}%.
  </p>
  <TourScene
    {ship}
    bind:tierId
    bind:position
    bind:heading
    bind:currentSpace
    bind:engaged
    world={EMPTY_WORLD}
    nen={modeNen.value}
    showNenControls={true}
    onNenChange={useStandardNen}
    onPhysicalNenAction={act}
    onHatsu={() => send({ type: 'CAST_HATSU' })}
    extras={[...figures, ...hatsuFigures]}
    touchLabels={{ move: $t.tour.touch.move, cast: $t.tour.touch.cast }}
    soundLabels={{ silence: $t.tour.sound.silence, restore: $t.tour.sound.restore }}
    loadingLabel={$t.tour.loading}
    unsupportedLabel={$t.tour.unsupported}
  />

  {#if !briefing && !finished}
    <section
      class="pointer-events-none absolute left-4 top-16 w-[min(24rem,calc(100%-2rem))] rounded border border-white/15 bg-black/85 p-4 backdrop-blur"
    >
      <p class="text-[10px] uppercase tracking-[.25em] text-amber-300">{$t.infiltration.cover}</p>
      <h1 class="mt-1 text-lg font-bold">{$t.infiltration.title}</h1>
      <p class="mt-2 text-sm text-white/65">{roomName(currentSpace)}</p>
      <div class="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <span class="text-white/45">{$t.infiltration.integrity}</span><strong
            class="block text-lg">{Math.round(game.coverIntegrity)}%</strong
          >
        </div>
        <div>
          <span class="text-white/45">{$t.infiltration.alert}</span><strong class="block text-lg"
            >{Math.round(game.alert)}%</strong
          >
        </div>
      </div>
      <div class="mt-3 h-1 overflow-hidden rounded bg-white/10">
        <div class="h-full bg-amber-300" style:width={`${game.coverIntegrity}%`}></div>
      </div>
      <p class="mt-4 text-xs text-white/65">
        {$t.infiltration.objective}:
        <strong class={game.documentCopied ? 'text-emerald-300' : 'text-white'}
          >{game.documentCopied ? $t.infiltration.copied : roomName(objective)}</strong
        >
      </p>
      <p class="mt-1 text-xs text-white/45">
        {game.alertLevel.toUpperCase()} · {game.mission.variantId} · seed {game.mission.seed}
      </p>
      {#if game.security.verifyDocuments}
        <p class="mt-1 text-xs text-red-300">{$t.infiltration.v3.documentChecks}</p>
      {/if}
      <p class="mt-1 text-xs text-white/65">
        Nen: <strong>{game.player.nen === 'zetsu' ? 'Zetsu' : 'Ten'}</strong>
      </p>
      {#if game.hatsu.effect}
        <p class="mt-1 text-xs text-fuchsia-200">
          {game.hatsu.effect.kind}{game.hatsu.effect.witnessId
            ? ` · ${$t.infiltration.witnesses[game.hatsu.effect.witnessId]}`
            : game.hatsu.effect.spaceId
              ? ` · ${roomName(arena.spaces.find((space) => space.id === game.hatsu.effect?.spaceId))}`
              : ''}
        </p>
      {/if}
      <p class="mt-1 text-xs text-white/65">
        Hatsu: <strong
          >{INFILTRATION_HATSU.find((entry) => entry.id === game.hatsu.id)?.name}</strong
        >
        · {game.hatsu.aura} aura · {game.hatsu.uses}
        {$t.infiltration.uses}
      </p>
    </section>

    <div class="pointer-events-auto absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-cyan-900/50 bg-slate-950/85 p-3 shadow-[0_8px_32px_rgba(0,0,0,0.8),inset_0_1px_15px_rgba(6,182,212,0.1)] backdrop-blur-md">
      {#if needsHatsuTarget}
        {#each nearbyHatsuTargets as target (target.id)}
          <button
            onclick={() => send({ type: 'TARGET_HATSU', witnessId: target.id })}
            aria-pressed={game.hatsu.targetWitnessId === target.id}
            class="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-2 text-xs font-semibold text-red-200 shadow-[inset_0_1px_10px_rgba(239,68,68,0.15)] transition-all hover:border-red-500 hover:bg-red-900/60 aria-pressed:border-red-400 aria-pressed:bg-red-500/20"
          >{$t.infiltration.witnesses[target.id]}</button>
        {/each}
      {/if}
      {#if game.hatsu.scout?.active}
        {#each scoutDestinations as destination (destination.id)}
          <button onclick={() => moveScoutTo(destination)} class="rounded-xl border border-fuchsia-400/40 bg-fuchsia-950/40 px-4 py-2 text-xs font-semibold text-fuchsia-200 shadow-[inset_0_1px_10px_rgba(232,121,249,0.15)] transition-colors hover:border-fuchsia-400 hover:bg-fuchsia-900/60">
            Eye → {roomName(destination)}
          </button>
        {/each}
        <button onclick={() => send({ type: 'SCOUT_RECALL' })} class="rounded-xl border border-fuchsia-500/30 bg-black/60 px-4 py-2 text-xs font-semibold text-fuchsia-200 shadow-[inset_0_1px_8px_rgba(232,121,249,0.1)] transition-colors hover:border-fuchsia-500 hover:bg-fuchsia-900/40">{$t.infiltration.hatsuInteractive.recall}</button>
      {/if}
      {#if canCopy || canVerify || canExtract}<button
          onclick={act}
          class="rounded-xl border border-amber-400/50 bg-amber-950/50 px-5 py-2.5 text-xs font-bold tracking-wide text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.2)] transition-all hover:border-amber-400 hover:bg-amber-900/70"
          >F · {canCopy
            ? $t.infiltration.copy
            : canVerify
              ? $t.infiltration.verify
              : $t.infiltration.extract}</button
        >{/if}
      <button
        onclick={() => send({ type: 'ZETSU' })}
        aria-keyshortcuts="X"
        class="rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-4 py-2.5 text-xs font-semibold text-cyan-100 shadow-[inset_0_1px_8px_rgba(6,182,212,0.1)] transition-all hover:border-cyan-400 hover:bg-cyan-900/50">X · Ten/Zetsu</button
      >
      <button
        onclick={() => send({ type: 'DIVERT' })}
        aria-keyshortcuts="V"
        disabled={!!game.diversion}
        class="rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-4 py-2.5 text-xs font-semibold text-cyan-100 shadow-[inset_0_1px_8px_rgba(6,182,212,0.1)] transition-all hover:border-cyan-400 hover:bg-cyan-900/50 disabled:opacity-30 disabled:hover:border-cyan-500/30 disabled:hover:bg-cyan-950/30"
        >V · {$t.infiltration.divert}</button
      >
      <button
        onclick={() => send({ type: 'CAST_HATSU' })}
        aria-keyshortcuts="H"
        disabled={!hatsuPlan.available}
        title={hatsuPlan.conditions
          .filter((condition) => !condition.met)
          .map((condition) => $t.infiltration.hatsuConditions[condition.id])
          .join(' · ')}
        class="rounded-xl border border-fuchsia-400/50 bg-fuchsia-950/40 px-4 py-2.5 text-xs font-bold tracking-wide text-fuchsia-200 shadow-[0_0_15px_rgba(232,121,249,0.2)] transition-all hover:border-fuchsia-400 hover:bg-fuchsia-900/60 hover:shadow-[0_0_20px_rgba(232,121,249,0.4)] disabled:opacity-30 disabled:shadow-none"
        >H · {$t.infiltration.castHatsu}</button
      >
    </div>

    {#if game.challenge}
      <div
        class="absolute inset-0 grid place-items-center bg-red-950/80 p-6 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cover-check-title"
      >
        <section class="relative w-full max-w-md overflow-hidden rounded-xl border border-red-500/80 bg-slate-950 p-8 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
          <div class="absolute left-0 top-0 h-1 w-full bg-red-500"></div>
          <div class="absolute inset-0 pointer-events-none opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#ef4444_10px,#ef4444_20px)]"></div>
          <div class="relative z-10">
            <p class="flex items-center gap-2 text-xs font-bold uppercase tracking-[.25em] text-red-500 animate-pulse">
              <span class="inline-block h-2 w-2 rounded-full bg-red-500"></span>
              {$t.infiltration.challenge}
            </p>
            <h2 id="cover-check-title" class="mt-3 text-3xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
              {$t.infiltration.witnesses[game.challenge.witnessId]}
            </h2>
            <p class="mt-4 text-sm leading-relaxed text-red-100/80">
              {$t.infiltration.challengePrompt}
            </p>
            <p class="mt-3 text-4xl font-mono font-bold text-red-500">{Math.ceil(game.challenge.left)}<span class="text-lg text-red-500/50">s</span></p>
            <div class="mt-8 grid gap-3">
              <button
                aria-keyshortcuts="1"
                onclick={() => send({ type: 'ANSWER', answer: 'workOrder' })}
                class="group relative overflow-hidden rounded-lg border border-red-500/30 bg-red-950/40 px-5 py-4 text-left text-sm font-semibold transition-all hover:border-red-400 hover:bg-red-900/60 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                >
                <span class="absolute inset-y-0 left-0 w-1 bg-red-500 opacity-0 transition-opacity group-hover:opacity-100"></span>
                <span class="text-red-100">{$t.infiltration.workOrder}</span>
              </button>
              <button
                aria-keyshortcuts="2"
                onclick={() => send({ type: 'ANSWER', answer: 'bluff' })}
                class="group relative overflow-hidden rounded-lg border border-red-500/30 bg-red-950/40 px-5 py-4 text-left text-sm font-semibold transition-all hover:border-red-400 hover:bg-red-900/60 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                >
                <span class="absolute inset-y-0 left-0 w-1 bg-red-500 opacity-0 transition-opacity group-hover:opacity-100"></span>
                <span class="text-red-100">{$t.infiltration.bluff}</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    {/if}

    <div class="sr-only" aria-live="polite">
      {game.hatsu.effect
        ? `${game.hatsu.id}: ${game.hatsu.effect.kind}${game.hatsu.effect.payload ? `, ${game.hatsu.effect.payload}` : ''}`
        : game.hatsu.scout?.active
          ? `${game.hatsu.id}: ${game.hatsu.scout.spaceId}, signal ${Math.round(game.hatsu.scout.signal)}%`
          : ''}
    </div>
  {/if}

  {#if briefing}
    <div
      class="absolute inset-0 grid place-items-center bg-slate-950/95 p-6 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mission-title"
    >
      <article class="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-slate-700 bg-[#0a0f16] shadow-2xl">
        <div class="sticky top-0 z-10 border-b border-slate-800 bg-[#0a0f16]/95 px-8 py-5 backdrop-blur">
          <p class="flex items-center gap-3 text-xs font-bold uppercase tracking-[.3em] text-cyan-500">
            <span class="inline-block h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]"></span>
            {$t.infiltration.briefing}
            <span class="ml-auto font-mono text-[10px] text-slate-500">SECURE CONNECTION ESTABLISHED</span>
          </p>
          <h1 id="mission-title" class="mt-2 text-4xl font-black tracking-tight text-white drop-shadow-md">{$t.infiltration.title}</h1>
        </div>
        
        <div class="px-8 pb-10 pt-6">
          <p class="leading-relaxed text-slate-300">{$t.infiltration.intro}</p>
          <div class="mt-4 inline-flex items-center gap-2 rounded bg-slate-900 px-3 py-1.5 font-mono text-xs text-cyan-400/70 border border-cyan-900/50">
            <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            {$t.infiltration.v3.campaign} · {campaign.completed.length} {$t.infiltration.v3.operations} · {campaign.knownSpaces.length} {$t.infiltration.v3.knownAreas}
          </div>
          
          <div class="mt-10 mb-4 flex items-center gap-4">
            <h2 class="text-xs font-bold uppercase tracking-[.2em] text-amber-400">{$t.infiltration.chooseMission}</h2>
            <div class="h-px flex-1 bg-gradient-to-r from-amber-400/20 to-transparent"></div>
          </div>
          
          <div class="grid gap-3 sm:grid-cols-3">
            {#each Object.values(MISSIONS) as mission (mission.id)}
              <button
                onclick={() => chooseMission(mission.id)}
                aria-pressed={selectedMission === mission.id}
                class="group relative overflow-hidden rounded-lg border p-4 text-left text-xs transition-all {selectedMission === mission.id
                  ? 'border-amber-400 bg-amber-400/10 shadow-[inset_0_0_20px_rgba(251,191,36,0.15)]'
                  : 'border-slate-800 bg-slate-900/50 hover:border-amber-400/50 hover:bg-slate-800'}"
              >
                {#if selectedMission === mission.id}
                  <div class="absolute left-0 top-0 h-full w-1 bg-amber-400 shadow-[0_0_10px_#fbbf24]"></div>
                {/if}
                <strong class="block text-sm font-bold text-white transition-colors group-hover:text-amber-300">{$t.infiltration.missions[mission.id].name}</strong>
                <span class="mt-2 block leading-snug text-slate-400">{$t.infiltration.missions[mission.id].goal}</span>
              </button>
            {/each}
          </div>
          
          <div class="mt-6 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <h3 class="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Mission Objectives</h3>
            <ul class="space-y-2 text-sm text-slate-300">
              {#each game.objectives as missionObjective (missionObjective.id)}
                <li class="flex items-start gap-2">
                  <span class="mt-1 text-amber-500">◇</span>
                  {$t.infiltration.objectiveLabels[missionObjective.kind]}
                </li>
              {/each}
            </ul>
          </div>
          
          <div class="mt-10 mb-4 flex items-center gap-4">
            <h2 class="text-xs font-bold uppercase tracking-[.2em] text-fuchsia-400">{$t.infiltration.chooseHatsu}</h2>
            <div class="h-px flex-1 bg-gradient-to-r from-fuchsia-400/20 to-transparent"></div>
          </div>
          
          <div class="grid gap-3 sm:grid-cols-3">
            {#each INFILTRATION_HATSU as ability (ability.id)}
              <button
                onclick={() => send({ type: 'SELECT_HATSU', id: ability.id })}
                aria-pressed={game.hatsu.id === ability.id}
                class="group relative overflow-hidden rounded-lg border p-4 text-left text-xs transition-all {game.hatsu.id === ability.id
                  ? 'border-fuchsia-400 bg-fuchsia-400/10 shadow-[inset_0_0_20px_rgba(232,121,249,0.15)]'
                  : 'border-slate-800 bg-slate-900/50 hover:border-fuchsia-400/50 hover:bg-slate-800'}"
              >
                {#if game.hatsu.id === ability.id}
                  <div class="absolute left-0 top-0 h-full w-1 bg-fuchsia-400 shadow-[0_0_10px_#e879f9]"></div>
                {/if}
                <strong class="block text-sm font-bold text-white transition-colors group-hover:text-fuchsia-300">{ability.name}</strong>
                <span class="mt-1.5 block font-mono text-[10px] text-fuchsia-300/70 uppercase">{$t.infiltration.hatsuRoles[ability.role]}</span>
                <span class="mt-2 block leading-snug text-slate-400">{ability.rule}</span>
              </button>
            {/each}
          </div>
          
          {#if game.hatsu.id === 'texture-surprise'}
            <div class="mt-4 rounded-lg border border-fuchsia-900/50 bg-fuchsia-950/20 p-4">
              <h3 class="mb-3 text-[10px] font-bold uppercase tracking-wider text-fuchsia-400">Configure Hatsu</h3>
              <div class="flex flex-wrap gap-2">
                {#each forgerySurfaces as surface}
                  <button onclick={() => send({ type: 'CONFIGURE_HATSU', forgerySurface: surface })} aria-pressed={game.hatsu.forgerySurface === surface} class="rounded-md border border-slate-700 bg-slate-900 px-4 py-2 text-xs transition-all hover:border-fuchsia-500 hover:bg-slate-800 aria-pressed:border-fuchsia-400 aria-pressed:bg-fuchsia-900/40 aria-pressed:text-fuchsia-100">{$t.infiltration.hatsuInteractive.surfaces[surface]}</button>
                {/each}
              </div>
            </div>
          {:else if game.hatsu.id === 'illumi-needle-people'}
            <div class="mt-4 rounded-lg border border-fuchsia-900/50 bg-fuchsia-950/20 p-4">
              <h3 class="mb-3 text-[10px] font-bold uppercase tracking-wider text-fuchsia-400">Configure Hatsu</h3>
              <div class="flex flex-wrap gap-2">
                {#each disguiseIdentities as identity}
                  <button onclick={() => send({ type: 'CONFIGURE_HATSU', disguiseIdentity: identity })} aria-pressed={game.hatsu.disguiseIdentity === identity} class="rounded-md border border-slate-700 bg-slate-900 px-4 py-2 text-xs transition-all hover:border-fuchsia-500 hover:bg-slate-800 aria-pressed:border-fuchsia-400 aria-pressed:bg-fuchsia-900/40 aria-pressed:text-fuchsia-100">{$t.infiltration.hatsuInteractive.identities[identity]}</button>
                {/each}
              </div>
            </div>
          {/if}
          
          <div class="mt-10 flex justify-end">
            <button
              onclick={() => (briefing = false)}
              aria-keyshortcuts="Enter"
              class="group relative overflow-hidden rounded-lg bg-cyan-500 px-8 py-4 text-sm font-bold tracking-wide text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]"
            >
              <span class="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100"></span>
              {$t.infiltration.begin} →
            </button>
          </div>
        </div>
      </article>
    </div>
  {/if}

  {#if finished}
    <div class="absolute inset-0 overflow-y-auto bg-slate-950/95 p-6 backdrop-blur-md">
      <article class="mx-auto max-w-4xl py-10">
        <div class="relative overflow-hidden rounded-xl border border-slate-700 bg-[#0a0f16] shadow-2xl">
          <div class="border-b border-slate-800 bg-[#0a0f16]/95 px-10 py-8">
            <p class="flex items-center gap-3 text-xs font-bold uppercase tracking-[.3em] text-cyan-500">
              <span class="inline-block h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]"></span>
              {$t.infiltration.debrief}
              <span class="ml-auto font-mono text-[10px] text-slate-500">OPERATION ENDED</span>
            </p>
            <h1 class="mt-4 text-5xl font-black tracking-tight {game.outcome === 'escaped' ? 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]'}">
              {$t.infiltration.outcomes[game.outcome]}
            </h1>
            <div class="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400">
              <p class="flex items-center gap-2">
                <span class="text-xs uppercase tracking-wider text-slate-500">{$t.infiltration.score}</span>
                <strong class="text-lg text-white">{report.score}/100</strong>
              </p>
              <p class="flex items-center gap-2">
                <span class="text-xs uppercase tracking-wider text-slate-500">{$t.infiltration.traces}</span>
                <strong class="text-lg text-white">{report.traces.length}</strong>
              </p>
              <div class="h-4 w-px bg-slate-700"></div>
              <p class="font-mono text-xs">{game.mission.id} · {game.mission.variantId} · seed {game.mission.seed} · {game.alertLevel}</p>
            </div>
          </div>
          
          <div class="px-10 py-8">
            <div class="grid grid-cols-3 gap-4">
              <div class="rounded-lg border border-slate-800 bg-slate-900/50 p-5 transition-colors hover:border-cyan-900">
                <p class="text-[10px] font-bold uppercase tracking-[.15em] text-slate-500">{$t.infiltration.v3.objectiveAxis}</p>
                <p class="mt-2 text-xl font-semibold text-white">{verdict.material}</p>
              </div>
              <div class="rounded-lg border border-slate-800 bg-slate-900/50 p-5 transition-colors hover:border-cyan-900">
                <p class="text-[10px] font-bold uppercase tracking-[.15em] text-slate-500">{$t.infiltration.v3.informationAxis}</p>
                <p class="mt-2 text-xl font-semibold text-white">{verdict.information}</p>
              </div>
              <div class="rounded-lg border border-slate-800 bg-slate-900/50 p-5 transition-colors hover:border-cyan-900">
                <p class="text-[10px] font-bold uppercase tracking-[.15em] text-slate-500">{$t.infiltration.v3.coverAxis}</p>
                <p class="mt-2 text-xl font-semibold text-white">{verdict.cover}</p>
              </div>
            </div>
            
            {#if timeline.length > 0}
              <div class="mt-8 rounded-lg border border-slate-800 bg-black/40 p-5">
                <h3 class="mb-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Mission Timeline</h3>
                <ol class="max-h-48 space-y-2 overflow-y-auto pr-2 text-sm font-mono text-slate-400">
                  {#each timeline as event}
                    <li class="flex gap-4 border-b border-slate-800/50 pb-2 last:border-0 last:pb-0">
                      <span class="w-16 shrink-0 text-cyan-600">{event.at.toFixed(1)}s</span>
                      <span class="w-24 shrink-0 text-amber-500/70">{event.actor}</span>
                      <span class="text-slate-300">{event.detail}</span>
                    </li>
                  {/each}
                </ol>
              </div>
            {/if}
            
            <div class="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <p class="flex items-center gap-2">
                <span class="text-slate-500">{$t.infiltration.reports}:</span>
                <strong class="text-white">{report.reports.length}</strong>
              </p>
              <p class="flex items-center gap-2">
                <span class="text-slate-500">{$t.infiltration.discoveredTraces}:</span>
                <strong class="text-white">{report.discoveredTraces}</strong>
              </p>
              <p class="flex items-center gap-2">
                <span class="text-slate-500">{$t.infiltration.runStyle}:</span>
                <strong class="text-cyan-400">{$t.infiltration.styles[balance.style]}</strong>
              </p>
            </div>
            
            {#if report.witnesses.length > 0}
              <div class="mt-10">
                <h3 class="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">Witness Reports</h3>
                <div class="grid gap-4 sm:grid-cols-3">
                  {#each report.witnesses as witness (witness.id)}
                    <section class="relative overflow-hidden rounded-lg border border-slate-800 bg-slate-900/30 p-5">
                      <div class="absolute left-0 top-0 h-full w-1 {witness.belief.reported ? 'bg-red-500' : 'bg-slate-700'}"></div>
                      <h2 class="font-bold text-white">{$t.infiltration.witnesses[witness.id]}</h2>
                      <p class="mt-2 text-sm text-slate-400">
                        <span class="text-amber-400/80">{$t.infiltration.beliefs[witness.belief.identity]}</span> · {Math.round(witness.belief.certainty)}%
                      </p>
                      <p class="mt-3 inline-flex rounded bg-black/50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider {witness.belief.reported ? 'text-red-400' : 'text-slate-500'}">
                        {witness.belief.reported ? $t.infiltration.reported : $t.infiltration.unreported}
                      </p>
                    </section>
                  {/each}
                </div>
              </div>
            {/if}
            
            <div class="mt-10 flex items-center justify-between border-t border-slate-800 pt-8">
              <p class="text-sm text-slate-500">
                {$t.infiltration.truth}:
                <strong class="{game.authorConfirmed ? 'text-cyan-400' : 'text-amber-500/80'}">
                  {game.authorConfirmed ? $t.infiltration.confirmed : $t.infiltration.uncertain}
                </strong>
              </p>
              
              <button
                onclick={again}
                class="group relative overflow-hidden rounded-lg bg-slate-800 px-8 py-3 text-sm font-bold tracking-wide text-white transition-all hover:bg-slate-700 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              >
                <span class="absolute inset-0 bg-white/5 opacity-0 transition-opacity group-hover:opacity-100"></span>
                {$t.infiltration.again} ↻
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  {/if}
</div>

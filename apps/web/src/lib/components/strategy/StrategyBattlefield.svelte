<script lang="ts">
  import { onDestroy } from 'svelte'
  import PlanMap from '$lib/components/map/PlanMap.svelte'
  import TourScene from '$lib/components/tour/TourScene.svelte'
  import type { Apparition } from '$lib/tour/apparitions'
  import {
    floorOf,
    spaceForLocation,
    theShip,
    crossingsOn,
    type Crossing,
  } from '$lib/tour/blueprint'
  import { centroid } from '$lib/tour/hatsu'
  import { TourNavigationState } from '$lib/tour/pageNavigationState.svelte'
  import TourMinimapPanel from '$lib/components/tour/TourMinimapPanel.svelte'
  import { ModeNenState } from '$lib/nen/modeState.svelte'
  import { hatsuById } from '$lib/nen/hatsuRegistry'
  import { strategyHatsuPresentation, type StrategyHatsuCue } from '$lib/strategy/hatsuPresentation'
  import { locale } from '$lib/i18n'

  interface Marker {
    id: string
    label: string
    x: number
    y: number
    tier: string | null
    state: 'confirmed' | 'believed' | 'outdated'
    isObserver: boolean
    human: boolean
    locationId: string
    locationLabel: string | null
  }

  let { markers, hatsuCues = [] }: { markers: Marker[]; hatsuCues?: StrategyHatsuCue[] } = $props()
  const ship = theShip()
  const navigation = new TourNavigationState(ship, ship.tiers[0].id)
  const modeNen = new ModeNenState()
  let view = $state<'tour' | 'map'>('tour')
  let selectedTier = $state('tier-1')

  const nameOf = (entity: any) => {
    if (!entity) return ''
    return $locale === 'fr' && entity.nameFr ? entity.nameFr : entity.name
  }

  const tierId = $derived(navigation.tierId)
  const plan = $derived(ship.plans.get(tierId)!)
  const crossings = $derived(crossingsOn(ship, tierId))
  const decks = $derived(
    ship.decks.map((tier) => ({
      id: tier.id,
      label: nameOf(tier),
      active: tier.id === tierId,
    })),
  )
  let hatsuManifestations = $state<Apparition[]>([])
  let latestHatsuCue = $state<StrategyHatsuCue | null>(null)
  const manifestationTimers = new Set<number>()
  const presentedCueIds = new Set<number>()
  onDestroy(() => manifestationTimers.forEach((timer) => window.clearTimeout(timer)))
  let availableTiers = $derived(
    [
      ...new Set(markers.map((marker) => marker.tier).filter((id): id is string => Boolean(id))),
    ].sort(),
  )
  let units = $derived.by(() =>
    markers.flatMap((marker, index): Apparition[] => {
      const space = spaceForLocation(ship, marker.locationId)
      if (!space) return []
      const at = centroid(space)
      const angle = index * 2.399
      return [
        {
          id: `strategy-unit:${marker.id}`,
          kind: 'combatant',
          spaceId: space.id,
          tierId: space.tierId,
          at: [at[0] + Math.cos(angle) * 0.45, at[1] + Math.sin(angle) * 0.45],
          y: floorOf(
            space,
            ship.tiers.find((tier) => tier.id === space.tierId)!,
          ),
          size: 1,
          colour: marker.isObserver ? 0xd7b86a : 0x6b7d8c,
          stage: 0,
          hidden: false,
          human: {
            role: marker.isObserver ? 'guard' : 'fighter',
            pose: 'guard',
            aura: 'ten',
            identity: marker.id,
            alert: !marker.isObserver,
          },
        },
      ]
    }),
  )
  let extras = $derived([...units, ...hatsuManifestations])

  $effect(() => {
    for (const hatsuCue of hatsuCues) {
      if (presentedCueIds.has(hatsuCue.seq)) continue
      presentedCueIds.add(hatsuCue.seq)
      const presentation = strategyHatsuPresentation(hatsuCue.abilityId)
      const space = spaceForLocation(ship, hatsuCue.targetLocationId)
      if (!presentation || !space) continue
      latestHatsuCue = hatsuCue
      selectedTier = space.tierId
      navigation.selectTier(space.tierId)
      navigation.goToSpace(space)
      const at = centroid(space)
      const manifestation: Apparition = {
        id: `strategy-hatsu:${hatsuCue.seq}`,
        kind: presentation.kind,
        spaceId: space.id,
        tierId: space.tierId,
        at: [at[0], at[1]],
        y: floorOf(
          space,
          ship.tiers.find((tier) => tier.id === space.tierId)!,
        ),
        size: presentation.size,
        colour: presentation.colour,
        stage: 1,
        hidden: false,
      }
      hatsuManifestations = [...hatsuManifestations, manifestation].slice(-8)
      presentation.sound()
      const timer = window.setTimeout(() => {
        hatsuManifestations = hatsuManifestations.filter((item) => item.id !== manifestation.id)
        manifestationTimers.delete(timer)
      }, presentation.durationMs)
      manifestationTimers.add(timer)
    }
  })

  $effect(() => {
    const focus = markers.find((marker) => marker.isObserver) ?? markers[0]
    const space = spaceForLocation(ship, focus?.locationId ?? null)
    if (space && !navigation.currentSpace) {
      selectedTier = space.tierId
      navigation.goToSpace(space)
    }
  })

  function selectTier(id: string) {
    selectedTier = id
    navigation.selectTier(id)
  }
</script>

<div class="mb-4 flex flex-wrap gap-2 sm:justify-end" role="group" aria-label="Battlefield view">
  <button
    class="rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all {view ===
    'tour'
      ? 'border-sky-400 bg-sky-900/30 text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
      : 'border-sky-900/50 bg-[#060b14]/50 text-sky-500/50 hover:border-sky-700 hover:text-sky-400'}"
    type="button"
    onclick={() => (view = 'tour')}>Vue 3D</button
  >
  <button
    class="rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all {view ===
    'map'
      ? 'border-sky-400 bg-sky-900/30 text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
      : 'border-sky-900/50 bg-[#060b14]/50 text-sky-500/50 hover:border-sky-700 hover:text-sky-400'}"
    type="button"
    onclick={() => (view = 'map')}>Carte Tactique</button
  >
</div>

{#if latestHatsuCue}
  <div
    class="mb-4 flex items-center justify-between gap-4 rounded-lg border-l-4 border-amber-400 bg-amber-950/40 px-4 py-3 text-xs text-white shadow-[0_0_20px_rgba(251,191,36,0.15)]"
    role="status"
    aria-live="polite"
  >
    <strong class="font-black tracking-widest text-amber-300"
      >{hatsuById(latestHatsuCue.abilityId)?.name ?? latestHatsuCue.abilityId}</strong
    >
    <span class="text-amber-100/70">{latestHatsuCue.report}</span>
  </div>
{/if}

{#if view === 'tour'}
  <div class="tour-stage">
    <TourMinimapPanel
      {ship}
      {tierId}
      {plan}
      position={navigation.position}
      heading={navigation.heading}
      currentSpaceId={navigation.currentSpace?.id ?? null}
      {decks}
      {crossings}
      {nameOf}
      onSelectDeck={selectTier}
      onSelectPlan={(space) => navigation.goToSpace(space)}
    />
    <TourScene
      {ship}
      {extras}
      bind:tierId={navigation.tierId}
      bind:currentSpace={navigation.currentSpace}
      bind:availableLink={navigation.availableLink}
      bind:jumpTo={navigation.jumpTo}
      bind:jumpAt={navigation.jumpAt}
      bind:engaged={navigation.engaged}
      bind:touch={navigation.touch}
      bind:position={navigation.position}
      bind:heading={navigation.heading}
      bind:aimedAt={navigation.aimedAt}
      bind:aimedSolidAt={navigation.aimedSolidAt}
      nen={modeNen.value}
      onNenChange={modeNen.use}
      touchLabels={{ move: 'Movement', cast: 'Action' }}
      soundLabels={{ silence: 'Cut footsteps', restore: 'Restore footsteps' }}
      loadingLabel="Loading Black Whale..."
      unsupportedLabel="3D view requires WebGL. Use the tactical map."
    />
  </div>
{:else}
  <div class="mb-4 flex flex-wrap gap-2 sm:justify-end" aria-label="Display deck">
    {#each availableTiers as tier (tier)}
      <button
        class="rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all {selectedTier ===
        tier
          ? 'border-sky-400 bg-sky-900/30 text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
          : 'border-sky-900/50 bg-[#060b14]/50 text-sky-500/50 hover:border-sky-700 hover:text-sky-400'}"
        type="button"
        onclick={() => selectTier(tier)}>{tier.replace('tier-', 'Pont ')}</button
      >
    {/each}
  </div>
  <PlanMap
    {markers}
    tier={selectedTier}
    emptyLabel="Aucune donnée sur ce pont."
    elsewhereLabel={(count) => `${count} unité${count > 1 ? 's' : ''} sur d'autres ponts.`}
  />
{/if}

<style>
  .tour-stage {
    position: relative;
    min-height: 34rem;
    height: min(68vh, 52rem);
    overflow: hidden;
    border: 1px solid rgba(14, 165, 233, 0.3);
    border-radius: 0.75rem;
    background: #020617;
    box-shadow: inset 0 0 40px rgba(14, 165, 233, 0.05);
  }
  @media (max-width: 800px) {
    .tour-stage {
      min-height: 26rem;
      height: 56vh;
    }
  }
</style>

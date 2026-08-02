<script lang="ts">
  import { onDestroy } from 'svelte'
  import PlanMap from '$lib/components/map/PlanMap.svelte'
  import TourScene from '$lib/components/tour/TourScene.svelte'
  import type { Apparition } from '$lib/tour/apparitions'
  import { floorOf, spaceForLocation, theShip } from '$lib/tour/blueprint'
  import { centroid } from '$lib/tour/hatsu'
  import { TourNavigationState } from '$lib/tour/pageNavigationState.svelte'
  import { ModeNenState } from '$lib/nen/modeState.svelte'
  import { hatsuById } from '$lib/nen/hatsuRegistry'
  import {
    strategyHatsuPresentation,
    type StrategyHatsuCue,
  } from '$lib/strategy/hatsuPresentation'

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
        y: floorOf(space, ship.tiers.find((tier) => tier.id === space.tierId)!),
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
        y: floorOf(space, ship.tiers.find((tier) => tier.id === space.tierId)!),
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

<div class="battlefield-tabs" role="group" aria-label="Vue du champ de bataille">
  <button class:active={view === 'tour'} type="button" onclick={() => (view = 'tour')}
    >Vue 3D</button
  >
  <button class:active={view === 'map'} type="button" onclick={() => (view = 'map')}
    >Carte tactique</button
  >
</div>

{#if latestHatsuCue}
  <div class="hatsu-announcement" role="status" aria-live="polite">
    <strong>{hatsuById(latestHatsuCue.abilityId)?.name ?? latestHatsuCue.abilityId}</strong>
    <span>{latestHatsuCue.report}</span>
  </div>
{/if}

{#if view === 'tour'}
  <div class="tour-stage">
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
      touchLabels={{ move: 'Déplacement', cast: 'Action' }}
      soundLabels={{ silence: 'Couper les pas', restore: 'Rétablir les pas' }}
      loadingLabel="Chargement du Black Whale…"
      unsupportedLabel="La vue 3D nécessite WebGL. Utilisez la carte tactique."
    />
  </div>
{:else}
  <div class="tier-tabs" aria-label="Pont affiché">
    {#each availableTiers as tier (tier)}
      <button class:active={selectedTier === tier} type="button" onclick={() => selectTier(tier)}
        >{tier.replace('tier-', 'Pont ')}</button
      >
    {/each}
  </div>
  <PlanMap
    {markers}
    tier={selectedTier}
    emptyLabel="Aucun renseignement disponible sur ce pont."
    elsewhereLabel={(count) => `${count} unité${count > 1 ? 's' : ''} sur les autres ponts.`}
  />
{/if}

<style>
  .battlefield-tabs,
  .tier-tabs {
    display: flex;
    flex-wrap: wrap;
    justify-content: end;
    gap: 0.35rem;
    margin-bottom: 0.75rem;
  }
  button {
    border: 1px solid #31424e;
    border-radius: 999px;
    background: #0d171e;
    padding: 0.4rem 0.7rem;
    color: #8798a2;
    font-size: 0.68rem;
    cursor: pointer;
  }
  button.active {
    border-color: #d7b86a;
    color: #ead99f;
  }
  .tour-stage {
    position: relative;
    min-height: 34rem;
    height: min(68vh, 52rem);
    overflow: hidden;
    border: 1px solid #31424e;
    border-radius: 0.6rem;
    background: #050708;
  }
  .hatsu-announcement {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin: 0 0 0.75rem;
    border-left: 3px solid #d7b86a;
    padding: 0.6rem 0.8rem;
    background: rgb(8 12 18 / 86%);
    color: #fffff0;
    font-size: 0.76rem;
  }
  .hatsu-announcement span {
    color: rgb(255 255 240 / 65%);
  }
  @media (max-width: 800px) {
    .tour-stage {
      min-height: 26rem;
      height: 56vh;
    }
    .battlefield-tabs,
    .tier-tabs {
      justify-content: start;
    }
  }
</style>

<script lang="ts">
  import PlanMap from '$lib/components/map/PlanMap.svelte'
  import TourScene from '$lib/components/tour/TourScene.svelte'
  import type { Apparition } from '$lib/tour/apparitions'
  import { floorOf, spaceForLocation, theShip } from '$lib/tour/blueprint'
  import { centroid } from '$lib/tour/hatsu'
  import { TourNavigationState } from '$lib/tour/pageNavigationState.svelte'

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

  let { markers }: { markers: Marker[] } = $props()
  const ship = theShip()
  const navigation = new TourNavigationState(ship, ship.tiers[0].id)
  let view = $state<'tour' | 'map'>('tour')
  let selectedTier = $state('tier-1')
  let availableTiers = $derived(
    [
      ...new Set(markers.map((marker) => marker.tier).filter((id): id is string => Boolean(id))),
    ].sort(),
  )
  let extras = $derived.by(() =>
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

<script lang="ts">
  import { onMount } from 'svelte'
  import type { Location, Presence } from '@black-whale/domain'
  import type { WorldEntity, WorldState } from '@black-whale/world-engine'
  import type { PageData } from './$types'
  import './strategy.css'
  import PlanMap from '$lib/components/map/PlanMap.svelte'
  import { calculatePresencePosition } from '$lib/components/map/markerProjection'
  import {
    StrategyInputError,
    createSimulationStore,
    type StrategyMoveOrder,
  } from '$lib/strategy/simulation.svelte'

  let { data }: { data: PageData } = $props()
  const simStore = createSimulationStore()

  let ready = $state(false)
  let playerFactionId = $state<string | null>(null)
  let pendingOrders = $state<StrategyMoveOrder[]>([])
  let selectedCharacterId = $state('')
  let selectedLocationId = $state('')
  let selectedTier = $state('tier-1')
  let errorMessage = $state<string | null>(null)

  let playerFaction = $derived(data.factions.find((faction) => faction.id === playerFactionId))
  let locationById = $derived(new Map(data.locations.map((location) => [location.id, location])))

  function entityForCharacter(state: WorldState, characterId: string): WorldEntity | undefined {
    const direct = state.entities[characterId]
    if (direct && state.presences[direct.id]) return direct
    return (
      Object.values(state.entities).find(
        (entity) =>
          entity.kind === 'BODY' &&
          entity.originalCharacterId === characterId &&
          Boolean(state.presences[entity.id]),
      ) ?? direct
    )
  }

  let controlledEntities = $derived.by(() => {
    const state = simStore.currentState
    if (!state) return {} as Record<string, { factionId: string; characterName: string }>
    const result: Record<string, { factionId: string; characterName: string }> = {}
    for (const faction of data.factions) {
      for (const member of faction.members) {
        const entity = entityForCharacter(state, member.character.id)
        if (entity && !result[entity.id]) {
          result[entity.id] = {
            factionId: faction.id,
            characterName: member.character.canonicalName,
          }
        }
      }
    }
    return result
  })

  let mapPresences = $derived.by(() => {
    const state = simStore.currentState
    if (!state) return [] as Presence[]
    return Object.values(state.presences)
      .filter(
        (presence) =>
          Boolean(presence.locationId) && Boolean(controlledEntities[presence.entity.id]),
      )
      .map((presence): Presence => ({
        id: `strategy:${presence.entity.id}`,
        entityType: 'BODY',
        entityId: presence.entity.id,
        locationId: presence.locationId,
        fromEventId: presence.observedAtEventId ?? state.cursor.eventId,
        precision: presence.precision,
        certainty: presence.certainty,
      }))
  })

  let markers = $derived.by(() => {
    const locations = data.locations as Location[]
    return mapPresences.map((presence) => {
      const placement = calculatePresencePosition(presence, mapPresences, locations)
      const owner = controlledEntities[presence.entityId]
      return {
        id: presence.entityId,
        label:
          owner?.characterName ??
          simStore.currentState?.entities[presence.entityId]?.label ??
          presence.entityId,
        x: placement.x,
        y: placement.y,
        tier: placement.tierId,
        state:
          presence.certainty === 'CONFIRMED'
            ? ('confirmed' as const)
            : presence.certainty === 'PROBABLE'
              ? ('believed' as const)
              : ('outdated' as const),
        isObserver: owner?.factionId === playerFactionId,
        locationLabel: placement.loc?.name ?? null,
      }
    })
  })

  let availableTiers = $derived(
    [
      ...new Set(
        markers.map((marker) => marker.tier).filter((tier): tier is string => Boolean(tier)),
      ),
    ].sort(),
  )

  onMount(() => {
    if (data.baseState) {
      simStore.init(data.baseState, data.factions, data.locations)
      ready = true
    }
  })

  function selectFaction(id: string) {
    playerFactionId = id
    pendingOrders = []
    selectedCharacterId = ''
    selectedLocationId = ''
    errorMessage = null
  }

  function currentLocation(characterId: string): string {
    const state = simStore.currentState
    if (!state) return 'Position inconnue'
    const entity = entityForCharacter(state, characterId)
    const locationId = entity ? state.presences[entity.id]?.locationId : undefined
    return locationId ? (locationById.get(locationId)?.name ?? locationId) : 'Position inconnue'
  }

  function queueOrder() {
    if (!selectedCharacterId || !selectedLocationId) return
    pendingOrders = [
      ...pendingOrders.filter((order) => order.characterId !== selectedCharacterId),
      { characterId: selectedCharacterId, locationId: selectedLocationId },
    ]
    selectedCharacterId = ''
    selectedLocationId = ''
    errorMessage = null
  }

  function removeOrder(characterId: string) {
    pendingOrders = pendingOrders.filter((order) => order.characterId !== characterId)
  }

  function handleEndTurn() {
    if (!playerFactionId) return
    errorMessage = null
    try {
      simStore.endTurn(playerFactionId, pendingOrders)
      pendingOrders = []
    } catch (error) {
      errorMessage =
        error instanceof StrategyInputError
          ? error.message
          : 'Le tour a échoué. Aucun ordre n’a été appliqué.'
      console.error('[strategy] turn', error)
    }
  }

  function memberName(characterId: string): string {
    return (
      playerFaction?.members.find((member) => member.character.id === characterId)?.character
        .canonicalName ?? characterId
    )
  }
</script>

<svelte:head>
  <title>Mode stratégie · Black Whale</title>
  <meta
    name="description"
    content="Prenez le contrôle d’une faction et simulez ses déplacements sur le Black Whale."
  />
</svelte:head>

<main class="strategy-shell">
  {#if data.error}
    <section class="fatal" role="alert">
      <p>Mode stratégie indisponible</p>
      <h1>{data.error}</h1>
      <span>Réessayez après avoir vérifié la connexion à la base de données.</span>
    </section>
  {:else if !ready}
    <section class="fatal" aria-live="polite"><h1>Initialisation du scénario…</h1></section>
  {:else if !playerFactionId}
    <section class="faction-picker">
      <p class="eyebrow">Scénario · chapitre {data.cutoff?.chapterNumber}</p>
      <h1>Choisissez votre faction</h1>
      <p class="intro">
        Chaque unité reçoit au plus un déplacement par tour. Les autres factions réagissent ensuite
        automatiquement.
      </p>
      {#if data.factions.length}
        <div class="faction-grid">
          {#each data.factions as faction (faction.id)}
            <button type="button" onclick={() => selectFaction(faction.id)}>
              <strong>{faction.name}</strong>
              <span>{faction.members.length} unité{faction.members.length > 1 ? 's' : ''}</span>
            </button>
          {/each}
        </div>
      {:else}
        <p class="empty">Aucune faction active à ce point du récit.</p>
      {/if}
    </section>
  {:else}
    <div class="game-layout">
      <aside class="command-panel">
        <header>
          <button class="back" type="button" onclick={() => (playerFactionId = null)}
            >← Factions</button
          >
          <p>Vous commandez</p>
          <h1>{playerFaction?.name}</h1>
          <span>Tour {simStore.currentTurn}</span>
        </header>

        <div class="panel-scroll">
          <section>
            <div class="section-title">
              <h2>Nouvel ordre</h2>
              <span>{pendingOrders.length} en attente</span>
            </div>
            <label>
              Unité
              <select bind:value={selectedCharacterId}>
                <option value="">Choisir une unité</option>
                {#each playerFaction?.members ?? [] as member (member.character.id)}
                  <option value={member.character.id}
                    >{member.character.canonicalName} · {currentLocation(
                      member.character.id,
                    )}</option
                  >
                {/each}
              </select>
            </label>
            <label>
              Destination
              <select bind:value={selectedLocationId}>
                <option value="">Choisir une destination</option>
                {#each data.locations as location (location.id)}
                  <option value={location.id}>{location.name}</option>
                {/each}
              </select>
            </label>
            <button
              class="queue"
              type="button"
              disabled={!selectedCharacterId || !selectedLocationId}
              onclick={queueOrder}>Ajouter au plan</button
            >
          </section>

          <section>
            <div class="section-title"><h2>Plan du tour</h2></div>
            {#if pendingOrders.length}
              <ul class="orders">
                {#each pendingOrders as order (order.characterId)}
                  <li>
                    <div>
                      <strong>{memberName(order.characterId)}</strong><span
                        >→ {locationById.get(order.locationId)?.name ?? order.locationId}</span
                      >
                    </div>
                    <button
                      type="button"
                      aria-label={`Retirer l’ordre de ${memberName(order.characterId)}`}
                      onclick={() => removeOrder(order.characterId)}>×</button
                    >
                  </li>
                {/each}
              </ul>
            {:else}
              <p class="empty">Aucun ordre : terminer le tour revient à passer.</p>
            {/if}
          </section>

          <section>
            <div class="section-title"><h2>Journal</h2></div>
            <div class="reports" aria-live="polite">
              {#each simStore.turnReports as report, index (`${index}:${report}`)}<p>
                  {report}
                </p>{/each}
            </div>
          </section>
        </div>

        <footer>
          {#if errorMessage}<p class="error" role="alert">{errorMessage}</p>{/if}
          <button class="end-turn" type="button" onclick={handleEndTurn}
            >Terminer le tour {simStore.currentTurn}</button
          >
        </footer>
      </aside>

      <section class="map-panel">
        <div class="map-heading">
          <div>
            <p>Situation tactique</p>
            <h2>Black Whale</h2>
          </div>
          <div class="tier-tabs" aria-label="Pont affiché">
            {#each availableTiers as tier (tier)}
              <button
                class:active={selectedTier === tier}
                type="button"
                onclick={() => (selectedTier = tier)}>{tier.replace('tier-', 'Pont ')}</button
              >
            {/each}
          </div>
        </div>
        <PlanMap
          {markers}
          tier={selectedTier}
          emptyLabel="Aucune unité localisée dans ce scénario."
          elsewhereLabel={(count) => `${count} unité${count > 1 ? 's' : ''} sur les autres ponts.`}
        />
        <p class="legend">
          <i></i> Votre faction <i class="other"></i> Autres factions · les positions se mettent à jour
          à la fin du tour.
        </p>
      </section>
    </div>
  {/if}
</main>

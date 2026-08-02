<script lang="ts">
  import { onMount } from 'svelte'
  import type { Location, Presence } from '@black-whale/domain'
  import type { WorldEntity, WorldState } from '@black-whale/world-engine'
  import type { PageData } from './$types'
  import './strategy.css'
  import PlanMap from '$lib/components/map/PlanMap.svelte'
  import StrategyDiplomacyPanel from '$lib/components/strategy/StrategyDiplomacyPanel.svelte'
  import { calculatePresencePosition } from '$lib/components/map/markerProjection'
  import { hatsuById } from '$lib/nen/hatsuRegistry'
  import { SCENARIO_MAX_TURNS } from '$lib/strategy/scenario'
  import { diplomacyCost, type DiplomacyAction, type DiplomacyOrder } from '$lib/strategy/diplomacy'
  import {
    StrategyInputError,
    createSimulationStore,
    type StrategyMoveOrder,
    type StrategyOrderType,
  } from '$lib/strategy/simulation.svelte'
  import {
    COMMAND_POINTS_PER_TURN,
    HATSU_ROLE_LABELS,
    ORDER_LABELS,
    VICTORY_POINTS_TARGET,
    doctrineForFaction,
    planCost,
    strategicRoleForHatsu,
  } from '$lib/strategy/rules'

  let { data }: { data: PageData } = $props()
  const simStore = createSimulationStore()

  let ready = $state(false)
  let playerFactionId = $state<string | null>(null)
  let pendingOrders = $state<StrategyMoveOrder[]>([])
  let selectedCharacterId = $state('')
  let selectedLocationId = $state('')
  let selectedOrderType = $state<StrategyOrderType>('MOVE')
  let selectedAbilityId = $state('')
  let pendingDiplomacy = $state<DiplomacyOrder[]>([])
  let selectedDiplomacyFactionId = $state('')
  let selectedDiplomacyAction = $state<DiplomacyAction>('SHARE_INTEL')
  let selectedTier = $state('tier-1')
  let errorMessage = $state<string | null>(null)

  let playerFaction = $derived(data.factions.find((faction) => faction.id === playerFactionId))
  let locationById = $derived(new Map(data.locations.map((location) => [location.id, location])))
  let spentCommandPoints = $derived(planCost(pendingOrders) + diplomacyCost(pendingDiplomacy))
  let remainingCommandPoints = $derived(COMMAND_POINTS_PER_TURN - spentCommandPoints)
  let availableHatsu = $derived.by(() =>
    selectedCharacterId
      ? simStore.abilityIdsForCharacter(selectedCharacterId).flatMap((abilityId) => {
          const profile = hatsuById(abilityId)
          return profile ? [profile] : []
        })
      : [],
  )
  let selectedHatsu = $derived(hatsuById(selectedAbilityId))
  let playableLocations = $derived(
    simStore.scenarioLocations.length ? simStore.scenarioLocations : data.locations,
  )

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
    return Object.values(simStore.intel)
      .filter((sighting) => Boolean(controlledEntities[sighting.entityId]))
      .map((sighting): Presence => ({
        id: `strategy:${sighting.entityId}`,
        entityType: 'BODY',
        entityId: sighting.entityId,
        locationId: sighting.locationId,
        fromEventId: state.cursor.eventId,
        precision: state.presences[sighting.entityId]?.precision ?? 'UNKNOWN',
        certainty: sighting.certainty,
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

  let objective = $derived(simStore.objective)

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
    selectedAbilityId = ''
    pendingDiplomacy = []
    errorMessage = null
    simStore.selectFaction(id)
  }

  function currentLocation(characterId: string): string {
    const state = simStore.currentState
    if (!state) return 'Position inconnue'
    const entity = entityForCharacter(state, characterId)
    const locationId = entity ? state.presences[entity.id]?.locationId : undefined
    return locationId ? (locationById.get(locationId)?.name ?? locationId) : 'Position inconnue'
  }

  function queueOrder() {
    if (!selectedCharacterId) return
    if (selectedOrderType === 'HATSU' && !selectedAbilityId) return
    const destination =
      selectedOrderType === 'GUARD' ? currentLocationId(selectedCharacterId) : selectedLocationId
    if (!destination) return
    const nextOrder = {
      characterId: selectedCharacterId,
      locationId: destination,
      type: selectedOrderType,
      ...(selectedOrderType === 'HATSU' ? { abilityId: selectedAbilityId } : {}),
    }
    const nextOrders = [
      ...pendingOrders.filter((order) => order.characterId !== selectedCharacterId),
      nextOrder,
    ]
    if (planCost(nextOrders) > COMMAND_POINTS_PER_TURN) {
      errorMessage = 'Ce plan dépasse vos points de commandement.'
      return
    }
    pendingOrders = nextOrders
    selectedCharacterId = ''
    selectedLocationId = ''
    selectedAbilityId = ''
    errorMessage = null
  }

  function currentLocationId(characterId: string): string {
    const state = simStore.currentState
    if (!state) return ''
    const entity = entityForCharacter(state, characterId)
    return entity ? (state.presences[entity.id]?.locationId ?? '') : ''
  }

  function removeOrder(characterId: string) {
    pendingOrders = pendingOrders.filter((order) => order.characterId !== characterId)
  }

  function queueDiplomacy() {
    if (!selectedDiplomacyFactionId) return
    const next = [
      ...pendingDiplomacy.filter((order) => order.factionId !== selectedDiplomacyFactionId),
      { factionId: selectedDiplomacyFactionId, action: selectedDiplomacyAction },
    ]
    if (planCost(pendingOrders) + diplomacyCost(next) > COMMAND_POINTS_PER_TURN) {
      errorMessage = 'Cette action diplomatique dépasse vos points de commandement.'
      return
    }
    pendingDiplomacy = next
    selectedDiplomacyFactionId = ''
    errorMessage = null
  }

  function handleEndTurn() {
    if (!playerFactionId) return
    errorMessage = null
    try {
      simStore.endTurn(playerFactionId, pendingOrders, pendingDiplomacy)
      pendingOrders = []
      pendingDiplomacy = []
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
              <span
                >{faction.members.length} unité{faction.members.length > 1 ? 's' : ''} ·
                {doctrineForFaction(faction.id).toLocaleLowerCase('fr')}</span
              >
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
          <span
            >Tour {Math.min(simStore.currentTurn, SCENARIO_MAX_TURNS)} / {SCENARIO_MAX_TURNS}</span
          >
        </header>

        <div class="panel-scroll">
          {#if simStore.scenarioEvent}
            <section class="scenario-event">
              <span>Événement prévu</span>
              <strong>{simStore.scenarioEvent.title}</strong>
              <p>{simStore.scenarioEvent.description}</p>
            </section>
          {/if}
          <section>
            <div class="objective-card" class:complete={objective?.complete}>
              <span>Objectif</span>
              <strong>{objective?.title ?? 'Objectif indisponible'}</strong>
              <p>{objective?.description ?? 'La situation tactique est en cours d’analyse.'}</p>
              <div>
                <i
                  style={`width:${objective ? Math.min(100, (objective.current / objective.target) * 100) : 0}%`}
                ></i>
              </div>
              <small
                >{objective?.current ?? 0} / {objective?.target ?? 0}
                {objective?.complete ? '· objectif atteint' : ''}</small
              >
              <small class="victory-score" class:won={simStore.gameWon}
                >Influence {simStore.victoryPoints} / {VICTORY_POINTS_TARGET}</small
              >
            </div>
          </section>

          <section>
            <div class="section-title">
              <h2>Nouvel ordre</h2>
              <span>{remainingCommandPoints} / {COMMAND_POINTS_PER_TURN} PC</span>
            </div>
            <label>
              Action
              <select bind:value={selectedOrderType}>
                <option value="MOVE">Se déplacer · 1 PC</option>
                <option value="SCOUT">Enquêter · 2 PC</option>
                <option value="GUARD">Protéger sur place · 1 PC</option>
                <option value="HATSU">Activer un Hatsu · 3 PC</option>
              </select>
            </label>
            {#if selectedOrderType === 'HATSU'}
              <label>
                Hatsu
                <select bind:value={selectedAbilityId}>
                  <option value="">Choisir une capacité</option>
                  {#each availableHatsu as profile (profile.id)}
                    <option
                      value={profile.id}
                      disabled={(simStore.hatsuCooldowns[profile.id] ?? 0) > simStore.currentTurn}
                      >{profile.name}{(simStore.hatsuCooldowns[profile.id] ?? 0) >
                      simStore.currentTurn
                        ? ` · disponible tour ${simStore.hatsuCooldowns[profile.id]}`
                        : ''}</option
                    >
                  {/each}
                </select>
                {#if selectedCharacterId && !availableHatsu.length}
                  <small class="field-hint">Aucun Hatsu tactique connu pour cette unité.</small>
                {:else if selectedHatsu}
                  <small class="field-hint"
                    >{HATSU_ROLE_LABELS[strategicRoleForHatsu(selectedHatsu.kind)]}</small
                  >
                {/if}
              </label>
            {/if}
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
            {#if selectedOrderType !== 'GUARD'}
              <label>
                {selectedOrderType === 'SCOUT'
                  ? 'Zone à enquêter'
                  : selectedOrderType === 'HATSU'
                    ? 'Zone ciblée'
                    : 'Destination'}
                <select bind:value={selectedLocationId}>
                  <option value="">Choisir une destination</option>
                  {#each playableLocations as location (location.id)}
                    <option value={location.id}>{location.name}</option>
                  {/each}
                </select>
              </label>
            {/if}
            <button
              class="queue"
              type="button"
              disabled={!selectedCharacterId ||
                (selectedOrderType !== 'GUARD' && !selectedLocationId) ||
                (selectedOrderType === 'HATSU' && !selectedAbilityId)}
              onclick={queueOrder}>Ajouter au plan</button
            >
          </section>

          <StrategyDiplomacyPanel
            factions={simStore.activeFactions.filter((faction) => faction.id !== playerFactionId)}
            relationships={simStore.relationships}
            pending={pendingDiplomacy}
            bind:selectedFactionId={selectedDiplomacyFactionId}
            bind:selectedAction={selectedDiplomacyAction}
            onqueue={queueDiplomacy}
          />

          <section>
            <div class="section-title"><h2>Plan du tour</h2></div>
            {#if pendingOrders.length}
              <ul class="orders">
                {#each pendingOrders as order (order.characterId)}
                  <li>
                    <div>
                      <strong>{memberName(order.characterId)}</strong><span
                        >{order.type === 'HATSU'
                          ? (hatsuById(order.abilityId)?.name ?? ORDER_LABELS[order.type])
                          : ORDER_LABELS[order.type]} · {locationById.get(order.locationId)?.name ??
                          order.locationId}</span
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
          <button
            class="end-turn"
            type="button"
            disabled={simStore.gameOver}
            onclick={handleEndTurn}
            >{simStore.gameWon
              ? 'Victoire stratégique'
              : simStore.gameLost
                ? 'Scénario terminé'
                : `Résoudre le tour · ${spentCommandPoints} PC`}</button
          >
        </footer>
      </aside>

      <section class="map-panel">
        <div class="map-heading">
          <div>
            <p>Situation tactique · renseignement limité</p>
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
          emptyLabel="Aucun renseignement disponible sur ce pont."
          elsewhereLabel={(count) => `${count} unité${count > 1 ? 's' : ''} sur les autres ponts.`}
        />
        <p class="legend">
          <i></i> Votre faction <i class="other"></i> Contact observé · les pointillés indiquent un renseignement
          ancien.
        </p>
      </section>
    </div>
  {/if}
</main>

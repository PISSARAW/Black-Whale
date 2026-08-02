<script lang="ts">
  import { onMount } from 'svelte'
  import type { Location, Presence } from '@black-whale/domain'
  import type { WorldEntity, WorldState } from '@black-whale/world-engine'
  import type { PageData } from './$types'
  import './strategy.css'
  import StrategyBattlefield from '$lib/components/strategy/StrategyBattlefield.svelte'
  import TourModeFullscreen from '$lib/components/tour/TourModeFullscreen.svelte'
  import StrategyDiplomacyPanel from '$lib/components/strategy/StrategyDiplomacyPanel.svelte'
  import StrategyDebrief from '$lib/components/strategy/StrategyDebrief.svelte'
  import StrategyFactionPicker from '$lib/components/strategy/StrategyFactionPicker.svelte'
  import { calculatePresencePosition } from '$lib/components/map/markerProjection'
  import { hatsuById } from '$lib/nen/hatsuRegistry'
  import { isPlayableScenarioFaction } from '$lib/strategy/scenario'
  import { completeCampaignScenario, createStrategyCampaign, currentCampaignScenario } from '$lib/strategy/campaign/engine'
  import {
    STRATEGY_CAMPAIGN_KEY,
    createCampaignSave,
    decodeCampaignSave,
    encodeCampaignSave,
    migrateStrategySaveV2,
    type StrategyCampaignSaveV3,
  } from '$lib/strategy/campaign/persistence'
  import {
    STRATEGY_SAVE_KEY, LEGACY_STRATEGY_SAVE_KEY,
    createStrategySave,
    decodeStrategySave,
    encodeStrategySave,
    type StrategySave,
  } from '$lib/strategy/persistence'
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
  let errorMessage = $state<string | null>(null)
  let availableSave = $state<StrategySave | null>(null)
  let campaignSave = $state<StrategyCampaignSaveV3 | null>(null)
  let playerFaction = $derived(data.factions.find((faction) => faction.id === playerFactionId))
  let playableFactions = $derived(
    data.factions.filter((faction) =>
      data.scenario ? isPlayableScenarioFaction(faction.id, data.scenario) : false,
    ),
  )
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
      .filter(
        (sighting) =>
          Boolean(controlledEntities[sighting.entityId]) &&
          simStore.unitConditions[sighting.entityId] !== 'ELIMINATED',
      )
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
        human: true,
        locationId: presence.locationId,
        locationLabel: placement.loc?.name ?? null,
      }
    })
  })

  let objective = $derived(simStore.objective)
  onMount(() => {
    if (data.baseState) {
      simStore.init(data.baseState, data.factions, data.locations, data.scenario ?? undefined)
      ready = true
      const saved = decodeStrategySave(localStorage.getItem(STRATEGY_SAVE_KEY) ?? localStorage.getItem(LEGACY_STRATEGY_SAVE_KEY))
      campaignSave = decodeCampaignSave(localStorage.getItem(STRATEGY_CAMPAIGN_KEY))
      if (!campaignSave) {
        campaignSave = saved
          ? migrateStrategySaveV2(saved)
          : createCampaignSave(
              createStrategyCampaign(`${data.cutoff?.eventId ?? 'strategy'}:campaign`),
              new Date().toISOString(),
            )
        localStorage.setItem(STRATEGY_CAMPAIGN_KEY, encodeCampaignSave(campaignSave))
      }
      if (
        saved &&
        saved.baseEventId === data.cutoff?.eventId &&
        saved.scenarioId === data.scenario?.id
      )
        availableSave = saved
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
    if (campaignSave)
      simStore.restoreCampaignState(
        campaignSave.campaign.relationships,
        campaignSave.campaign.unitConditions,
      )
  }

  function resumeScenario() {
    if (!availableSave) return
    selectFaction(availableSave.selectedFactionId)
    for (const turn of availableSave.turns) {
      if (simStore.gameOver) break
      simStore.endTurn(availableSave.selectedFactionId, turn.orders, turn.diplomacy)
    }
  }

  function restartScenario() {
    if (!data.baseState || !playerFactionId) return
    const factionId = playerFactionId
    localStorage.removeItem(STRATEGY_SAVE_KEY)
    availableSave = null
    simStore.init(data.baseState, data.factions, data.locations, data.scenario ?? undefined)
    selectFaction(factionId)
  }

  function continueCampaign() {
    if (!campaignSave || !data.scenario || !playerFactionId) return
    if (currentCampaignScenario(campaignSave.campaign)?.id !== data.scenario.id) return
    const campaign = completeCampaignScenario(campaignSave.campaign, {
      scenarioId: data.scenario.id,
      selectedFactionId: playerFactionId,
      won: simStore.gameWon,
      turnsPlayed: Math.min(simStore.currentTurn - 1, data.scenario.maxTurns),
      victoryPoints: simStore.victoryPoints,
      relationships: structuredClone(simStore.relationships),
      unitConditions: structuredClone(simStore.unitConditions),
    })
    campaignSave = createCampaignSave(campaign, new Date().toISOString())
    localStorage.setItem(STRATEGY_CAMPAIGN_KEY, encodeCampaignSave(campaignSave))
    const next = currentCampaignScenario(campaign)
    if (next) window.location.assign(`/strategy?scenario=${next.id}`)
  }

  function currentLocation(characterId: string): string {
    const state = simStore.currentState
    if (!state) return 'Position inconnue'
    const entity = entityForCharacter(state, characterId)
    const locationId = entity ? state.presences[entity.id]?.locationId : undefined
    return locationId ? (locationById.get(locationId)?.name ?? locationId) : 'Position inconnue'
  }

  function conditionForCharacter(characterId: string): string {
    const state = simStore.currentState
    const entity = state ? entityForCharacter(state, characterId) : undefined
    const condition = entity ? simStore.unitConditions[entity.id] : undefined
    return condition === 'WOUNDED' ? 'Blessé' : condition === 'ELIMINATED' ? 'Éliminé' : 'Opérationnel'
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

  function removeOrder(characterId: string) { pendingOrders = pendingOrders.filter((order) => order.characterId !== characterId) }

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
      localStorage.setItem(
        STRATEGY_SAVE_KEY,
        encodeStrategySave(createStrategySave({
          savedAt: new Date().toISOString(),
          seed: `${data.cutoff?.eventId ?? 'unknown'}:${playerFactionId}`,
          baseEventId: data.cutoff?.eventId ?? '',
          selectedFactionId: playerFactionId,
          turns: structuredClone(simStore.turnHistory).map((turn, index) => ({ ...turn, turn: index + 1 })),
        }, data.scenario ?? undefined)),
      )
    } catch (error) {
      errorMessage =
        error instanceof StrategyInputError
          ? error.message
          : 'Le tour a échoué. Aucun ordre n’a été appliqué.'
      console.error('[strategy] turn', error)
    }
  }

  function memberName(characterId: string): string { return playerFaction?.members.find((member) => member.character.id === characterId)?.character.canonicalName ?? characterId }
</script>
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
    <nav class="campaign-operations" aria-label="Opérations de la campagne V3">
      {#each data.scenarios as operation, index (operation.id)}
        <a
          href={`/strategy?scenario=${operation.id}`}
          aria-current={data.scenario?.id === operation.id ? 'page' : undefined}
        >
          <span>Opération {index + 1} · chapitre {operation.chapterNumber}</span>
          <strong>{operation.title}</strong>
          <small>{operation.description}</small>
        </a>
      {/each}
    </nav>
    <StrategyFactionPicker
      chapterNumber={data.cutoff?.chapterNumber}
      factions={playableFactions}
      saved={availableSave}
      onselect={selectFaction}
      onresume={resumeScenario}
    />
  {:else}
    <div class="game-layout">
      <TourModeFullscreen />
      <aside class="command-panel">
        <header>
          <button class="back" type="button" onclick={() => (playerFactionId = null)}
            >← Factions</button
          >
          <p>Vous commandez</p>
          <h1>{playerFaction?.name}</h1>
          <span
            >Tour {Math.min(simStore.currentTurn, data.scenario?.maxTurns ?? 8)} / {data.scenario?.maxTurns ?? 8}</span
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
                  <option
                    value={member.character.id}
                    disabled={conditionForCharacter(member.character.id) === 'Éliminé'}
                    >{member.character.canonicalName} · {conditionForCharacter(member.character.id)} ·
                    {currentLocation(member.character.id)}</option
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
        {#if simStore.gameOver}
          <StrategyDebrief
            won={simStore.gameWon}
            turn={Math.min(simStore.currentTurn - 1, data.scenario?.maxTurns ?? 8)}
            victoryPoints={simStore.victoryPoints}
            reports={simStore.turnReports}
            onrestart={restartScenario}
            oncontinue={
              campaignSave && currentCampaignScenario(campaignSave.campaign)?.id === data.scenario?.id
                ? continueCampaign
                : undefined
            }
          />
        {/if}
        <div class="map-heading">
          <div>
            <p>Situation tactique · renseignement limité</p>
            <h2>Black Whale</h2>
          </div>
        </div>
        <StrategyBattlefield {markers} />
        <p class="legend">
          <i></i> Votre faction <i class="other"></i> Contact observé · les pointillés indiquent un renseignement
          ancien.
        </p>
      </section>
    </div>
  {/if}
</main>

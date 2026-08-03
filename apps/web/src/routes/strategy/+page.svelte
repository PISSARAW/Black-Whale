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
        locationId: presence.locationId ?? '',
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
    if (!state) return 'Unknown position'
    const entity = entityForCharacter(state, characterId)
    const locationId = entity ? state.presences[entity.id]?.locationId : undefined
    return locationId ? (locationById.get(locationId)?.name ?? locationId) : 'Unknown position'
  }

  function conditionForCharacter(characterId: string): string {
    const state = simStore.currentState
    const entity = state ? entityForCharacter(state, characterId) : undefined
    const condition = entity ? simStore.unitConditions[entity.id] : undefined
    return condition === 'WOUNDED' ? 'Wounded' : condition === 'ELIMINATED' ? 'Eliminated' : 'Operational'
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
      errorMessage = 'This plan exceeds your command points.'
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
      errorMessage = 'This diplomatic action exceeds your command points.'
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
          : 'The turn failed. No orders were applied.'
      console.error('[strategy] turn', error)
    }
  }

  function memberName(characterId: string): string { return playerFaction?.members.find((member) => member.character.id === characterId)?.character.canonicalName ?? characterId }
</script>
<main class="strategy-shell min-h-[calc(100vh-4rem)] bg-[#020617] text-sky-50 font-sans">
  {#if data.error}
    <section class="mx-auto flex max-w-2xl flex-col items-center justify-center pt-24 text-center" role="alert">
      <p class="mb-4 text-[10px] font-bold uppercase tracking-widest text-red-500">Accès Refusé</p>
      <h1 class="mb-4 font-black text-4xl text-white">{data.error}</h1>
      <span class="text-sm text-red-200/60">Veuillez vérifier la connexion aux serveurs tactiques.</span>
    </section>
  {:else if !ready}
    <section class="mx-auto flex max-w-2xl flex-col items-center justify-center pt-24 text-center" aria-live="polite">
      <div class="mb-4 flex items-center gap-3 rounded-full border border-sky-500/30 bg-sky-950/40 px-5 py-2 shadow-[0_0_15px_rgba(14,165,233,0.2)]">
        <span class="h-2 w-2 animate-pulse rounded-full bg-sky-400"></span>
        <h1 class="text-[10px] font-bold uppercase tracking-widest text-sky-400">Initialisation du Réseau Tactique...</h1>
      </div>
    </section>
  {:else if !playerFactionId}
    <nav class="mx-auto mt-8 grid w-full max-w-5xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Campaign Operations">
      {#each data.scenarios as operation, index (operation.id)}
        <a
          href={`/strategy?scenario=${operation.id}`}
          aria-current={data.scenario?.id === operation.id ? 'page' : undefined}
          class="group flex flex-col gap-2 rounded-xl border border-sky-900/40 bg-[#0a0f1c]/80 p-5 transition-all hover:-translate-y-1 hover:border-sky-400 hover:bg-sky-900/30 hover:shadow-[0_0_20px_rgba(56,189,248,0.2)] aria-[current=page]:border-amber-500/60 aria-[current=page]:bg-amber-950/20 aria-[current=page]:shadow-[0_0_15px_rgba(251,191,36,0.15)]"
        >
          <span class="text-[9px] font-bold uppercase tracking-widest text-sky-500/60 group-aria-[current=page]:text-amber-500/80">Opération {index + 1} · Chapitre {operation.chapterNumber}</span>
          <strong class="font-black text-lg text-white group-aria-[current=page]:text-amber-300">{operation.title}</strong>
          <small class="text-xs leading-relaxed text-sky-200/50 group-aria-[current=page]:text-amber-100/70">{operation.description}</small>
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
    <div class="grid min-h-[calc(100vh-4rem)] grid-cols-1 md:grid-cols-[minmax(22rem,28rem)_minmax(0,1fr)]">
      <TourModeFullscreen />
      <aside class="flex flex-col border-r border-sky-900/40 bg-[#0a0f1c]/95 backdrop-blur-md">
        <header class="border-b border-sky-900/50 bg-[#060b14]/50 p-6">
          <button class="mb-4 text-[10px] font-bold uppercase tracking-widest text-sky-500/50 transition-colors hover:text-sky-300" type="button" onclick={() => (playerFactionId = null)}
            >← Factions</button
          >
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-400">RÉSEAU TACTIQUE</p>
          <h1 class="mt-1 font-black text-3xl text-white drop-shadow-md">{playerFaction?.name}</h1>
          <span class="mt-2 block text-[10px] font-bold uppercase tracking-widest text-sky-200/50"
            >Tour {Math.min(simStore.currentTurn, data.scenario?.maxTurns ?? 8)} / {data.scenario?.maxTurns ?? 8}</span
          >
        </header>

        <div class="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-sky-900/50">
          {#if simStore.scenarioEvent}
            <section class="mb-6 rounded-lg border-l-2 border-amber-400 bg-amber-950/20 p-4 shadow-[0_0_15px_rgba(251,191,36,0.1)]">
              <span class="text-[9px] font-bold uppercase tracking-widest text-amber-500">Événement Planifié</span>
              <strong class="mt-1 block font-black text-sm text-amber-200">{simStore.scenarioEvent.title}</strong>
              <p class="mt-2 text-xs leading-relaxed text-amber-100/70">{simStore.scenarioEvent.description}</p>
            </section>
          {/if}
          <section class="mb-8">
            <div class="rounded-xl border border-sky-900/40 bg-gradient-to-br from-[#101827] to-[#0a0f1c] p-5 shadow-[0_0_20px_rgba(14,165,233,0.1)] {objective?.complete ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(52,211,153,0.15)]' : ''}">
              <span class="text-[9px] font-bold uppercase tracking-widest text-sky-500/60">OBJECTIF ACTUEL</span>
              <strong class="mt-1 block font-black text-sm text-sky-100">{objective?.title ?? 'Objectif indisponible'}</strong>
              <p class="mt-2 text-xs leading-relaxed text-sky-200/50">{objective?.description ?? 'Analyse de la situation tactique en cours.'}</p>
              <div class="mt-4 h-1 w-full overflow-hidden rounded-full bg-sky-950/50">
                <i
                  class="block h-full bg-sky-400 transition-all duration-500"
                  style={`width:${objective ? Math.min(100, (objective.current / objective.target) * 100) : 0}%`}
                ></i>
              </div>
              <div class="mt-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-sky-200/50">
                <span>{objective?.current ?? 0} / {objective?.target ?? 0}
                {objective?.complete ? '· accompli' : ''}</span>
                <span class="text-sky-400 {simStore.gameWon ? 'text-emerald-400' : ''}"
                  >INFLUENCE {simStore.victoryPoints} / {VICTORY_POINTS_TARGET}</span>
              </div>
            </div>
          </section>

          <section class="mb-8 border-t border-sky-900/30 pt-6">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-xs font-black uppercase tracking-widest text-white">Nouvel Ordre</h2>
              <span class="rounded bg-sky-900/40 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-sky-300">{remainingCommandPoints} / {COMMAND_POINTS_PER_TURN} PC</span>
            </div>
            
            <label class="mt-4 block">
              <span class="mb-1 block text-[10px] font-bold uppercase tracking-widest text-sky-500/60">Action</span>
              <select bind:value={selectedOrderType} class="w-full rounded-lg border border-sky-900/50 bg-[#060b14] p-3 text-xs text-sky-50 outline-none transition-colors focus:border-sky-400 focus:ring-1 focus:ring-sky-400">
                <option value="MOVE">Déplacement · 1 PC</option>
                <option value="SCOUT">Investigation · 2 PC</option>
                <option value="GUARD">Garde sur place · 1 PC</option>
                <option value="HATSU">Activer Hatsu · 3 PC</option>
              </select>
            </label>
            {#if selectedOrderType === 'HATSU'}
              <label class="mt-4 block">
                <span class="mb-1 block text-[10px] font-bold uppercase tracking-widest text-sky-500/60">Hatsu</span>
                <select bind:value={selectedAbilityId} class="w-full rounded-lg border border-sky-900/50 bg-[#060b14] p-3 text-xs text-sky-50 outline-none transition-colors focus:border-sky-400 focus:ring-1 focus:ring-sky-400">
                  <option value="">Sélectionner une capacité</option>
                  {#each availableHatsu as profile (profile.id)}
                    <option
                      value={profile.id}
                      disabled={(simStore.hatsuCooldowns[profile.id] ?? 0) > simStore.currentTurn}
                      >{profile.name}{(simStore.hatsuCooldowns[profile.id] ?? 0) >
                      simStore.currentTurn
                        ? ` · dispo tour ${simStore.hatsuCooldowns[profile.id]}`
                        : ''}</option
                    >
                  {/each}
                </select>
                {#if selectedCharacterId && !availableHatsu.length}
                  <span class="mt-1 block text-[10px] text-red-400/80">Aucun Hatsu tactique connu pour cette unité.</span>
                {:else if selectedHatsu}
                  <span class="mt-1 block text-[10px] font-bold uppercase tracking-widest text-sky-400/80"
                    >{HATSU_ROLE_LABELS[strategicRoleForHatsu(selectedHatsu.kind)]}</span>
                {/if}
              </label>
            {/if}
            <label class="mt-4 block">
              <span class="mb-1 block text-[10px] font-bold uppercase tracking-widest text-sky-500/60">Unité</span>
              <select bind:value={selectedCharacterId} class="w-full rounded-lg border border-sky-900/50 bg-[#060b14] p-3 text-xs text-sky-50 outline-none transition-colors focus:border-sky-400 focus:ring-1 focus:ring-sky-400">
                <option value="">Sélectionner une unité</option>
                {#each playerFaction?.members ?? [] as member (member.character.id)}
                  <option
                    value={member.character.id}
                    disabled={conditionForCharacter(member.character.id) === 'Eliminated'}
                    >{member.character.canonicalName} · {conditionForCharacter(member.character.id)} ·

                    {currentLocation(member.character.id)}</option
                  >
                {/each}
              </select>
            </label>
            {#if selectedOrderType !== 'GUARD'}
              <label class="mt-4 block">
                <span class="mb-1 block text-[10px] font-bold uppercase tracking-widest text-sky-500/60">
                {selectedOrderType === 'SCOUT'
                  ? 'Zone à investiguer'
                  : selectedOrderType === 'HATSU'
                    ? 'Cible'
                    : 'Destination'}
                </span>
                <select bind:value={selectedLocationId} class="w-full rounded-lg border border-sky-900/50 bg-[#060b14] p-3 text-xs text-sky-50 outline-none transition-colors focus:border-sky-400 focus:ring-1 focus:ring-sky-400">
                  <option value="">Sélectionner une zone</option>
                  {#each playableLocations as location (location.id)}
                    <option value={location.id}>{location.name}</option>
                  {/each}
                </select>
              </label>
            {/if}
            <button
              class="mt-6 w-full rounded-lg border border-sky-400/50 bg-sky-900/40 px-5 py-3 text-xs font-bold uppercase tracking-widest text-sky-300 transition-all enabled:hover:bg-sky-400/30 enabled:hover:shadow-[0_0_20px_rgba(56,189,248,0.3)] disabled:cursor-not-allowed disabled:opacity-40"
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

          <section class="mb-8 border-t border-sky-900/30 pt-6">
            <div class="mb-4"><h2 class="text-xs font-black uppercase tracking-widest text-white">Séquence Opérationnelle</h2></div>
            {#if pendingOrders.length}
              <ul class="space-y-3">
                {#each pendingOrders as order (order.characterId)}
                  <li class="flex items-center justify-between gap-3 rounded-lg border border-sky-900/40 bg-[#060b14]/50 p-3 shadow-inner">
                    <div class="min-w-0">
                      <strong class="block truncate text-xs text-sky-100">{memberName(order.characterId)}</strong>
                      <span class="block truncate text-[10px] text-sky-200/50"
                        >{order.type === 'HATSU'
                          ? (hatsuById(order.abilityId)?.name ?? ORDER_LABELS[order.type])
                          : ORDER_LABELS[order.type]} · {locationById.get(order.locationId)?.name ??
                          order.locationId}</span
                      >
                    </div>
                    <button
                      type="button"
                      class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-950/40 text-red-400 hover:bg-red-900 hover:text-white"
                      aria-label={`Remove ${memberName(order.characterId)}'s order`}
                      onclick={() => removeOrder(order.characterId)}>×</button
                    >
                  </li>
                {/each}
              </ul>
            {:else}
              <p class="rounded-lg border border-sky-900/20 bg-sky-950/10 p-4 text-xs italic text-sky-200/40">Aucun ordre : finaliser le tour passera l'action.</p>
            {/if}
          </section>

          <section class="border-t border-sky-900/30 pt-6">
            <div class="mb-4"><h2 class="text-xs font-black uppercase tracking-widest text-white">Registre Tactique</h2></div>
            <div class="max-h-40 overflow-y-auto rounded-lg border border-sky-900/40 bg-[#040810] p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-sky-900/50" aria-live="polite">
              {#each simStore.turnReports as report, index (`${index}:${report}`)}<p class="mb-2 text-[10px] leading-relaxed text-sky-200/60 last:mb-0">
                  <span class="mr-1 text-sky-500/50">›</span> {report}
                </p>{/each}
            </div>
          </section>
        </div>

        <footer class="border-t border-sky-900/50 bg-[#060b14]/80 p-5">
          {#if errorMessage}<p class="mb-3 rounded bg-red-950/40 p-2 text-xs font-medium text-red-400" role="alert">{errorMessage}</p>{/if}
          <button
            class="w-full rounded-lg bg-sky-400 px-5 py-3.5 text-xs font-black uppercase tracking-[0.15em] text-[#020617] shadow-[0_0_15px_rgba(56,189,248,0.4)] transition-all enabled:hover:bg-sky-300 enabled:hover:shadow-[0_0_25px_rgba(56,189,248,0.6)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            type="button"
            disabled={simStore.gameOver}
            onclick={handleEndTurn}
            >{simStore.gameWon
              ? 'Victoire Stratégique'
              : simStore.gameLost
                ? 'Opération Terminée'
                : `Exécuter le Tour · ${spentCommandPoints} PC`}</button
          >
        </footer>
      </aside>

      <section class="flex min-w-0 flex-col bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-900/20 via-[#020617] to-black p-4 sm:p-8">
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
        <div class="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-[10px] font-bold uppercase tracking-widest text-sky-500/50">SITUATION TACTIQUE · DONNÉES RESTREINTES</p>
            <h2 class="mt-1 font-black text-3xl text-white">Black Whale</h2>
          </div>
        </div>
        <StrategyBattlefield {markers} hatsuCues={simStore.hatsuCues} />
        <p class="mt-4 flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-sky-200/50">
          <span class="flex items-center gap-1.5"><i class="inline-block h-2 w-2 rounded-full border border-sky-400 bg-sky-900"></i> Vos unités</span>
          <span class="flex items-center gap-1.5"><i class="inline-block h-2 w-2 rounded-full border border-sky-700 bg-[#0a0f1c]"></i> Contacts observés</span>
        </p>
      </section>
    </div>
  {/if}
</main>

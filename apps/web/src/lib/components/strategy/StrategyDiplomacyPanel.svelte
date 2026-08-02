<script lang="ts">
  import {
    DIPLOMACY_LABELS,
    type DiplomacyAction,
    type DiplomacyOrder,
    type FactionRelationship,
  } from '$lib/strategy/diplomacy'
  import type { StrategyFaction } from '$lib/strategy/types'

  let {
    factions,
    relationships,
    pending,
    selectedFactionId = $bindable(),
    selectedAction = $bindable(),
    onqueue,
  }: {
    factions: StrategyFaction[]
    relationships: Record<string, FactionRelationship>
    pending: DiplomacyOrder[]
    selectedFactionId: string
    selectedAction: DiplomacyAction
    onqueue: () => void
  } = $props()
</script>

<section>
  <div class="section-title">
    <h2>Diplomacy</h2>
    <span>{pending.length} action{pending.length !== 1 ? 's' : ''}</span>
  </div>
  <div class="relations">
    {#each factions as faction (faction.id)}
      {@const relation = relationships[faction.id]}
      <div>
        <strong>{faction.name}</strong>
        <span
          >Trust {relation?.trust ?? 0} · Fear {relation?.fear ?? 0}{relation?.pact
            ? ' · Active Pact'
            : ''}</span
        >
      </div>
    {/each}
  </div>
  <label>
    Interlocutor
    <select bind:value={selectedFactionId}>
      <option value="">Choose a faction</option>
      {#each factions as faction (faction.id)}<option value={faction.id}>{faction.name}</option
        >{/each}
    </select>
  </label>
  <label>
    Proposal
    <select bind:value={selectedAction}>
      <option value="SHARE_INTEL">Share intel · 1 CP</option>
      <option value="PROPOSE_PACT">Propose pact · 2 CP</option>
      <option value="THREATEN">Apply pressure · 1 CP</option>
      <option value="BETRAY">Break pact · 0 CP</option>
    </select>
  </label>
  <button class="secondary-action" type="button" disabled={!selectedFactionId} onclick={onqueue}
    >Add Proposal</button
  >
  {#if pending.length}
    <ul class="diplomacy-plan">
      {#each pending as order (order.factionId)}
        <li>
          {DIPLOMACY_LABELS[order.action]} · {factions.find((f) => f.id === order.factionId)?.name}
        </li>
      {/each}
    </ul>
  {/if}
</section>

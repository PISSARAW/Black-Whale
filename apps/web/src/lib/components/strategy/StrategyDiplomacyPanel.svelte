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
    <h2>Diplomatie</h2>
    <span>{pending.length} action</span>
  </div>
  <div class="relations">
    {#each factions as faction (faction.id)}
      {@const relation = relationships[faction.id]}
      <div>
        <strong>{faction.name}</strong>
        <span
          >Confiance {relation?.trust ?? 0} · Crainte {relation?.fear ?? 0}{relation?.pact
            ? ' · Pacte actif'
            : ''}</span
        >
      </div>
    {/each}
  </div>
  <label>
    Interlocuteur
    <select bind:value={selectedFactionId}>
      <option value="">Choisir une faction</option>
      {#each factions as faction (faction.id)}<option value={faction.id}>{faction.name}</option
        >{/each}
    </select>
  </label>
  <label>
    Proposition
    <select bind:value={selectedAction}>
      <option value="SHARE_INTEL">Partager un renseignement · 1 PC</option>
      <option value="PROPOSE_PACT">Proposer un pacte · 2 PC</option>
      <option value="THREATEN">Faire pression · 1 PC</option>
      <option value="BETRAY">Rompre le pacte · 0 PC</option>
    </select>
  </label>
  <button class="secondary-action" type="button" disabled={!selectedFactionId} onclick={onqueue}
    >Ajouter la proposition</button
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

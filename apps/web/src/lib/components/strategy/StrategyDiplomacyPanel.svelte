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

<section class="mb-8 border-t border-sky-900/30 pt-6">
  <div class="mb-4 flex items-center justify-between">
    <h2 class="text-xs font-black uppercase tracking-widest text-white">Diplomatie</h2>
    <span
      class="rounded bg-sky-900/40 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-sky-300"
      >{pending.length} action{pending.length !== 1 ? 's' : ''}</span
    >
  </div>
  <div class="mb-4 flex flex-col gap-2">
    {#each factions as faction (faction.id)}
      {@const relation = relationships[faction.id]}
      <div class="flex flex-col gap-1 border-l-2 border-sky-600 pl-3">
        <strong class="text-xs text-sky-100">{faction.name}</strong>
        <span class="text-[10px] text-sky-200/60"
          >Confiance {relation?.trust ?? 0} · Crainte {relation?.fear ?? 0}{relation?.pact
            ? ' · Pacte Actif'
            : ''}</span
        >
      </div>
    {/each}
  </div>
  <label class="mt-4 block">
    <span class="mb-1 block text-[10px] font-bold uppercase tracking-widest text-sky-500/60"
      >Interlocuteur</span
    >
    <select
      bind:value={selectedFactionId}
      class="w-full rounded-lg border border-sky-900/50 bg-[#060b14] p-3 text-xs text-sky-50 outline-none transition-colors focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
    >
      <option value="">Sélectionner une faction</option>
      {#each factions as faction (faction.id)}<option value={faction.id}>{faction.name}</option
        >{/each}
    </select>
  </label>
  <label class="mt-4 block">
    <span class="mb-1 block text-[10px] font-bold uppercase tracking-widest text-sky-500/60"
      >Proposition</span
    >
    <select
      bind:value={selectedAction}
      class="w-full rounded-lg border border-sky-900/50 bg-[#060b14] p-3 text-xs text-sky-50 outline-none transition-colors focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
    >
      <option value="SHARE_INTEL">Partager données · 1 PC</option>
      <option value="PROPOSE_PACT">Proposer alliance · 2 PC</option>
      <option value="THREATEN">Faire pression · 1 PC</option>
      <option value="BETRAY">Rompre le pacte · 0 PC</option>
    </select>
  </label>
  <button
    class="mt-5 w-full rounded-lg border border-sky-900/60 bg-[#101827] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-sky-200 transition-colors enabled:hover:border-sky-500/50 enabled:hover:bg-sky-900/40 disabled:cursor-not-allowed disabled:opacity-40"
    type="button"
    disabled={!selectedFactionId}
    onclick={onqueue}>Formuler Proposition</button
  >
  {#if pending.length}
    <ul class="mt-4 flex flex-col gap-1.5 pl-4 text-[10px] font-medium text-sky-200/50">
      {#each pending as order (order.factionId)}
        <li
          class="relative before:absolute before:-left-3 before:top-1/2 before:h-1 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-amber-400"
        >
          {DIPLOMACY_LABELS[order.action]} · {factions.find((f) => f.id === order.factionId)?.name}
        </li>
      {/each}
    </ul>
  {/if}
</section>

<script lang="ts">
  import type { StrategyFaction } from '$lib/strategy/types'
  import type { StrategySave } from '$lib/strategy/persistence'
  import { scenarioDoctrineForFaction } from '$lib/strategy/scenario'

  let {
    chapterNumber,
    factions,
    saved,
    onselect,
    onresume,
  }: {
    chapterNumber?: number
    factions: StrategyFaction[]
    saved: StrategySave | null
    onselect: (id: string) => void
    onresume: () => void
  } = $props()
</script>

<section class="faction-picker">
  <p class="eyebrow">Scenario · Chapter {chapterNumber}</p>
  <h1>Choose Your Faction</h1>
  <p class="intro">
    Eight turns to impose your doctrine. Orders, negotiations and Hatsu share the same command point budget.
  </p>
  {#if saved}
    <button class="resume" type="button" onclick={onresume}
      >Resume · turn {saved.turns.length + 1}</button
    >
  {/if}
  {#if factions.length}
    <div class="faction-grid">
      {#each factions as faction (faction.id)}
        <button type="button" onclick={() => onselect(faction.id)}>
          <strong>{faction.name}</strong>
          <span>{faction.members.length} unit{faction.members.length > 1 ? 's' : ''} · {scenarioDoctrineForFaction(faction.id)}</span>
          <em>Play this faction →</em>
        </button>
      {/each}
    </div>
  {:else}
    <p class="empty">No active faction at this point in the story.</p>
  {/if}
</section>

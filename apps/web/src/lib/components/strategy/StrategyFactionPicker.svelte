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
  <p class="eyebrow">Scénario · chapitre {chapterNumber}</p>
  <h1>Choisissez votre faction</h1>
  <p class="intro">
    Huit tours pour imposer votre doctrine. Les ordres, négociations et Hatsu partagent le même
    budget de commandement.
  </p>
  {#if saved}
    <button class="resume" type="button" onclick={onresume}
      >Reprendre · tour {saved.turns.length + 1}</button
    >
  {/if}
  {#if factions.length}
    <div class="faction-grid">
      {#each factions as faction (faction.id)}
        <button type="button" onclick={() => onselect(faction.id)}>
          <strong>{faction.name}</strong>
          <span>{faction.members.length} unité{faction.members.length > 1 ? 's' : ''} · {scenarioDoctrineForFaction(faction.id).toLocaleLowerCase('fr')}</span>
          <em>Jouer cette faction →</em>
        </button>
      {/each}
    </div>
  {:else}
    <p class="empty">Aucune faction active à ce point du récit.</p>
  {/if}
</section>

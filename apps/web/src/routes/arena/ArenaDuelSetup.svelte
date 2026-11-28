<script lang="ts">
  import FightPortrait from '$lib/components/fighting/FightPortrait.svelte'
  import { ARENA_FIGHTERS } from '$lib/arena/fighting'
  import { ARENA_TERRAINS, type ArenaTerrainId } from '$lib/arena/terrain'
  import type { FighterId } from '$lib/fighting/types'
  import { link, locale, t } from '$lib/i18n'
  import { theShip } from '$lib/tour/blueprint'

  let {
    fighterId = $bindable(),
    opponentFighterId = $bindable(),
    terrainId = $bindable(),
  }: {
    fighterId: FighterId
    opponentFighterId: FighterId
    terrainId: ArenaTerrainId
  } = $props()

  const spaces = theShip().spaces
  const fr = $derived($locale === 'fr')
  const matchPath = $derived(
    `/arena?${new URLSearchParams({
      play: '1',
      fighter: fighterId,
      enemy: opponentFighterId,
      terrain: terrainId,
    })}`,
  )
</script>

{#snippet fighters()}
  {#each ARENA_FIGHTERS as fighter (fighter.id)}
    <option value={fighter.id}>{fighter.name}</option>
  {/each}
{/snippet}

<div class="duel-setup">
  <div class="fighter-choices">
    <div class="fighter-choice">
      <div class="fighter-preview" aria-hidden="true"><FightPortrait id={fighterId} /></div>
      <label>
        <span>{fr ? 'Ton combattant' : 'Your fighter'}</span>
        <select bind:value={fighterId}>{@render fighters()}</select>
      </label>
    </div>
    <div class="fighter-choice">
      <div class="fighter-preview" aria-hidden="true">
        <FightPortrait id={opponentFighterId} reverse />
      </div>
      <label>
        <span>{$t.arena.ui.opponent}</span>
        <select bind:value={opponentFighterId}>{@render fighters()}</select>
      </label>
    </div>
  </div>

  <fieldset>
    <legend>{$t.arena.ui.terrain}</legend>
    <div class="terrain-choices">
      {#each ARENA_TERRAINS as { id } (id)}
        {@const space = spaces.get(id)!}
        <label class="terrain-choice">
          <input type="radio" name="arena-terrain" value={id} bind:group={terrainId} />
          <span>{fr ? space.nameFr : space.name}</span>
        </label>
      {/each}
    </div>
  </fieldset>

  <a class="launch" href={$link(matchPath)}>
    {fr ? 'Lancer le duel' : 'Start duel'} <span aria-hidden="true">→</span>
  </a>
</div>

<style>
  .duel-setup {
    display: grid;
    gap: 1.1rem;
  }

  .fighter-choices,
  .terrain-choices {
    display: grid;
    gap: 0.65rem;
  }

  .fighter-choices {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .fighter-choice {
    display: grid;
    min-width: 0;
    border: 1px solid #35505a;
    background: linear-gradient(130deg, #203b40, #121e25 75%);
  }

  .fighter-preview {
    height: 15rem;
    overflow: hidden;
  }

  .fighter-preview :global(.clash-portrait) {
    max-width: 17.5rem;
    margin-inline: auto;
  }

  .fighter-choice label {
    display: grid;
    gap: 0.4rem;
    padding: 0.75rem;
  }

  .fighter-choice label > span,
  legend {
    color: var(--arena-cyan);
    font: 600 0.72rem var(--font-mono, monospace);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  select {
    width: 100%;
    min-height: 2.75rem;
    border: 1px solid #52717a;
    padding: 0.45rem 0.65rem;
    background: #101d24;
    color: inherit;
  }

  fieldset {
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }

  legend {
    margin-bottom: 0.6rem;
    padding: 0;
  }

  .terrain-choices {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
  }

  .terrain-choice {
    display: flex;
    min-height: 2.75rem;
    align-items: center;
    gap: 0.55rem;
    border: 1px solid #35505a;
    padding: 0.6rem 0.7rem;
    background: #15242c;
    font-size: 0.82rem;
    cursor: pointer;
  }

  .terrain-choice:has(:checked) {
    border-color: var(--arena-gold);
    background: #332e1e;
  }

  .terrain-choice input {
    flex: 0 0 auto;
    accent-color: var(--arena-gold);
  }

  .launch {
    display: inline-flex;
    min-height: 2.75rem;
    justify-self: end;
    align-items: center;
    gap: 1rem;
    padding: 0.6rem 1rem;
    background: var(--arena-gold);
    color: #17180f;
    font-weight: 700;
    text-decoration: none;
  }

  .launch:hover {
    background: #ffe593;
  }

  select:focus-visible,
  .terrain-choice:has(:focus-visible),
  .launch:focus-visible {
    outline: 2px solid var(--arena-gold);
    outline-offset: 3px;
  }

  @media (max-width: 600px) {
    .fighter-preview {
      height: 11rem;
    }

    .fighter-preview :global(.clash-portrait),
    .fighter-preview :global(.fighter-model) {
      min-height: 0;
    }

    .launch {
      width: 100%;
      justify-content: space-between;
    }
  }
</style>

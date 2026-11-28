<script lang="ts">
  import { onMount } from 'svelte'
  import { ARENA_CAMPAIGN, arenaMissionSearch, missionStatus } from '$lib/arena/campaign'
  import { ARENA_CHALLENGES } from '$lib/arena/challenges/catalogue'
  import { freshArenaProfile, loadArenaProfile } from '$lib/arena/profile'
  import { link, locale } from '$lib/i18n'

  let { panel }: { panel: 'challenges' | 'campaign' } = $props()
  let profile = $state(freshArenaProfile())
  const fr = $derived($locale === 'fr')

  onMount(() => {
    profile = loadArenaProfile(localStorage)
  })
</script>

<ul>
  {#if panel === 'campaign'}
    {#each ARENA_CAMPAIGN as mission (mission.id)}
      {@const status = missionStatus(mission, profile)}
      {@const title = fr ? mission.titleFr : mission.titleEn}
      <li>
        {#snippet missionTitle()}
          <strong>{title}</strong>
          <small>{fr ? 'Chapitre' : 'Chapter'} {mission.chapter}</small>
        {/snippet}
        {#if status === 'locked'}
          <div class="mode-option locked">
            <span>{@render missionTitle()}</span>
            <span>{fr ? 'Verrouillée' : 'Locked'}</span>
          </div>
        {:else}
          <a class="mode-option" href={$link(`/arena?${arenaMissionSearch(mission)}`)}>
            <span>{@render missionTitle()}</span>
            {#if status === 'complete'}
              <span>{fr ? 'Terminée' : 'Complete'}</span>
            {:else}
              <span aria-hidden="true">→</span>
            {/if}
          </a>
        {/if}
      </li>
    {/each}
  {:else}
    {#each ARENA_CHALLENGES as challenge (challenge.id)}
      <li>
        <a class="mode-option" href={$link(`/arena?challenge=${challenge.id}`)}>
          <strong>{fr ? challenge.titleFr : challenge.titleEn}</strong>
          <span aria-hidden="true">→</span>
        </a>
      </li>
    {/each}
  {/if}
</ul>

<style>
  ul {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .mode-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    min-height: 3.25rem;
    padding: 0.65rem 0.85rem;
    border: 1px solid #35505a;
    color: var(--arena-cyan);
    font-size: 0.8rem;
    text-decoration: none;
  }

  .mode-option strong {
    color: #f6f3e9;
    font-size: 0.95rem;
  }

  .mode-option small {
    display: block;
    margin-top: 0.2rem;
    font-family: var(--font-mono, monospace);
    font-size: 0.62rem;
    letter-spacing: 0.11em;
    text-transform: uppercase;
  }

  a.mode-option:focus-visible {
    outline: 2px solid var(--arena-gold);
    outline-offset: 3px;
  }

  a.mode-option:hover {
    border-color: var(--arena-cyan);
  }

  .mode-option.locked,
  .mode-option.locked strong {
    color: #9eafb3;
  }

  @media (max-width: 600px) {
    ul {
      grid-template-columns: 1fr;
      gap: 0.65rem;
    }
  }
</style>

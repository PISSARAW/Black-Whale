<script lang="ts">
  import { onMount } from 'svelte'
  import { ARENA_CAMPAIGN, missionStatus } from '$lib/arena/campaign'
  import {
    NEN_MASTERIES,
    freshArenaProfile,
    loadArenaProfile,
    recordArenaResult,
    saveArenaProfile,
    type ArenaProfile,
  } from '$lib/arena/profile'
  import { loadReplayLibrary, saveReplayToLibrary } from '$lib/arena/replay/library'
  import type { ArenaReplay } from '$lib/arena/replay/types'
  import type { ChallengeResult } from '$lib/arena/challenges/types'

  interface Props {
    replay: ArenaReplay | null
    challengeId: string | null
    result: ChallengeResult | null
    locale: 'fr' | 'en'
  }

  let { replay, challengeId, result, locale }: Props = $props()
  let profile = $state<ArenaProfile>(freshArenaProfile())
  let replayCount = $state(0)

  onMount(() => {
    profile = loadArenaProfile(localStorage)
    if (!replay) {
      replayCount = loadReplayLibrary(localStorage).length
      return
    }
    const marker = `black-whale:arena-profile-recorded:${replay.checksum}`
    if (!sessionStorage.getItem(marker)) {
      profile = recordArenaResult(profile, replay, challengeId, result)
      saveArenaProfile(localStorage, profile)
      sessionStorage.setItem(marker, '1')
    }
    replayCount = saveReplayToLibrary(localStorage, replay).length
  })
</script>

<section class="arena-v3-panel" aria-label="Arena V3">
  <header>
    <div>
      <small>ARENA V3</small><strong
        >{profile.wins}/{profile.bouts} {locale === 'fr' ? 'victoires' : 'wins'}</strong
      >
    </div>
    <span>{replayCount} replays</span>
  </header>

  <div class="masteries">
    {#each NEN_MASTERIES as technique (technique)}
      <label
        ><span>{technique.toUpperCase()}</span><progress
          max="100"
          value={profile.mastery[technique]}
        ></progress><b>{profile.mastery[technique]}</b></label
      >
    {/each}
  </div>

  <div class="campaign">
    {#each ARENA_CAMPAIGN as mission (mission.id)}
      {@const status = missionStatus(mission, profile)}
      <a
        class:locked={status === 'locked'}
        class:complete={status === 'complete'}
        aria-disabled={status === 'locked'}
        href={status === 'locked'
          ? undefined
          : `?terrain=${mission.terrainId}&challenge=${mission.challengeId}&doctrine=${mission.doctrine}&difficulty=${mission.difficulty}`}
      >
        <small>CH. {mission.chapter} · {status}</small>
        <strong>{locale === 'fr' ? mission.titleFr : mission.titleEn}</strong>
        {#if mission.boss}<b>BOSS</b>{/if}
      </a>
    {/each}
  </div>
</section>

<style>
  .arena-v3-panel {
    width: min(48rem, 94vw);
    padding: 0.85rem;
    border: 1px solid #8ad7e755;
    background: #061116ee;
    color: #dcebed;
  }
  header,
  header div,
  .campaign {
    display: flex;
    gap: 0.6rem;
    align-items: center;
    justify-content: space-between;
  }
  header div {
    align-items: baseline;
  }
  small {
    color: #8ad7e7;
    font:
      0.56rem 'IBM Plex Mono',
      monospace;
    letter-spacing: 0.1em;
  }
  .masteries {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.35rem;
    margin: 0.75rem 0;
  }
  .masteries label {
    display: grid;
    grid-template-columns: 3rem 1fr 1.5rem;
    gap: 0.3rem;
    align-items: center;
    font-size: 0.6rem;
  }
  progress {
    width: 100%;
    accent-color: #e3c36d;
  }
  .campaign {
    overflow-x: auto;
    align-items: stretch;
  }
  .campaign a {
    min-width: 8rem;
    display: grid;
    gap: 0.25rem;
    padding: 0.55rem;
    border: 1px solid #8ad7e744;
    color: inherit;
    text-decoration: none;
  }
  .campaign a.complete {
    border-color: #e3c36d88;
  }
  .campaign a.locked {
    opacity: 0.38;
    pointer-events: none;
  }
  .campaign b {
    color: #e3c36d;
    font-size: 0.58rem;
  }
  @media (max-width: 600px) {
    .masteries {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>

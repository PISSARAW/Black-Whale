<script lang="ts">
  import { onMount } from 'svelte'
  import { ARENA_CHALLENGES } from '$lib/arena/challenges/catalogue'
  import type { ChallengeObjective, ChallengeResult } from '$lib/arena/challenges/types'
  import { OPPONENT_DOCTRINES, type ArenaDifficulty, type OpponentDoctrine } from '$lib/arena/ai'
  import { difficultyLabel } from '$lib/arena/progression'
  import { ARENA_FORMATS, type ArenaFormatId } from '$lib/arena/formats'
  import { V3_OPPONENTS } from '$lib/arena/adaptation'
  import type { ArenaOpponentId } from '$lib/arena/experience'
  import { link, locale, t } from '$lib/i18n'
  import { ARENA_CAMPAIGN, missionStatus } from '$lib/arena/campaign'
  import { freshArenaProfile, loadArenaProfile } from '$lib/arena/profile'

  interface Props {
    terrainId: string
    hrefFor: (terrainId: string) => string
    selectedChallengeId: string | null
    difficulty: ArenaDifficulty
    opponentDoctrine: OpponentDoctrine
    formatId: ArenaFormatId
    opponentId: ArenaOpponentId
    progress: ChallengeResult | null
    objectiveLabel: (objective: ChallengeObjective) => string
    onChange: () => void
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }

  let {
    terrainId,
    hrefFor,
    selectedChallengeId = $bindable(),
    difficulty = $bindable(),
    opponentDoctrine = $bindable(),
    formatId = $bindable(),
    opponentId = $bindable(),
    progress,
    objectiveLabel,
    onChange,
    open = false,
    onOpenChange,
  }: Props = $props()

  const selected = $derived(
    ARENA_CHALLENGES.find((challenge) => challenge.id === selectedChallengeId) ?? null,
  )
  let profile = $state(freshArenaProfile())

  onMount(() => {
    profile = loadArenaProfile(localStorage)
  })
</script>

<details class="arena-setup" {open} ontoggle={(event) => onOpenChange?.(event.currentTarget.open)}>
  <summary aria-label={$locale === 'fr' ? 'Paramètres du duel' : 'Match setup'}>
    <span class="setup-mark" aria-hidden="true"><i></i><i></i><i></i></span>
    <span class="setup-title">
      <small>{$t.arena.ui.challengesUpper}</small>
      <strong
        >{selected
          ? $locale === 'fr'
            ? selected.titleFr
            : selected.titleEn
          : $t.arena.ui.freeCombat}</strong
      >
    </span>
    <span class="setup-chevron" aria-hidden="true"></span>
  </summary>

  <div class="setup-drawer">
    <header>
      <p>{$locale === 'fr' ? 'Paramètres du duel' : 'Match setup'}</p>
      <span
        >{$locale === 'fr'
          ? 'Les changements relancent le combat'
          : 'Changes restart the fight'}</span
      >
    </header>

    <nav class="terrain-picker" aria-label={$t.arena.ui.terrain}>
      <a
        class:active={terrainId === 'tier-1-banquet-hall'}
        href={hrefFor('tier-1-banquet-hall')}
        data-sveltekit-reload>{$t.arena.ui.terrains.banquet}</a
      >
      <a
        class:active={terrainId === 'tier-2-screening-room'}
        href={hrefFor('tier-2-screening-room')}
        data-sveltekit-reload>{$t.arena.ui.terrains.screening}</a
      >
      <a
        class:active={terrainId === 'tier-1-vip-casino'}
        href={hrefFor('tier-1-vip-casino')}
        data-sveltekit-reload>{$t.arena.ui.terrains.casino}</a
      >
      <a
        class:active={terrainId === 'tier-3-observation-deck'}
        href={hrefFor('tier-3-observation-deck')}
        data-sveltekit-reload>{$t.arena.ui.terrains.observation}</a
      >
    </nav>

    <nav class="terrain-picker" aria-label="PvP">
      <a href={$link('/arena/pvp')}>
        {$locale === 'fr' ? 'PvP · Créer un duel privé' : 'PvP · Create a private duel'}
      </a>
    </nav>

    <nav class="campaign-picker" aria-label={$locale === 'fr' ? 'Campagne' : 'Campaign'}>
      {#each ARENA_CAMPAIGN as mission (mission.id)}
        {@const status = missionStatus(mission, profile)}
        <a
          class:locked={status === 'locked'}
          aria-disabled={status === 'locked'}
          href={status === 'locked'
            ? undefined
            : `?terrain=${mission.terrainId}&challenge=${mission.challengeId}&doctrine=${mission.doctrine}&difficulty=${mission.difficulty}&format=${mission.formatId}&opponent=${mission.opponentId}&mission=${mission.id}`}
          data-sveltekit-reload
        >
          <small>CH. {mission.chapter}</small>
          <strong>{mission.titleFr && $locale === 'fr' ? mission.titleFr : mission.titleEn}</strong>
        </a>
      {/each}
    </nav>

    <div class="setup-fields">
      <label>
        <span>{$t.arena.ui.challenges}</span>
        <select bind:value={selectedChallengeId} onchange={onChange}>
          <option value={null}>{$t.arena.ui.freeCombat}</option>
          {#each ARENA_CHALLENGES as challenge (challenge.id)}
            <option value={challenge.id}
              >{$locale === 'fr' ? challenge.titleFr : challenge.titleEn}</option
            >
          {/each}
        </select>
      </label>
      <label>
        <span>{$t.arena.ui.difficulty}</span>
        <select
          bind:value={difficulty}
          onchange={() => {
            opponentId = 'custom'
            onChange()
          }}
        >
          {#each ['initiate', 'fighter', 'master'] as level (level)}
            <option value={level}>{difficultyLabel(level as ArenaDifficulty, $locale)}</option>
          {/each}
        </select>
      </label>
      <label>
        <span>{$t.arena.ui.opponent}</span>
        <select
          bind:value={opponentDoctrine}
          onchange={() => {
            opponentId = 'custom'
            onChange()
          }}
        >
          {#each Object.entries(OPPONENT_DOCTRINES) as [id, doctrine] (id)}
            <option value={id}>{doctrine.name}</option>
          {/each}
        </select>
      </label>
      <label>
        <span>{$locale === 'fr' ? 'Format' : 'Format'}</span>
        <select bind:value={formatId} onchange={onChange}>
          {#each ARENA_FORMATS as format (format.id)}
            <option value={format.id}>{$locale === 'fr' ? format.titleFr : format.titleEn}</option>
          {/each}
        </select>
      </label>
      <label class="opponent-profile">
        <span>{$locale === 'fr' ? 'Profil adverse' : 'Opponent profile'}</span>
        <select bind:value={opponentId} onchange={onChange}>
          <option value="custom"
            >{$locale === 'fr' ? 'Configuration personnalisée' : 'Custom setup'}</option
          >
          <option value="adaptive"
            >{$locale === 'fr' ? 'Adversaire adaptatif' : 'Adaptive opponent'}</option
          >
          {#each V3_OPPONENTS as opponent (opponent.id)}
            <option value={opponent.id}
              >{$locale === 'fr' ? opponent.nameFr : opponent.nameEn}</option
            >
          {/each}
        </select>
      </label>
    </div>

    {#if selected}
      <ol class="setup-objectives">
        {#each selected.objectives as objective, index (index)}
          <li class:complete={progress?.satisfied[index]}>
            <span aria-hidden="true">{progress?.satisfied[index] ? '✓' : index + 1}</span>
            {objectiveLabel(objective)}
          </li>
        {/each}
      </ol>
    {/if}
  </div>
</details>

<style>
  .arena-setup {
    position: absolute;
    z-index: 30;
    top: 1rem;
    right: 7.5rem;
    width: min(21rem, calc(100vw - 2rem));
    color: #fffff0;
    font-family: var(--font-body, sans-serif);
    pointer-events: auto;
  }

  summary {
    display: grid;
    grid-template-columns: 2rem minmax(0, 1fr) 1rem;
    min-height: 3.25rem;
    align-items: center;
    gap: 0.65rem;
    padding: 0.55rem 0.7rem;
    border: 1px solid rgb(255 255 240 / 16%);
    border-right: 2px solid #ffd700;
    background: linear-gradient(100deg, rgb(5 9 12 / 90%), rgb(10 18 23 / 74%));
    box-shadow: 0 0.7rem 2rem rgb(0 0 0 / 28%);
    backdrop-filter: blur(14px);
    list-style: none;
    cursor: pointer;
  }

  details:not([open]) summary {
    width: 3.1rem;
    margin-left: auto;
    grid-template-columns: 1fr;
    padding: 0.45rem;
    border-right-width: 1px;
  }

  details:not([open]) .setup-title,
  details:not([open]) .setup-chevron {
    display: none;
  }

  details[open] summary {
    width: 100%;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary:focus-visible {
    outline: 2px solid #ffd700;
    outline-offset: 3px;
  }

  .setup-mark {
    display: grid;
    gap: 0.2rem;
    padding: 0.35rem;
    border: 1px solid rgb(255 215 0 / 34%);
    transform: skewX(-8deg);
  }

  .setup-mark i {
    display: block;
    height: 1px;
    background: #ffd700;
  }

  .setup-title {
    display: grid;
    min-width: 0;
    gap: 0.12rem;
  }

  .setup-title small,
  .setup-drawer header p,
  label > span {
    color: #ffd700;
    font-size: 0.55rem;
    font-weight: 650;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .setup-title strong {
    overflow: hidden;
    font-size: 0.7rem;
    letter-spacing: 0.05em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .setup-chevron {
    width: 0.5rem;
    height: 0.5rem;
    border-right: 1px solid #fffff0;
    border-bottom: 1px solid #fffff0;
    transform: rotate(45deg) translate(-0.1rem, 0.1rem);
    transition: transform 180ms ease;
  }

  details[open] .setup-chevron {
    transform: rotate(225deg) translate(-0.1rem, 0.1rem);
  }

  .setup-drawer {
    max-height: min(38rem, calc(100dvh - 5.5rem));
    padding: 0.85rem;
    border: 1px solid rgb(255 255 240 / 14%);
    border-top: 0;
    background: rgb(4 9 12 / 94%);
    box-shadow: 0 1.4rem 3rem rgb(0 0 0 / 55%);
    backdrop-filter: blur(18px);
    overflow-y: auto;
  }

  .setup-drawer header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: baseline;
    margin-bottom: 0.7rem;
  }

  .setup-drawer header p {
    margin: 0;
  }

  .setup-drawer header span {
    color: rgb(255 255 240 / 42%);
    font-size: 0.52rem;
    text-align: right;
  }

  .terrain-picker {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.3rem;
    margin-bottom: 0.8rem;
  }

  .terrain-picker a {
    min-width: 0;
    padding: 0.5rem;
    border: 1px solid rgb(255 255 240 / 12%);
    background: rgb(255 255 240 / 3%);
    color: rgb(255 255 240 / 58%);
    font-size: 0.58rem;
    letter-spacing: 0.04em;
    text-align: center;
    text-decoration: none;
  }

  .terrain-picker a.active {
    border-color: rgb(255 215 0 / 60%);
    background: rgb(255 215 0 / 8%);
    color: #fffff0;
  }

  .campaign-picker {
    display: flex;
    gap: 0.3rem;
    margin-bottom: 0.8rem;
    overflow-x: auto;
  }

  .campaign-picker a {
    display: grid;
    min-width: 7.5rem;
    gap: 0.15rem;
    padding: 0.45rem;
    border: 1px solid rgb(138 215 231 / 24%);
    color: #e9f4f6;
    text-decoration: none;
  }

  .campaign-picker a.locked {
    opacity: 0.35;
    pointer-events: none;
  }

  .campaign-picker small {
    color: #8ad7e7;
    font-size: 0.5rem;
  }

  .campaign-picker strong {
    font-size: 0.58rem;
  }

  .setup-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.65rem 0.5rem;
  }

  label {
    display: grid;
    min-width: 0;
    gap: 0.28rem;
  }

  .opponent-profile {
    grid-column: 1 / -1;
  }

  select {
    width: 100%;
    min-height: 2.55rem;
    padding: 0.45rem 1.8rem 0.45rem 0.55rem;
    border: 1px solid rgb(138 215 231 / 24%);
    border-radius: 0;
    background: #091319;
    color: #e9f4f6;
    font-size: 0.66rem;
    text-overflow: ellipsis;
  }

  .setup-objectives {
    display: grid;
    gap: 0.35rem;
    margin: 0.85rem 0 0;
    padding: 0.7rem 0 0;
    border-top: 1px solid rgb(255 255 240 / 10%);
    list-style: none;
  }

  .setup-objectives li {
    display: grid;
    grid-template-columns: 1.35rem 1fr;
    align-items: center;
    color: rgb(255 255 240 / 62%);
    font-size: 0.62rem;
  }

  .setup-objectives li span {
    display: grid;
    width: 1rem;
    height: 1rem;
    place-items: center;
    border: 1px solid rgb(138 215 231 / 30%);
    color: #8ad7e7;
    font-size: 0.55rem;
  }

  .setup-objectives li.complete {
    color: #fffff0;
  }

  .setup-objectives li.complete span {
    border-color: #ffd700;
    color: #ffd700;
  }

  @media (max-width: 800px) {
    .arena-setup {
      top: 0.55rem;
      right: 0.55rem;
      width: calc(100vw - 1.1rem);
    }

    .arena-setup[open] {
      right: 0.55rem;
    }

    summary {
      min-height: 2.75rem;
    }

    details[open] summary {
      width: 100%;
      grid-template-columns: 2rem minmax(0, 1fr) 1rem;
    }

    .setup-drawer {
      max-height: calc(100dvh - 4rem);
      padding-bottom: max(0.85rem, env(safe-area-inset-bottom));
    }
  }
</style>

<script lang="ts">
  import { ARENA_CHALLENGES } from '$lib/arena/challenges/catalogue'
  import type { ChallengeObjective, ChallengeResult } from '$lib/arena/challenges/types'
  import { OPPONENT_DOCTRINES, type ArenaDifficulty, type OpponentDoctrine } from '$lib/arena/ai'
  import { difficultyLabel } from '$lib/arena/progression'
  import { locale, t } from '$lib/i18n'

  interface Props {
    terrainId: string
    hrefFor: (terrainId: string) => string
    selectedChallengeId: string | null
    difficulty: ArenaDifficulty
    opponentDoctrine: OpponentDoctrine
    progress: ChallengeResult | null
    objectiveLabel: (objective: ChallengeObjective) => string
    onChange: () => void
  }

  let {
    terrainId,
    hrefFor,
    selectedChallengeId = $bindable(),
    difficulty = $bindable(),
    opponentDoctrine = $bindable(),
    progress,
    objectiveLabel,
    onChange,
  }: Props = $props()

  const selected = $derived(
    ARENA_CHALLENGES.find((challenge) => challenge.id === selectedChallengeId) ?? null,
  )
</script>

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

<aside class="challenge-panel" aria-label={$t.arena.ui.challenges}>
  <header>
    <small>{$t.arena.ui.challengesUpper}</small>
    <strong
      >{selected
        ? $locale === 'fr'
          ? selected.titleFr
          : selected.titleEn
        : $t.arena.ui.freeCombat}</strong
    >
  </header>
  <select bind:value={selectedChallengeId} onchange={onChange} aria-label={$t.arena.ui.challenges}>
    <option value={null}>{$t.arena.ui.freeCombat}</option>
    {#each ARENA_CHALLENGES as challenge (challenge.id)}
      <option value={challenge.id}
        >{$locale === 'fr' ? challenge.titleFr : challenge.titleEn}</option
      >
    {/each}
  </select>
  <select bind:value={difficulty} onchange={onChange} aria-label={$t.arena.ui.difficulty}>
    {#each ['initiate', 'fighter', 'master'] as level (level)}
      <option value={level}>{difficultyLabel(level as ArenaDifficulty, $locale)}</option>
    {/each}
  </select>
  <select bind:value={opponentDoctrine} onchange={onChange} aria-label={$t.arena.ui.opponent}>
    {#each Object.entries(OPPONENT_DOCTRINES) as [id, doctrine] (id)}
      <option value={id}>{doctrine.name}</option>
    {/each}
  </select>
  {#if selected}
    <ol>
      {#each selected.objectives as objective, index (index)}
        <li>{progress?.satisfied[index] ? '✓' : '○'} {objectiveLabel(objective)}</li>
      {/each}
    </ol>
  {/if}
</aside>

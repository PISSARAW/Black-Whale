<script lang="ts">
  import { onMount } from 'svelte'
  import type { FightState } from '$lib/fighting/types'
  import { fighterDefinition } from '$lib/fighting/roster'
  import { fightStage } from '$lib/fighting/stages'
  import { finishLabel } from '../../../routes/fighting/fightingPageHelpers'
  import FightCeremony from './FightCeremony.svelte'
  import './fightResults.css'
  export let state: FightState
  export let language: 'fr' | 'en'
  export let onRematch: () => void
  export let onContinue: () => void
  export let onChoose: () => void
  export let onQuit: () => void
  let primary: HTMLButtonElement
  $: fr = language === 'fr'
  $: winner = state.matchWinner ?? state.winner
  $: drawn = winner === 'draw' || !winner
  $: local = state.mode === 'versus-local'
  $: lost = !local && winner === 'opponent'
  $: title = drawn
    ? fr
      ? 'ÉGALITÉ'
      : 'DRAW'
    : lost
      ? fr
        ? 'DÉFAITE'
        : 'DEFEAT'
      : fr
        ? 'VICTOIRE'
        : 'VICTORY'
  $: stage = fightStage(state.environment.stageId)
  $: winnerName =
    winner === 'player' || winner === 'opponent' ? fighterDefinition(state[winner].id).name : ''
  $: winnerSide = winner === 'player' ? 'P1' : local ? 'P2' : fr ? 'PROCESSEUR' : 'CPU'
  onMount(() => primary?.focus({ preventScroll: true }))
</script>

<section
  class="fight-results result-overlay"
  class:lost
  class:drawn
  aria-label={fr ? 'Résultat du combat' : 'Fight result'}
  data-fight-scroll
>
  <div class="results-panel">
    <header class="results-heading" aria-live="polite">
      <p class="results-eyebrow">
        CLASH / {state.matchWinner
          ? fr
            ? 'DUEL TERMINÉ'
            : 'MATCH COMPLETE'
          : fr
            ? `MANCHE ${state.roundNumber} TERMINÉE`
            : `ROUND ${state.roundNumber} COMPLETE`}
      </p>
      <h2>{title}</h2>
      <p class="results-winner">
        {#if drawn}{fr ? 'Aucun vainqueur pour cette manche' : 'No winner this round'}{:else}<span
            >{winnerSide}</span
          >
          {winnerName}
          <small
            >{state.matchWinner
              ? fr
                ? 'remporte le duel'
                : 'wins the match'
              : fr
                ? 'remporte la manche'
                : 'wins the round'}</small
          >{/if}
      </p>
    </header>
    <div class="results-context">
      <strong
        >{state.finishReason === 'time'
          ? fr
            ? 'TEMPS ÉCOULÉ'
            : 'TIME UP'
          : finishLabel(state, language)}</strong
      ><span>{fr ? stage.nameFr : stage.nameEn}</span>
    </div>
    <div class="results-scoreboard" aria-label={fr ? 'Manches remportées' : 'Rounds won'}>
      {#each ['player', 'opponent'] as const as side (side)}
        <div class="results-fighter" class:won={winner === side}>
          <div>
            <span class="results-side"
              >{side === 'player' ? 'P1' : local ? 'P2' : fr ? 'PROCESSEUR' : 'CPU'}</span
            ><strong>{fighterDefinition(state[side].id).name}</strong>
          </div>
          <b>{state.roundsWon[side]}</b>
        </div>
      {/each}
    </div>
    <p class="results-score-label">{fr ? 'Manches remportées' : 'Rounds won'}</p>
    <div class="results-actions">
      <button
        bind:this={primary}
        type="button"
        class="results-primary"
        onclick={state.matchWinner ? onRematch : onContinue}
        ><span aria-hidden="true">{state.matchWinner ? '↻' : '→'}</span>{state.matchWinner
          ? fr
            ? 'Rejouer le duel'
            : 'Play again'
          : fr
            ? 'Manche suivante'
            : 'Next round'}</button
      >
      <button type="button" onclick={onChoose}
        >{fr ? 'Changer de personnage' : 'Change character'}<span aria-hidden="true">↗</span
        ></button
      >
      <button type="button" class="results-menu" onclick={onQuit}
        >{fr ? 'Revenir au menu' : 'Return to menu'}<span aria-hidden="true">→</span></button
      >
    </div>
    {#if !drawn}<details class="results-ceremony">
        <summary>{fr ? 'Réplique de victoire' : 'Victory line'}</summary><FightCeremony
          {state}
          {language}
        />
      </details>{/if}
  </div>
</section>

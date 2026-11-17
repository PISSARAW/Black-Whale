<script lang="ts">
  import type { FightReplayController } from '$lib/fighting/fightReplayController'
  import type { ReplayReviewActions } from '$lib/fighting/fightReplayReview'
  import FightReplayCoach from './FightReplayCoach.svelte'
  export let replays: FightReplayController
  export let actions: ReplayReviewActions
  export let language: 'fr' | 'en'
  $: fr = language === 'fr'
  $: playback = $replays.playback
</script>

{#if playback}
  <div class="review" aria-label={fr ? 'Analyser le replay' : 'Review replay'}>
    <label
      >{fr ? 'Position enregistrée' : 'Recorded position'}
      <input
        type="range"
        min="0"
        max={playback.packets}
        step="1"
        value={playback.packet}
        oninput={(event) => actions.seek(Number(event.currentTarget.value))}
      />
    </label>
    <span>{playback.packet} / {playback.packets}</span>
    <button
      type="button"
      disabled={playback.packet === 0 || playback.seeking}
      onclick={() => actions.seek(playback.packet - 1)}
      >{fr ? 'Pas précédent' : 'Previous step'}</button
    >
    <button
      type="button"
      disabled={playback.packet === playback.packets || playback.seeking}
      onclick={() => actions.seek(playback.packet + 1)}>{fr ? 'Pas suivant' : 'Next step'}</button
    >
    <button
      type="button"
      disabled={!playback.canPractice || playback.seeking || Boolean(playback.error)}
      onclick={actions.takeover}>{fr ? 'Reprendre le contrôle' : 'Take control'}</button
    >
    <p role="status">
      {playback.seeking
        ? fr
          ? 'Reconstruction et vérification en cours…'
          : 'Rebuilding and checking…'
        : fr
          ? 'Un pas suit un lot enregistré, qui peut contenir plusieurs frames ou seulement une commande.'
          : 'Each step follows a recorded batch, which can contain several frames or just a command.'}
    </p>
  </div>
{:else if $replays.practice}
  <div class="review" aria-label={fr ? 'Essai depuis le replay' : 'Replay rehearsal'}>
    <strong>{fr ? 'ESSAI LOCAL · P1 / P2 MANUELS' : 'LOCAL REHEARSAL · MANUAL P1 / P2'}</strong>
    <p>
      {fr
        ? 'Aucun résultat de carrière ni de classement. Les engagements et ressources viennent de l’état réel du replay.'
        : 'No career or ranking result. Commitments and resources come from the actual replay state.'}
    </p>
    <button type="button" onclick={actions.repeat}
      >{fr ? 'Répéter cet essai' : 'Repeat rehearsal'}</button
    >
    <button type="button" onclick={actions.returnToReplay}
      >{fr ? 'Retour à la relecture' : 'Return to replay'}</button
    >
  </div>
{/if}

{#if playback || $replays.practice}<FightReplayCoach {replays} {actions} {language} />{/if}

<style>
  .review {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    padding: 0.75rem 0;
    align-items: center;
  }
  label {
    display: grid;
    gap: 0.3rem;
    max-width: 100%;
    flex: 1 1 12rem;
  }
  input {
    width: 100%;
  }
  p {
    flex-basis: 100%;
    margin: 0;
    line-height: 1.5;
  }
  button {
    padding: 0.5rem;
    color: #eaf4ff;
    background: #243750;
    border: 1px solid #758aa8;
    font: inherit;
  }
  button:disabled {
    opacity: 0.45;
  }
</style>

<script lang="ts">
  import FightCounterplayHint from './FightCounterplayHint.svelte'
  import FightTrainingResources from './FightTrainingResources.svelte'
  import FightTrainingHistory from './FightTrainingHistory.svelte'
  import type { FightSide, FightState } from '$lib/fighting/types'
  import type {
    DummyBehavior,
    TrainingAction,
    TrainingPosition,
    TrainingResources,
    TrainingSettings,
  } from '$lib/fighting/trainingTypes'
  export let state: FightState
  export let language: 'fr' | 'en'
  export let paused: boolean
  export let onPause: () => void
  export let onStep: () => void
  export let onReset: (position: TrainingPosition) => void
  export let onResources: (side: FightSide, update: Partial<TrainingResources>) => void
  export let onDummy: (update: Partial<TrainingSettings['dummy']>) => void
  export let onRecord: () => void
  export let onPlay: () => void
  export let onLoop: (loop: boolean) => void
  $: lab = state.training!
  $: track = lab.recording
  const behaviors: [DummyBehavior, string, string][] = [
    ['manual', 'Manuel · P2', 'Manual · P2'],
    ['idle', 'Immobile', 'Idle'],
    ['guard', 'Garde haute', 'Standing guard'],
    ['guard-after-hit', 'Garde après la première touche', 'Guard after first hit'],
    ['random-guard', 'Garde aléatoire · confirmation', 'Random guard · hit confirm'],
    ['crouch-guard', 'Garde basse', 'Crouching guard'],
    ['jump', 'Saut répété', 'Repeated jump'],
    ['attack', 'Attaque répétée', 'Repeated attack'],
    ['reversal', 'Riposte après récupération', 'Reversal after recovery'],
  ]
  const actions: [TrainingAction, string, string][] = [
    ['light', 'Léger', 'Light'],
    ['heavy', 'Lourd', 'Heavy'],
    ['throw', 'Projection', 'Throw'],
    ['special', 'Hatsu', 'Hatsu'],
    ['ranged', 'Tir', 'Shot'],
    ['finisher', 'Ultime', 'Finisher'],
  ]
  const positions: [TrainingPosition, string, string][] = [
    ['center', 'Centre', 'Center'],
    ['left', 'Coin gauche', 'Left corner'],
    ['right', 'Coin droit', 'Right corner'],
  ]
</script>

<section
  class="training-tools"
  aria-label={language === 'fr' ? 'Laboratoire d’entraînement' : 'Training lab'}
  data-fight-scroll
>
  <header>
    <strong>{language === 'fr' ? 'LABORATOIRE' : 'TRAINING LAB'}</strong><span
      >F{state.frame} · 60 FPS</span
    >
  </header>
  <div class="toolbar">
    <button type="button" onclick={onPause}
      >{paused ? (language === 'fr' ? 'Reprendre' : 'Resume') : 'Pause'}</button
    >
    <button type="button" disabled={!paused} onclick={onStep}
      >{language === 'fr' ? 'Avancer de 1 frame' : 'Advance 1 frame'}</button
    >
    {#each positions as [position, fr, en] (position)}<button
        type="button"
        onclick={() => onReset(position)}>Reset · {language === 'fr' ? fr : en}</button
      >{/each}
  </div>
  <p>
    {language === 'fr'
      ? 'Les resets effacent les effets, copies et conditions de la manche. Les valeurs et l’enregistrement sont conservés.'
      : 'Resets clear round effects, copies and conditions. Settings and recording are retained.'}
  </p>
  <FightTrainingResources {state} {language} onChange={onResources} />
  <div class="dummy">
    <label
      >{language === 'fr' ? 'Mannequin' : 'Dummy'}
      <select
        aria-label={language === 'fr' ? 'Mannequin' : 'Dummy'}
        value={lab.settings.dummy.behavior}
        onchange={(event) => onDummy({ behavior: event.currentTarget.value as DummyBehavior })}
      >
        {#each behaviors as [value, fr, en] (value)}<option {value}
            >{language === 'fr' ? fr : en}</option
          >{/each}
      </select>
    </label>
    <label
      >{language === 'fr' ? 'Action' : 'Action'}
      <select
        value={lab.settings.dummy.action}
        onchange={(event) => onDummy({ action: event.currentTarget.value as TrainingAction })}
      >
        {#each actions as [value, fr, en] (value)}<option {value}
            >{language === 'fr' ? fr : en}</option
          >{/each}
      </select>
    </label>
    <label
      >{language === 'fr' ? 'Délai (frames)' : 'Delay (frames)'}
      <input
        type="number"
        min="0"
        max="120"
        value={lab.settings.dummy.delay}
        onchange={(event) => onDummy({ delay: Number(event.currentTarget.value) })}
      />
    </label>
  </div>
  <div class="toolbar">
    <button type="button" class:active={track.recording} onclick={onRecord}>
      {track.recording
        ? language === 'fr'
          ? 'Arrêter l’enregistrement'
          : 'Stop recording'
        : language === 'fr'
          ? 'Enregistrer P2'
          : 'Record P2'}
    </button>
    <button type="button" disabled={track.duration === 0 || track.recording} onclick={onPlay}>
      {track.playing
        ? language === 'fr'
          ? 'Relancer'
          : 'Restart'
        : language === 'fr'
          ? 'Lire'
          : 'Play'} · {track.duration}f
    </button>
    <label
      ><input
        type="checkbox"
        checked={track.loop}
        onchange={(event) => onLoop(event.currentTarget.checked)}
      />{language === 'fr' ? 'Boucle' : 'Loop'}</label
    >
  </div>
  <p>
    {language === 'fr'
      ? 'PV et aura fixes sont des aides de laboratoire. Les prérequis, sceaux, coûts et interruptions du Nen restent vérifiés.'
      : 'Fixed HP and aura are lab aids. Nen prerequisites, seals, costs and interruptions are still checked.'}
  </p>
  <FightCounterplayHint {state} {language} />
  <FightTrainingHistory history={lab.history} {language} />
</section>

<style>
  .training-tools {
    border: 1px solid #3c4d58;
    background: #09131b;
    color: #d8e5eb;
    padding: 0.8rem;
    font: 0.78rem/1.45 var(--font-mono);
    display: grid;
    gap: 0.7rem;
  }
  header,
  .toolbar,
  .dummy {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
    align-items: center;
  }
  header {
    justify-content: space-between;
    color: #f5d25c;
  }
  p {
    margin: 0;
    color: #a8bbc6;
  }
  label {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  button,
  select,
  input[type='number'] {
    color: #e7eef2;
    background: #14232e;
    border: 1px solid #52616a;
    padding: 0.5rem;
    border-radius: 3px;
    font: inherit;
    max-width: 100%;
  }
  button {
    cursor: pointer;
    min-height: 38px;
  }
  button:disabled {
    opacity: 0.45;
    cursor: default;
  }
  button.active {
    border-color: #f5d25c;
    color: #f5d25c;
  }
  input[type='number'] {
    width: 4.5rem;
  }
  select {
    min-width: 0;
  }
</style>

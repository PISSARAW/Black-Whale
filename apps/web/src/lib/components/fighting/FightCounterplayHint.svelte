<script lang="ts">
  import { readCounterplay } from '$lib/fighting/fightCounterplay'
  import { COUNTERPLAY_TEXT } from '$lib/fighting/counterplayText'
  import type { FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let language: 'fr' | 'en'
  let viewer: FightSide = 'player'
  $: cue = readCounterplay(state, viewer)
</script>

<details class="counterplay-hint" data-fight-scroll>
  <summary
    >{language === 'fr' ? 'Lire une ouverture perceptible' : 'Read a perceptible opening'}</summary
  >
  <label
    >{language === 'fr' ? 'Perception' : 'Perception'}
    <select
      aria-label={language === 'fr' ? 'Perception du contre-jeu' : 'Counterplay perception'}
      bind:value={viewer}
    >
      <option value="player">P1</option><option value="opponent">P2</option>
    </select>
  </label>
  <p>
    {cue
      ? COUNTERPLAY_TEXT[cue.kind][language === 'fr' ? 0 : 1]
      : language === 'fr'
        ? 'Aucune ouverture repérée avec les sens et le Nen actuels.'
        : 'No opening detected with the current senses and Nen.'}
  </p>
</details>

<style>
  .counterplay-hint {
    padding: 0.5rem 0;
    border-top: 1px solid #384850;
  }
  summary {
    cursor: pointer;
    color: #f5d25c;
  }
  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  p {
    color: #cadbe5;
    margin: 0.6rem 0;
    line-height: 1.5;
  }
  select {
    background: #14232e;
    color: #e7eef2;
    padding: 0.3rem;
    border: 1px solid #52616a;
  }
</style>

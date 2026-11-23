<script lang="ts">
  import FightFullscreenButton from './FightFullscreenButton.svelte'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import type { FightHudModePreference } from '$lib/fighting/perception/hudMode'
  import FightComfortSettings from './FightComfortSettings.svelte'
  export let language: 'fr' | 'en'
  export let comfort = defaultFightComfort()
  export let detailed = false
  export let hudScale = 1
  export let hudModePreference: FightHudModePreference = 'auto'
  export let controlMode = 'auto'
  export let target: HTMLElement | undefined
  $: fr = language === 'fr'
</script>

<div class="pause-display">
  <h3>{fr ? 'Affichage du combat' : 'Battle display'}</h3>
  <label
    ><span>{fr ? 'Perception du HUD' : 'HUD perception'}</span><select
      aria-label={fr ? 'Perception du HUD' : 'HUD perception'}
      bind:value={hudModePreference}
      ><option value="auto">{fr ? 'Auto (Tactique en combat)' : 'Auto (Tactical in combat)'}</option
      ><option value="tactical">{fr ? 'Tactique (HxH)' : 'Tactical (HxH)'}</option><option
        value="omniscient">{fr ? 'Omniscient (Complet)' : 'Omniscient (Full)'}</option
      ></select
    ></label
  >
  <label
    ><span>{fr ? 'Taille du HUD' : 'HUD size'}</span><select
      aria-label={fr ? 'Taille du HUD' : 'HUD size'}
      bind:value={hudScale}
      ><option value={1}>100 %</option><option value={1.15}>115 %</option><option value={1.3}
        >130 %</option
      ></select
    ></label
  >
  <label
    ><span>{fr ? 'Commandes tactiles' : 'Touch controls'}</span><select
      aria-label={fr ? 'Commandes tactiles' : 'Touch controls'}
      bind:value={controlMode}
      ><option value="auto">Auto</option><option value="on">{fr ? 'Afficher' : 'Show'}</option
      ><option value="off">{fr ? 'Masquer' : 'Hide'}</option></select
    ></label
  >
  <label class="checkbox"
    ><input type="checkbox" bind:checked={detailed} /><span
      >{fr
        ? 'Afficher les mesures et détails tactiques pendant le combat'
        : 'Show measurements and tactical details during the fight'}</span
    ></label
  >
  <FightComfortSettings bind:comfort {language} />
  <FightFullscreenButton {language} {target} />
</div>

<style>
  .pause-display {
    display: grid;
    gap: 1rem;
  }
  h3 {
    margin: 0;
    color: #e8d4f4;
    font: 700 0.85rem var(--font-mono);
  }
  label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    color: #c4b1d2;
    font: 0.75rem/1.5 var(--font-mono);
  }
  .checkbox {
    justify-content: flex-start;
  }
  input {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    accent-color: #ff864b;
  }
  select {
    min-height: 44px;
    padding: 0.5rem;
    border: 1px solid #725587;
    background: #271831;
    color: #f3e6fb;
    font: inherit;
  }
</style>

<script lang="ts">
  import type { FightControls } from '../../../routes/fighting/fightingControls'
  import type { ControlScheme } from '$lib/fighting/controlScheme'
  export let controls: FightControls
  export let language: 'fr' | 'en'
  const { scheme } = controls
  const fr = language === 'fr'
  const OPTIONS: readonly [ControlScheme, string, string][] = [
    [
      'classic',
      fr ? 'Classique' : 'Classic',
      fr
        ? 'Les supers des combattants à grammaire demandent un quart de cercle avant (↓ ↘ → + spécial). Dégâts pleins.'
        : 'Grammar fighters’ supers need a quarter-circle forward (↓ ↘ → + special). Full damage.',
    ],
    [
      'simplified',
      fr ? 'Simplifié' : 'Simplified',
      fr
        ? 'La commande directe actuelle reste valable, avec 10 % de dégâts en moins sur ces supers.'
        : 'The current direct command keeps working, with 10% less damage on these supers.',
    ],
  ]
</script>

<fieldset class="control-scheme">
  <legend>{fr ? 'Schéma de commande' : 'Command scheme'}</legend>
  {#each OPTIONS as [value, label, detail] (value)}
    <label>
      <input
        type="radio"
        name="control-scheme"
        {value}
        checked={$scheme === value}
        onchange={() => controls.saveScheme(value)}
      />
      <span><strong>{label}</strong> · {detail}</span>
    </label>
  {/each}
  <p>
    {fr
      ? 'Les commandes tactiles utilisent toujours le schéma simplifié. Le choix s’applique au prochain combat.'
      : 'Touch controls always use the simplified scheme. The choice applies from the next fight.'}
  </p>
</fieldset>

<style>
  .control-scheme {
    display: grid;
    gap: 0.35rem;
    margin: 0 0 0.75rem;
    border: 1px solid rgb(168 186 197 / 35%);
    padding: 0.5rem 0.7rem;
  }
  .control-scheme label {
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
  }
  .control-scheme p {
    margin: 0;
    font-size: 0.75rem;
    opacity: 0.8;
  }
</style>

<script lang="ts">
  import type { FightSide, FightState } from '$lib/fighting/types'
  import type { TrainingResources } from '$lib/fighting/trainingTypes'
  export let state: FightState
  const sides = ['player', 'opponent'] as const
  export let language: 'fr' | 'en'
  export let onChange: (side: FightSide, update: Partial<TrainingResources>) => void
</script>

<div class="resources">
  {#each sides as side, index (side)}
    {@const setting = state.training!.settings.resources[side]}
    <fieldset>
      <legend>P{index + 1} · {language === 'fr' ? 'Ressources' : 'Resources'}</legend>
      <label
        >{language === 'fr' ? 'PV de départ' : 'Starting HP'}
        <input
          aria-label={`P${index + 1} HP`}
          type="number"
          min="1"
          max={state[side].maxHealth}
          value={setting.health}
          onchange={(event) => onChange(side, { health: Number(event.currentTarget.value) })}
        />
      </label>
      <label
        >Aura
        <input
          aria-label={`P${index + 1} aura`}
          type="number"
          min="0"
          max="100"
          value={setting.aura}
          onchange={(event) => onChange(side, { aura: Number(event.currentTarget.value) })}
        />
      </label>
      <label
        ><input
          type="checkbox"
          checked={setting.infiniteHealth}
          onchange={(event) => onChange(side, { infiniteHealth: event.currentTarget.checked })}
        />
        {language === 'fr' ? 'PV fixes' : 'Fixed HP'}</label
      >
      <label
        ><input
          type="checkbox"
          checked={setting.infiniteAura}
          onchange={(event) => onChange(side, { infiniteAura: event.currentTarget.checked })}
        />
        {language === 'fr' ? 'Aura fixe' : 'Fixed aura'}</label
      >
    </fieldset>
  {/each}
</div>

<style>
  .resources {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 0.65rem;
  }
  fieldset {
    min-width: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    border: 1px solid #384850;
    padding: 0.65rem;
  }
  legend {
    color: #f5d25c;
  }
  label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  input[type='number'] {
    width: 4.5rem;
    padding: 0.35rem;
    background: #0b151c;
    color: white;
    border: 1px solid #52616a;
  }
</style>

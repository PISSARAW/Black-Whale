<script lang="ts">
  import type { FightEnvironment } from '$lib/fighting/fightEnvironment'
  import type { FightSide } from '$lib/fighting/types'

  export let environment: FightEnvironment
  export let language: 'fr' | 'en'
  export let onChange: (environment: FightEnvironment) => void

  function toggleIntruder(side: FightSide, checked: boolean) {
    onChange({
      ...environment,
      unlawfulIntruders: { ...environment.unlawfulIntruders, [side]: checked },
    })
  }
</script>

<fieldset>
  <legend>{language === 'fr' ? 'Juridiction de la planque' : 'Hideout jurisdiction'}</legend>
  <label>
    <input
      type="checkbox"
      checked={environment.morenaPresent}
      onchange={(event) => onChange({ ...environment, morenaPresent: event.currentTarget.checked })}
    />
    {language === 'fr' ? 'Morena présente dans la planque' : 'Morena present in the hideout'}
  </label>
  {#each ['player', 'opponent'] as side, index (side)}
    <label>
      <input
        type="checkbox"
        checked={environment.unlawfulIntruders[side as FightSide]}
        onchange={(event) => toggleIntruder(side as FightSide, event.currentTarget.checked)}
      />
      {language === 'fr'
        ? `Combattant ${index + 1} : intrus en infraction`
        : `Fighter ${index + 1}: unlawful intruder`}
    </label>
  {/each}
  <p>
    {language === 'fr'
      ? 'LSDF exige ces conditions. L présente Yokotani à l’intrus et invoque les gardes. Ils l’expulsent sans dégâts ; Yokotani reste vulnérable.'
      : 'LSDF requires these conditions. L introduces Yokotani to the intruder and summons the guards. They expel without damage; Yokotani remains vulnerable.'}
  </p>
</fieldset>

<style>
  fieldset {
    display: grid;
    gap: 0.65rem;
    margin: 1rem 0;
    border: 1px solid #655a39;
    padding: 0.9rem;
    color: #d4d9db;
    font: 500 0.75rem/1.5 var(--font-mono);
  }
  legend {
    color: #f1d36d;
  }
  label {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  input {
    accent-color: #c7952d;
  }
  p {
    margin: 0;
    color: #a8bac5;
  }
</style>

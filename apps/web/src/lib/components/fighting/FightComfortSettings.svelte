<script lang="ts">
  import { onMount } from 'svelte'
  import {
    defaultFightComfort,
    effectiveFightComfort,
    readFightComfort,
    saveFightComfort,
    type FightComfort,
  } from '$lib/fighting/fightComfort'
  export let comfort = defaultFightComfort()
  export let language: 'fr' | 'en'
  let preference = defaultFightComfort()
  let reducedMotion = false
  let storage: Storage | undefined
  function update(patch: Partial<FightComfort>) {
    preference = { ...preference, ...patch }
    saveFightComfort(preference, storage)
  }
  $: comfort = effectiveFightComfort(preference, reducedMotion)
  onMount(() => {
    try {
      storage = window.localStorage
    } catch {
      /* Keep session controls available. */
    }
    preference = readFightComfort(storage)
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      reducedMotion = query.matches
    }
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  })
</script>

<fieldset>
  <legend>{language === 'fr' ? 'Confort visuel' : 'Visual comfort'}</legend>
  <label
    >{language === 'fr' ? 'Secousses' : 'Camera shake'}
    <select
      aria-label={language === 'fr' ? 'Secousses' : 'Camera shake'}
      value={comfort.shake}
      disabled={reducedMotion}
      onchange={(event) =>
        update({ shake: Number(event.currentTarget.value) as FightComfort['shake'] })}
    >
      <option value={0}>{language === 'fr' ? 'Aucune' : 'None'}</option>
      <option value={0.5}>50 %</option><option value={1}>100 %</option>
    </select>
  </label>
  <label
    ><input
      type="checkbox"
      checked={comfort.flashes}
      disabled={reducedMotion}
      onchange={(event) => update({ flashes: event.currentTarget.checked })}
    />{language === 'fr' ? 'Flashs d’impact' : 'Impact flashes'}</label
  >
  <label
    ><input
      type="checkbox"
      checked={comfort.highContrast}
      onchange={(event) => update({ highContrast: event.currentTarget.checked })}
    />{language === 'fr' ? 'Contraste renforcé' : 'Higher contrast'}</label
  >
  {#if reducedMotion}<small
      >{language === 'fr'
        ? 'Animation réduite du système : secousses et flashs désactivés.'
        : 'System reduced motion: shake and impact flashes disabled.'}</small
    >{/if}
</fieldset>

<style>
  fieldset {
    display: grid;
    gap: 0.7rem;
    min-width: 0;
    border: 1px solid #526878;
  }
  label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.7rem;
  }
  select {
    min-height: 44px;
    background: #172732;
    color: white;
    border: 1px solid #647482;
    padding: 0.3rem;
  }
  input {
    width: 1.1rem;
    height: 1.1rem;
    accent-color: #d9b650;
  }
  small {
    line-height: 1.5;
  }
</style>

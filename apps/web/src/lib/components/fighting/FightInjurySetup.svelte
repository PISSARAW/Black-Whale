<script lang="ts">
  import type { FightSide } from '$lib/fighting/types'
  import type { InjuryPreparation } from '$lib/fighting/injuryPreparation'
  import { limbInjury, surfaceInjury } from '$lib/fighting/injuryPreparation'
  import { selectInjury } from '$lib/fighting/injurySelection'

  export let injuries: InjuryPreparation = {}
  export let language: 'fr' | 'en'
  export let onChange: (injuries: InjuryPreparation) => void

  function toggle(side: FightSide, checked: boolean) {
    onChange(selectInjury({ injuries, side, group: 'limbs', checked }))
  }
</script>

<fieldset>
  <legend
    >{language === 'fr' ? 'Blessures physiques initiales' : 'Initial physical injuries'}</legend
  >
  {#each ['player', 'opponent'] as side, index (side)}
    <label
      ><input
        type="checkbox"
        checked={limbInjury(injuries[side as FightSide])}
        onchange={(event) => toggle(side as FightSide, event.currentTarget.checked)}
      />
      {language === 'fr'
        ? `P${index + 1} : main gauche et bas de la jambe droite endommagés`
        : `P${index + 1}: damaged left hand and lower right leg`}</label
    >
    <label
      ><input
        type="checkbox"
        checked={surfaceInjury(injuries[side as FightSide])}
        onchange={(event) =>
          onChange(
            selectInjury({
              injuries,
              side: side as FightSide,
              group: 'surfaces',
              checked: event.currentTarget.checked,
            }),
          )}
      />
      {language === 'fr'
        ? `P${index + 1} : tissus superficiels du visage et du cou endommagés`
        : `P${index + 1}: damaged facial and neck surface tissue`}</label
    >
  {/each}
  <p>
    {language === 'fr'
      ? 'Prémisse du scénario, inspirée des blessures d’Hisoka au chapitre 357. Elle ne fournit ni prothèse, ni soin, ni pouvoir supplémentaire.'
      : 'Scenario premise based on Hisoka’s injuries in chapter 357. It supplies no prosthesis, healing or additional power.'}
  </p>
</fieldset>

<style>
  fieldset {
    display: grid;
    gap: 0.4rem;
    min-width: 0;
    border: 1px solid #405360;
  }
  label {
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
  }
  input {
    accent-color: #e7ca7c;
  }
  p {
    margin: 0;
    color: #aabfc9;
  }
</style>

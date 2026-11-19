<script lang="ts">
  import { nenMasteryProfile } from '$lib/fighting/nenMastery'
  import { nenCombatDoctrine } from '$lib/fighting/nenCombatDoctrine'
  import type { ArcadeFighter } from '$lib/fighting/types'
  export let fighter: ArcadeFighter
  export let language: 'fr' | 'en'
  const labels = {
    enhancer: ['Renforcement', 'Enhancement'],
    emitter: ['Émission', 'Emission'],
    transmuter: ['Transformation', 'Transmutation'],
    conjurer: ['Matérialisation', 'Conjuration'],
    manipulator: ['Manipulation', 'Manipulation'],
    specialist: ['Spécialisation', 'Specialization'],
    unknown: ['Non établie', 'Unconfirmed'],
  }
  $: locale = language === 'fr' ? 0 : 1
  $: profile = nenMasteryProfile(fighter.nenOwner ?? fighter.id)
  $: doctrine = nenCombatDoctrine(fighter)
</script>

<details>
  <summary>{language === 'fr' ? 'Mon profil de Nen' : 'My Nen profile'}</summary>
  <p>{language === 'fr' ? 'Affinité' : 'Affinity'} : {labels[profile.affinity][locale]}</p>
  <dl>
    {#each Object.entries(profile.training) as [category, training] (category)}
      <dt>{labels[category as keyof typeof labels][locale]}</dt>
      <dd>
        {training.level === 2
          ? language === 'fr'
            ? 'Application répertoriée'
            : 'Catalogued application'
          : training.level === 1
            ? language === 'fr'
              ? 'Fondamentaux du duel'
              : 'Duel fundamentals'
            : language === 'fr'
              ? 'Maîtrise non établie'
              : 'Training unconfirmed'}
      </dd>
    {/each}
  </dl>
  <p>
    {language === 'fr' ? 'Distance recherchée par l’IA' : 'AI preferred distance'} :
    {doctrine.range[0] >= 14
      ? language === 'fr'
        ? 'Longue distance'
        : 'Long range'
      : doctrine.range[0] >= 8
        ? language === 'fr'
          ? 'Distance intermédiaire'
          : 'Mid range'
        : language === 'fr'
          ? 'Corps à corps'
          : 'Close range'}
  </p>
  {#if fighter.nenBudget}
    <p>
      {language === 'fr' ? 'Débit disponible' : 'Available output'} : {Math.round(
        fighter.nenBudget.available,
      )} / {fighter.nenBudget.capacity}
    </p>
  {/if}
  {#if fighter.nenTransfer}
    <p>{language === 'fr' ? 'Répartition en cours' : 'Aura transfer in progress'}</p>
    <progress max={fighter.nenTransfer.duration} value={fighter.nenTransfer.age}></progress>
  {/if}
</details>

<style>
  summary {
    cursor: pointer;
    padding: 0.5rem 0;
  }
  dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.3rem 0.7rem;
    font-size: 0.8rem;
  }
  dd {
    margin: 0;
  }
  p {
    font-size: 0.8rem;
  }
</style>

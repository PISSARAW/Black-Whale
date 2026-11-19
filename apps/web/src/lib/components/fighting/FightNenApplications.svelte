<script lang="ts">
  import FightHeldButton from './FightHeldButton.svelte'
  import FightNenTraining from './FightNenTraining.svelte'
  import { nenApplications, type NenApplication } from '$lib/fighting/nenApplications'
  import type { ArcadeFighter, FightInput } from '$lib/fighting/types'
  export let fighter: ArcadeFighter
  export let language: 'fr' | 'en'
  export let onControl: (key: keyof FightInput, held: boolean) => void
  $: applications = nenApplications(fighter)
  function hold(application: NenApplication, active: boolean) {
    for (const input of application.inputs) onControl(input, active)
  }
</script>

<details>
  <summary>{language === 'fr' ? 'Applications du Nen' : 'Nen applications'}</summary>
  {#each applications as application (application.id)}
    <div>
      <FightHeldButton
        disabled={!application.available}
        onHold={(active) => hold(application, active)}
        label={application.condition[language === 'fr' ? 0 : 1]}
      >
        {application.label[language === 'fr' ? 0 : 1]}
      </FightHeldButton>
      <p>{application.condition[language === 'fr' ? 0 : 1]}</p>
    </div>
  {/each}
  <FightNenTraining {fighter} {language} />
</details>

<style>
  details {
    flex-basis: 100%;
  }
  summary {
    cursor: pointer;
    padding: 0.5rem 0;
  }
  p {
    font-size: 0.8rem;
    margin: 0.25rem 0 0.65rem;
    max-width: 50ch;
  }
</style>

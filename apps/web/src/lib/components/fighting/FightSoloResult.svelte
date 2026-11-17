<script lang="ts">
  import { SOLO_ROUTES, encounterIds } from '$lib/fighting/solo/catalogue'
  import type { SoloController } from '$lib/fighting/solo/controller'
  export let controller: SoloController
  export let language: 'fr' | 'en'
  $: run = $controller.session?.run
  $: fr = language === 'fr'
  $: route = SOLO_ROUTES.find((r) => r.id === run?.route)
  const failures = {
    defeat: ['Le corps ou sa protection n’a pas tenu.', 'The body or its protection did not hold.'],
    timeout: ['Le temps imparti est écoulé.', 'The time limit expired.'],
    'object-lost': ['La caisse à protéger a été perdue.', 'The protected crate was lost.'],
    objective: [
      'La manche s’est terminée sans accomplir l’objectif.',
      'The round ended without fulfilling the objective.',
    ],
    invalid: [
      'La session ne correspond plus au scénario.',
      'The session no longer matches the scenario.',
    ],
  }
</script>

{#if run}<section class="solo-result" aria-label={fr ? 'Résultat solo' : 'Solo result'}>
    <h2>
      {run.status === 'won'
        ? fr
          ? 'Objectif accompli'
          : 'Objective complete'
        : run.status === 'complete'
          ? fr
            ? 'Session terminée'
            : 'Session complete'
          : fr
            ? 'Tentative terminée'
            : 'Attempt ended'}
    </h2>
    {#if run.failure}<p role="status">{failures[run.failure][fr ? 0 : 1]}</p>{/if}
    <p>
      {run.results.length}/{encounterIds(run).length} · {fr
        ? 'Objectifs réussis'
        : 'Objectives cleared'} · {run.score}
      {fr ? 'points' : 'points'} · {(run.elapsed / 60).toFixed(1)} s
    </p>
    {#if run.status === 'complete' && run.mode === 'story' && route}<p class="ending">
        {route.ending[fr ? 0 : 1]}
      </p>
      <p>
        {fr ? 'Titre local débloqué' : 'Local title unlocked'} :
        <strong>{route.reward[fr ? 0 : 1]}</strong>
      </p>{/if}
    {#if run.status === 'won'}<button type="button" onclick={() => controller.next()}
        >{fr ? 'Rencontre suivante' : 'Next encounter'}</button
      >{/if}
    {#if run.status === 'failed' && run.mode === 'story'}<button
        type="button"
        onclick={() => controller.retry()}
        >{fr ? 'Réessayer la rencontre' : 'Retry encounter'}</button
      >{/if}
    <button type="button" onclick={() => controller.leave()}
      >{fr ? 'Retour aux parcours' : 'Back to routes'}</button
    >
    <p>
      {fr
        ? 'Les points et titres sont locaux. Ils ne changent ni corps, aura, équipement ou conditions de Nen.'
        : 'Points and titles are local. They change neither body, aura, equipment nor Nen conditions.'}
    </p>
  </section>{/if}

<style>
  section {
    padding: 1rem;
    border: 1px solid #7892a4;
    margin: 1rem 0;
    min-width: 0;
  }
  p {
    line-height: 1.6;
    overflow-wrap: anywhere;
  }
  .ending {
    padding: 1rem;
    background: #142e3e;
  }
  button {
    min-height: 44px;
    max-width: 100%;
    box-sizing: border-box;
    padding: 0.6rem;
    font: inherit;
    background: #193449;
    color: #edf4f8;
    border: 1px solid #7892a4;
    margin: 0.5rem 0.5rem 0.5rem 0;
    cursor: pointer;
  }
</style>

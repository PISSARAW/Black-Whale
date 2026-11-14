<script lang="ts">
  import type { NenCategory } from '@black-whale/domain'
  import type { TourSimulationV1 } from '$lib/tour/simulation/state'
  import {
    actionsForNenTarget,
    configurePilotNenProfile,
    previewTourNenAction,
  } from '$lib/tour/simulation/categoryAbilities'
  import {
    executeTourNenAction,
    prepareNenTarget,
  } from '$lib/tour/simulation/executeCategoryAction'
  import { targetsInNenSpace } from '$lib/tour/simulation/nenEnvironment'

  let {
    simulation,
    spaceId,
    french,
    onChange,
  }: {
    simulation: TourSimulationV1
    spaceId: string | null
    french: boolean
    onChange: (state: TourSimulationV1) => void
  } = $props()

  const affinities: NenCategory[] = [
    'enhancer',
    'emitter',
    'transmuter',
    'conjurer',
    'manipulator',
    'specialist',
  ]
  const targets = $derived(spaceId ? targetsInNenSpace(simulation, spaceId) : [])
  const choose = (affinity: NenCategory) => onChange(configurePilotNenProfile(simulation, affinity))
  const mark = (targetId: string) => onChange(prepareNenTarget(simulation, targetId))
  const use = (actionId: Parameters<typeof executeTourNenAction>[1], targetId: string) =>
    onChange(executeTourNenAction(simulation, actionId, { targetId, distance: 1 }).state)
</script>

<aside class="nen-panel" aria-label={french ? 'Profil Nen' : 'Nen profile'}>
  <header>
    <strong>{french ? 'Nen du visiteur' : 'Visitor Nen'}</strong>
    <span>{simulation.player.aura} aura</span>
  </header>
  {#if simulation.player.nenProfile.naturalAffinity === 'unknown'}
    <p>{french ? 'Choisir une affinité de simulation' : 'Choose a simulation affinity'}</p>
    <div class="affinities">
      {#each affinities as affinity (affinity)}
        <button onclick={() => choose(affinity)}>{affinity}</button>
      {/each}
    </div>
  {:else}
    <p class="affinity">{simulation.player.nenProfile.naturalAffinity}</p>
    {#each targets as target (target.id)}
      <section>
        <b>{target.label}</b>
        {#if ['object', 'device'].includes(target.kind) && target.markedBy !== simulation.id}
          <button onclick={() => mark(target.id)}
            >{french ? 'Marquer · 2 aura' : 'Mark · 2 aura'}</button
          >
        {/if}
        {#each actionsForNenTarget(simulation, target.id) as actionId (actionId)}
          {@const preview = previewTourNenAction(simulation, actionId, {
            targetId: target.id,
            distance: 1,
          })}
          <button disabled={!preview.accepted} onclick={() => use(actionId, target.id)}>
            {actionId} · {preview.cost} aura
            {#if !preview.accepted}
              · {preview.reason}{/if}
          </button>
        {/each}
      </section>
    {/each}
    {#if simulation.player.nenProfile.maintainedEffects.length}
      <small>
        {simulation.player.nenProfile.maintainedEffects.length}
        {french ? ' effet(s) maintenu(s)' : ' maintained effect(s)'}
      </small>
    {/if}
  {/if}
</aside>

<style>
  .nen-panel {
    position: fixed;
    right: 1rem;
    bottom: 1rem;
    z-index: 80;
    width: min(22rem, calc(100vw - 2rem));
    max-height: 45vh;
    overflow: auto;
    border: 1px solid rgb(167 139 250 / 0.45);
    border-radius: 0.75rem;
    background: rgb(10 8 20 / 0.92);
    color: white;
    padding: 0.75rem;
    font-size: 0.75rem;
    backdrop-filter: blur(12px);
  }
  header,
  .affinities {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
  }
  p {
    margin: 0.45rem 0;
    color: rgb(221 214 254);
  }
  .affinity {
    text-transform: capitalize;
    font-weight: 700;
  }
  section {
    display: grid;
    gap: 0.35rem;
    padding: 0.55rem 0;
    border-top: 1px solid rgb(255 255 255 / 0.12);
  }
  button {
    min-height: 2rem;
    border-radius: 0.4rem;
    background: rgb(91 33 182 / 0.65);
    padding: 0.3rem 0.5rem;
    text-align: left;
  }
  button:disabled {
    cursor: not-allowed;
    opacity: 0.48;
  }
  small {
    color: rgb(196 181 253);
  }
</style>

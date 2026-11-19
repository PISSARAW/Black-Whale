<script lang="ts">
  import { luiniPhasePresentation } from '$lib/fighting/luiniPresentation'
  import {
    visiblePreparationCheck,
    REQUIREMENT_LABELS,
    ENTITY_LABELS,
  } from '$lib/fighting/preparationPresentation'
  import { preparationInteractionTarget } from '$lib/fighting/preparationSimulation'
  import { controlledEntities } from '$lib/fighting/preparationActions'
  import { liveEntity } from '$lib/fighting/preparationWorld'
  import type { FightState, FightSide, FightInput } from '$lib/fighting/types'
  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  export let onControl: (key: keyof FightInput, active: boolean) => void = () => {}
  $: report = visiblePreparationCheck(state, side)
  $: controlled = controlledEntities(state, side).filter(liveEntity)
  $: nearby = preparationInteractionTarget(state, side)
  $: luini = report.source === 'luini' ? luiniPhasePresentation(state, side, language) : null
  $: completed = state.battlefield?.completed[side] ?? 0
</script>

<div class="preparation-status">
  {#if luini}<span>{luini.status}</span><span>{luini.hint}</span>{/if}
  {#each report.requirements as requirement (requirement.id)}
    <span class:missing={!requirement.satisfied}
      >{requirement.satisfied ? '✓' : '—'} {REQUIREMENT_LABELS[language][requirement.id]}</span
    >
  {/each}
  {#each controlled as entity (entity.id)}
    <span
      >{ENTITY_LABELS[language][entity.kind]} · {entity.controller?.source === 'sayird'
        ? language === 'fr'
          ? 'Vue et ouïe relayées'
          : 'Sight and hearing relayed'
        : language === 'fr'
          ? 'Livraison en cours'
          : 'Delivery in progress'}</span
    >
    {#if entity.controller?.source === 'sayird'}
      {#if Math.abs(entity.x - state[side === 'player' ? 'opponent' : 'player'].x) <= 24}
        <span
          >{language === 'fr' ? 'Observation distante' : 'Remote observation'} · x {Math.round(
            state[side === 'player' ? 'opponent' : 'player'].x,
          )}</span
        >
      {:else}<span
          >{language === 'fr'
            ? 'Aucune cible dans le champ de l’animal'
            : 'No target within the animal’s sight'}</span
        >{/if}
    {/if}
  {/each}
  {#if completed}<span
      >{language === 'fr' ? 'Actions de soutien accomplies' : 'Completed support actions'} : {completed}</span
    >{/if}
  {#if state.mode === 'versus-local' || side === 'player'}
    {#if state.arena || state.environment.preparation?.mode === 'scenario'}
      <button
        type="button"
        onpointerdown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          onControl('interact', true)
        }}
        onpointerup={() => onControl('interact', false)}
        onpointercancel={() => onControl('interact', false)}
        onlostpointercapture={() => onControl('interact', false)}
        onkeydown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            event.stopPropagation()
            onControl('interact', true)
          }
        }}
        onkeyup={(event) => {
          event.stopPropagation()
          onControl('interact', false)
        }}
        onblur={() => onControl('interact', false)}
      >
        <kbd>{side === 'player' ? '6' : '='}</kbd>
        {nearby
          ? ENTITY_LABELS[language][nearby.kind]
          : language === 'fr'
            ? 'Aucune interaction à portée'
            : 'No interaction in range'}
      </button>
      <small
        >{language === 'fr'
          ? 'Pousser une caisse · ramasser l’équipement · ouvrir une porte · demander le retrait d’un partisan.'
          : 'Push a crate · pick up equipment · open a door · ask a supporter to withdraw.'}</small
      >
    {/if}
  {/if}
</div>

<style>
  .preparation-status {
    display: grid;
    gap: 0.25rem;
    color: #b8d7c5;
    overflow-wrap: anywhere;
  }
  .missing {
    color: #f3b49a;
  }
  small {
    color: #a5b9c5;
  }
  button {
    min-height: 44px;
    padding: 0.4rem 0.7rem;
    background: #172b32;
    border: 1px solid #66818c;
    color: #ecf5fa;
    font: inherit;
    touch-action: none;
  }
  kbd {
    color: #e7ca7c;
  }
</style>

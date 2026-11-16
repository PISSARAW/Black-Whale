<script lang="ts">
  import { movesetFor } from '$lib/fighting/movesets'
  import { fighterDefinition } from '$lib/fighting/roster'
  import { styleMatchup } from '$lib/fighting/styleMatchups'
  import { useFightBindings, moveInputHint } from '$lib/fighting/fightControlHints'
  import { combatRoutesFor } from '$lib/fighting/combatRoutes'
  import type { FighterId } from '$lib/fighting/types'
  export let fighterId: FighterId
  export let language: 'fr' | 'en'
  const bindings = useFightBindings()
  $: fr = language === 'fr'
  $: definition = fighterDefinition(fighterId)
  $: moveset = movesetFor(fighterId)
  $: matchup = styleMatchup(fighterId)
  $: routes = combatRoutesFor(fighterId)
</script>

{#if moveset}
  {#key fighterId}
    <details class="fighter-dossier" data-fighter-dossier={fighterId}>
      <summary>{fr ? 'Techniques et contre-jeu' : 'Techniques and counterplay'}</summary>
      <p class="identity">{fr ? definition.titleFr : definition.titleEn}</p>
      <dl>
        <dt>{fr ? 'Plan de jeu' : 'Game plan'}</dt>
        <dd>{matchup.plan[fr ? 0 : 1]}</dd>
        <dt>{fr ? 'Pouvoir et conditions' : 'Ability and conditions'}</dt>
        <dd>{moveInputHint(fr ? moveset.mechanicFr : moveset.mechanicEn, $bindings)}</dd>
        <dt>{fr ? 'Contre-jeu' : 'Counterplay'}</dt>
        <dd>{matchup.counter[fr ? 0 : 1]}</dd>
      </dl>
      <p class="training">
        {fr
          ? `${routes.length} routes, démonstrations et exercice de défense dans l’Académie.`
          : `${routes.length} routes, demonstrations and a defense exercise in the Academy.`}
      </p>
    </details>
  {/key}
{/if}

<style>
  .fighter-dossier {
    margin-top: 0.9rem;
    padding-top: 0.8rem;
    border-top: 1px solid #655071;
    font: 0.72rem/1.65 var(--font-body, sans-serif);
    color: #d0c6d6;
    overflow-wrap: anywhere;
  }
  summary {
    cursor: pointer;
    color: #f3d28e;
    font-weight: 700;
  }
  .identity {
    color: #a99bb5;
    margin: 0.8rem 0;
  }
  dl {
    margin: 0;
  }
  dt {
    color: #f2e7f8;
    font-weight: 700;
    margin-top: 0.65rem;
  }
  dd {
    margin: 0.15rem 0 0;
  }
  .training {
    margin: 0.8rem 0 0;
    color: #a99bb5;
  }
</style>

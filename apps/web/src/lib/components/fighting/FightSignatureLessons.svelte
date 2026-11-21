<script lang="ts">
  import type { CombatFighter } from '$lib/fighting/combatRoutes'
  import { ACADEMY_SIGNATURES } from '$lib/fighting/signatureSchool'
  import { signatureRouteText } from '$lib/fighting/signatureLessonText'
  import { useFightBindings } from '$lib/fighting/fightControlHints'
  export let fighter: CombatFighter
  export let language: 'fr' | 'en'
  export let onLaunch: (id: string, demo: boolean) => void
  const bindings = useFightBindings()
  $: index = (language === 'fr' ? 0 : 1) as 0 | 1
  $: combos = ACADEMY_SIGNATURES.filter((combo) => combo.fighter === fighter)
</script>

{#if combos.length}
  <fieldset>
    <legend>{language === 'fr' ? 'Combos signature' : 'Signature combos'}</legend>
    <p>
      {language === 'fr'
        ? 'Un seul compteur, du premier coup à la technique finale. Les accélérations et les commandes de Hatsu sont des étapes : la route échoue dès que la cible peut se défendre.'
        : 'One combo counter, from the first hit to the final technique. Accélérations and Hatsu commands are steps: the route fails as soon as the target can defend.'}
    </p>
    <ol>
      {#each combos as combo (combo.id)}
        <li>
          <strong>{combo.title[index]}</strong>
          <p class="route">{signatureRouteText(combo, { language: index, bindings: $bindings })}</p>
          <p>{combo.requirement[index]}</p>
          <div class="actions">
            <button type="button" onclick={() => onLaunch(combo.id, false)}
              >{language === 'fr' ? 'Pratiquer' : 'Practice'} · {combo.title[index]}</button
            >
            <button type="button" onclick={() => onLaunch(combo.id, true)}
              >{language === 'fr' ? 'Démontrer' : 'Demonstrate'} · {combo.title[index]}</button
            >
          </div>
        </li>
      {/each}
    </ol>
  </fieldset>
{/if}

<style>
  p {
    margin: 0.4rem 0;
  }
  .route {
    font-weight: 700;
    color: #a7dcff;
    overflow-wrap: anywhere;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0.4rem 0;
  }
  button {
    min-height: 44px;
    max-width: 100%;
    padding: 0.5rem;
    border: 1px solid #718b9e;
    background: #172c3c;
    color: white;
    font: inherit;
    cursor: pointer;
    white-space: normal;
    text-align: left;
  }
  ol {
    padding-left: 1.3rem;
  }
  li {
    margin: 0.8rem 0;
  }
</style>

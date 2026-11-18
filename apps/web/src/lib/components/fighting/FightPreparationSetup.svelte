<script lang="ts">
  import { createFightState } from '$lib/fighting/fightState'
  import FightInjurySetup from './FightInjurySetup.svelte'
  import { EMPTY_PREPARATION } from '$lib/fighting/preparationWorld'
  import { REQUIREMENT_LABELS } from '$lib/fighting/preparationPresentation'
  import { preparationCheck } from '$lib/fighting/preparationRequirements'
  import { fighterDefinition } from '$lib/fighting/roster'
  import type { FightEnvironment } from '$lib/fighting/fightEnvironment'
  import type { FightPreparation, PreparationResource } from '$lib/fighting/preparationTypes'
  import type { FighterId, FightSide } from '$lib/fighting/types'

  export let environment: FightEnvironment
  export let player: FighterId
  export let opponent: FighterId
  export let language: 'fr' | 'en'
  export let onChange: (environment: FightEnvironment) => void
  $: preparation = environment.preparation ?? EMPTY_PREPARATION
  $: preview = createFightState(player, opponent, { environment })
  const resources: { id: PreparationResource; fr: string; en: string }[] = [
    {
      id: 'paper',
      fr: 'Éventails, confettis et feuilles réels',
      en: 'Actual fans, confetti and paper sheets',
    },
    {
      id: 'musse-history',
      fr: 'Benjamin et Camilla · hibou hérité de Musse et longue surveillance déjà accomplis',
      en: 'Benjamin and Camilla · Musse’s owl inherited and prolonged monitoring completed',
    },
    {
      id: 'devices',
      fr: 'Caméras, armes, émetteurs et récepteurs réels',
      en: 'Real cameras, firearms, transmitters and receivers',
    },
    {
      id: 'spirits',
      fr: 'Faibles esprits pour les talismans',
      en: 'Weak spirits for protective charms',
    },
    {
      id: 'people',
      fr: 'Reine Oito · destinataire non éveillée',
      en: 'Queen Oito · unawakened recipient',
    },
    { id: 'writing', fr: 'Papier, pinceaux et encre réels', en: 'Real paper, brushes and ink' },
    { id: 'animals', fr: 'Petits animaux réels', en: 'Real small animals' },
    { id: 'birds', fr: 'Pigeons et points de livraison', en: 'Pigeons and delivery points' },
    { id: 'plants', fr: 'Graines vivantes à faire germer', en: 'Living seeds to germinate' },
    { id: 'objects', fr: 'Caisses réelles pour Sweet Home', en: 'Real crates for Sweet Home' },
    { id: 'needles', fr: 'Aiguilles réelles à ramasser', en: 'Real needles to pick up' },
    { id: 'flutes', fr: 'Flûtes à ramasser', en: 'Flutes to pick up' },
    {
      id: 'rooms',
      fr: 'Pièces d’ancrage fermées et destinations déjà visitées',
      en: 'Sealed anchor rooms and already visited destinations',
    },
  ]
  function change(next: FightPreparation) {
    onChange({ ...environment, preparation: next })
  }
  function mode(scenario: boolean) {
    change(
      scenario
        ? {
            mode: 'scenario',
            resources: resources.map((entry) => entry.id),
            cohorts: (['player', 'opponent'] as const).filter(
              (side) => (side === 'player' ? player : opponent) === 'halkenburg',
            ),
          }
        : { mode: 'duel', resources: [], cohorts: [] },
    )
  }
  function toggle(id: PreparationResource, checked: boolean) {
    change({
      ...preparation,
      resources: checked
        ? [...preparation.resources, id]
        : preparation.resources.filter((entry) => entry !== id),
    })
  }
  function cohort(side: FightSide, checked: boolean) {
    change({
      ...preparation,
      cohorts: checked
        ? [...preparation.cohorts, side]
        : preparation.cohorts.filter((entry) => entry !== side),
    })
  }
</script>

<section
  class="preparation"
  aria-label={language === 'fr' ? 'Préparation du combat' : 'Combat preparation'}
>
  <h3>{language === 'fr' ? 'Préparation du combat' : 'Combat preparation'}</h3>
  <div class="modes">
    <button type="button" aria-pressed={preparation.mode === 'duel'} onclick={() => mode(false)}
      >{language === 'fr' ? 'Duel · équipement personnel' : 'Duel · personal equipment'}</button
    >
    <button type="button" aria-pressed={preparation.mode === 'scenario'} onclick={() => mode(true)}
      >{language === 'fr' ? 'Combat scénarisé' : 'Scenario combat'}</button
    >
  </div>
  {#if preparation.mode === 'scenario'}
    <FightInjurySetup
      injuries={preparation.injuries ?? {}}
      {language}
      onChange={(injuries) => change({ ...preparation, injuries })}
    />
    <fieldset>
      <legend
        >{language === 'fr'
          ? 'Ressources présentes avant la manche'
          : 'Resources present before the round'}</legend
      >
      {#each resources as resource (resource.id)}
        <label
          ><input
            type="checkbox"
            checked={preparation.resources.includes(resource.id)}
            onchange={(event) => toggle(resource.id, event.currentTarget.checked)}
          />{language === 'fr' ? resource.fr : resource.en}</label
        >
      {/each}
      {#each ['player', 'opponent'] as side, index (side)}
        <label
          ><input
            type="checkbox"
            checked={preparation.cohorts.includes(side as FightSide)}
            onchange={(event) => cohort(side as FightSide, event.currentTarget.checked)}
          />
          {language === 'fr'
            ? `P${index + 1} : partisans déjà marqués du panache et partageant sa volonté`
            : `P${index + 1}: already feather-marked supporters sharing this user's will`}</label
        >
      {/each}
    </fieldset>
    {#if player === 'halkenburg' || opponent === 'halkenburg'}
      <label
        ><input
          type="checkbox"
          checked={environment.halkenburgRosterVariant === true}
          onchange={(event) =>
            onChange({
              ...environment,
              halkenburgRosterVariant: event.currentTarget.checked,
            })}
        />{language === 'fr'
          ? 'Variante hors canon : Halkenburg prend un corps aléatoire du roster'
          : 'Non-canonical variant: Halkenburg takes a random roster body'}</label
      >
    {/if}
    <p>
      {language === 'fr'
        ? 'Ces présences et préparations constituent le scénario choisi. Le vol d’un Hatsu ne les transfère pas. Les flûtes au sol doivent être ramassées.'
        : 'These presences and preparations are the selected scenario. Stealing a Hatsu does not transfer them. Ground flutes must be picked up.'}
    </p>
  {/if}
  <div class="checks">
    {#each ['player', 'opponent'] as side (side)}
      {@const report = preparationCheck(preview, side as FightSide)}
      <div>
        <strong>{fighterDefinition(preview[side as FightSide].id).name}</strong>
        {#each report.requirements as requirement (requirement.id)}
          <span class:missing={!requirement.satisfied}
            >{requirement.satisfied ? '✓' : '—'}
            {REQUIREMENT_LABELS[language][requirement.id]}</span
          >
        {:else}<span
            >{language === 'fr'
              ? 'Aucun prérequis matériel supplémentaire déclaré'
              : 'No additional declared material prerequisite'}</span
          >{/each}
      </div>
    {/each}
  </div>
</section>

<style>
  .preparation {
    display: grid;
    gap: 0.7rem;
    padding: 1rem;
    margin: 1rem 0;
    border: 1px solid #455764;
    background: #0b141b;
    color: #dce8ed;
    font: 500 0.78rem/1.5 var(--font-mono);
  }
  h3,
  p {
    margin: 0;
  }
  h3 {
    color: #e7ca7c;
  }
  .modes {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  button {
    min-height: 44px;
    padding: 0.5rem 0.7rem;
    border: 1px solid #617582;
    background: #15242d;
    color: inherit;
    font: inherit;
  }
  button[aria-pressed='true'] {
    border-color: #e7ca7c;
    color: #ffe4a0;
  }
  fieldset,
  .checks > div {
    display: grid;
    gap: 0.4rem;
    min-width: 0;
  }
  fieldset {
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
  .checks {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
    overflow-wrap: anywhere;
  }
  .missing {
    color: #f3b49a;
  }
  p {
    color: #aabfc9;
  }
  @media (max-width: 480px) {
    .checks {
      grid-template-columns: 1fr;
    }
  }
</style>

<script lang="ts">
  import { fightTouchBindings } from '$lib/fighting/fightTouchHints'
  import FightStyleGuide from './FightStyleGuide.svelte'
  import FightMovementGuide from './FightMovementGuide.svelte'
  import FightMoveProperties from './FightMoveProperties.svelte'
  import { finisherHint, useFightBindings, moveInputHint } from '$lib/fighting/fightControlHints'
  const bindings = useFightBindings()
  import { movesetFor, moveById } from '$lib/fighting/movesets'
  import type { FighterId } from '$lib/fighting/types'
  import FightChrolloManual from './FightChrolloManual.svelte'
  import { arenaTechnique } from '$lib/fighting/arenaTechnique'

  export let touch = false
  export let fighterId: FighterId
  export let language: 'fr' | 'en'

  $: hints = touch ? fightTouchBindings(language) : $bindings
  $: moveset = movesetFor(fighterId)
  $: arena = arenaTechnique(fighterId)
  $: groups = moveset
    ? ([
        ['normal', language === 'fr' ? 'Normales' : 'Normals'],
        ['command', 'Command normals'],
        ['special', language === 'fr' ? 'Techniques' : 'Techniques'],
        ['throw', language === 'fr' ? 'Projection' : 'Throw'],
        [
          'finisher',
          fighterId === 'chrollo'
            ? language === 'fr'
              ? 'Page au signet'
              : 'Bookmarked page'
            : 'Finisher Hatsu',
        ],
      ] as const)
    : []

  const moveName = (id: string) => {
    const move = moveById(id)
    return move ? (language === 'fr' ? move.nameFr : move.nameEn) : id
  }
</script>

{#if moveset}
  <section class="move-list" aria-label={language === 'fr' ? 'Liste des coups' : 'Move list'}>
    <header>
      <span>{language === 'fr' ? 'MÉCANIQUE UNIQUE' : 'UNIQUE MECHANIC'}</span>
      <p>
        {language === 'fr'
          ? moveInputHint(moveset.mechanicFr, hints)
          : moveInputHint(moveset.mechanicEn, hints)}
      </p>
    </header>
    <FightStyleGuide {fighterId} {language} />
    <FightMovementGuide {fighterId} {language} />
    {#if fighterId === 'chrollo'}<FightChrolloManual {language} />{/if}
    {#if arena}
      <h3>
        {language === 'fr'
          ? `Action d’arène · ${hints.playerContext}${touch ? '' : ` (P2 : ${hints.opponentContext})`}`
          : `Arena action · ${hints.playerContext}${touch ? '' : ` (P2: ${hints.opponentContext})`}`}
      </h3>
      <p>{arena.name[language === 'fr' ? 0 : 1]} · {arena.effect[language === 'fr' ? 0 : 1]}</p>
      <p>{arena.condition[language === 'fr' ? 0 : 1]}</p>
    {/if}
    <div class="move-groups">
      {#each groups as [category, title] (category)}
        {#if moveset.moves.some((move) => move.category === category)}
          <div>
            <h3>{title}</h3>
            {#each moveset.moves.filter((move) => move.category === category) as move (move.id)}
              <p>
                <kbd>{moveInputHint(move.input, hints)}</kbd><span
                  >{language === 'fr' ? move.nameFr : move.nameEn}</span
                >
                <FightMoveProperties {move} {language} {touch} />
              </p>
            {/each}
          </div>
        {/if}
      {/each}
    </div>
    <div class="routes">
      <h3>{language === 'fr' ? 'Appel en combo' : 'Combo support call'}</h3>
      <p>
        <kbd>{touch ? (language === 'fr' ? 'Kaméo' : 'Kameo') : hints.playerKameo}</kbd> · {language ===
        'fr'
          ? 'Selon l’exemple, appelle avec la première attaque ou après une touche. Avant place le kaméo devant toi, arrière le garde derrière. Une pression pendant l’arrêt sur impact est mémorisée.'
          : 'Follow the example: call with the opening attack or after a hit. Forward places support ahead, back keeps it behind you. A press during hitstop is buffered.'}
      </p>
      <p>
        {language === 'fr'
          ? 'Luzurus peut prolonger au sol, Zhang Lei renforcer les frappes, Marayam protéger la récupération. Les six exemples sont dans Académie du Nen → Combos & défense.'
          : 'Luzurus can extend on the ground, Zhang Lei boost attacks, Marayam protect recovery. Find all six examples in Nen Academy → Combos & defense.'}
      </p>
      <h3>{language === 'fr' ? 'Exemples de combos' : 'Example combos'}</h3>
      {#each moveset.combos as route (route.join(':'))}
        <p>{route.map(moveName).join(' → ')}</p>
      {/each}
    </div>
    {#if moveset.moves.some((move) => move.category === 'finisher')}
      <footer>
        <strong
          >{fighterId === 'chrollo'
            ? `Double Face · ${finisherHint(hints)}`
            : language === 'fr'
              ? 'Condition du finisher'
              : 'Finisher condition'}</strong
        >
        <span
          >{moveInputHint(
            language === 'fr' ? moveset.finisherConditionFr : moveset.finisherConditionEn,
            hints,
          )}</span
        >
      </footer>
    {/if}
  </section>
{/if}

<style>
  .move-list {
    margin-top: 1rem;
    border-top: 1px solid #31404c;
    padding-top: 1rem;
    color: #cbd5dc;
    font: 600 0.66rem/1.4 var(--font-mono);
  }
  header span,
  h3,
  footer strong {
    color: #f1d36d;
    font: 700 0.58rem/1.2 var(--font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  header p {
    margin: 0.35rem 0 0.8rem;
  }
  .move-groups {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 0.8rem;
  }
  h3 {
    margin: 0 0 0.35rem;
  }
  .move-groups p {
    display: grid;
    grid-template-columns: minmax(58px, auto) 1fr;
    gap: 0.4rem;
    margin: 0.18rem 0;
  }
  kbd {
    color: #83ddff;
  }
  .routes {
    margin-top: 0.8rem;
  }
  .routes p {
    margin: 0.2rem 0;
    color: #a8bac5;
  }
  footer {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.8rem;
    border-left: 2px solid #efb94d;
    padding-left: 0.6rem;
  }
</style>

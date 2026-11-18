<script lang="ts">
  import FightStyleGuide from './FightStyleGuide.svelte'
  import FightMoveProperties from './FightMoveProperties.svelte'
  import { useFightBindings, moveInputHint } from '$lib/fighting/fightControlHints'
  const bindings = useFightBindings()
  import { movesetFor, moveById } from '$lib/fighting/movesets'
  import type { FighterId } from '$lib/fighting/types'
  import FightChrolloManual from './FightChrolloManual.svelte'
  import { arenaTechnique } from '$lib/fighting/arenaTechnique'
  import { hasAirPursuit, hasDirectionalChain } from '$lib/fighting/directionalChain'

  export let fighterId: FighterId
  export let language: 'fr' | 'en'

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
          ? moveInputHint(moveset.mechanicFr, $bindings)
          : moveInputHint(moveset.mechanicEn, $bindings)}
      </p>
    </header>
    <FightStyleGuide {fighterId} {language} />
    {#if fighterId === 'chrollo'}<FightChrolloManual {language} />{/if}
    {#if arena}
      <h3>
        {language === 'fr'
          ? `Action d’arène · ${$bindings.playerArena} (P2 : ${$bindings.opponentArena})`
          : `Arena action · ${$bindings.playerArena} (P2: ${$bindings.opponentArena})`}
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
                <kbd>{moveInputHint(move.input, $bindings)}</kbd><span
                  >{language === 'fr' ? move.nameFr : move.nameEn}</span
                >
                <FightMoveProperties {move} {language} />
              </p>
            {/each}
          </div>
        {/if}
      {/each}
    </div>
    <div class="routes">
      {#if hasDirectionalChain(fighterId)}
        <h3>{language === 'fr' ? 'Chaîne directionnelle' : 'Directional chain'}</h3>
        <p><kbd>{moveInputHint('J → J → J', $bindings)}</kbd> · {language === 'fr' ? 'Fin debout à proximité' : 'Close standing finish'}</p>
        <p><kbd>{moveInputHint('J → J → ↓ + J', $bindings)}</kbd> · {language === 'fr' ? 'Mise au sol' : 'Knockdown'}</p>
        <p><kbd>{moveInputHint('J → J → ↑ + J', $bindings)}</kbd> · {language === 'fr' ? 'Relance aérienne' : 'Launcher'}</p>
        <p><kbd>{moveInputHint('J → J → → + J', $bindings)}</kbd> · {language === 'fr' ? 'Poussée vers le coin' : 'Corner carry'}</p>
        <p>{language === 'fr'
            ? 'Les deux premiers coups doivent toucher. Certaines fins utilisent une technique si ses conditions sont remplies.'
            : 'The first two strikes must hit. Some endings use a technique when its requirements are met.'}</p>
      {/if}
      {#if hasAirPursuit(fighterId)}
        <h3>{language === 'fr' ? 'Poursuite après la relance' : 'Launcher pursuit'}</h3>
        <p>
          <kbd>{moveInputHint('→ + J', $bindings)}</kbd>
          · {language === 'fr'
            ? 'Léger aérien. Enchaîner dès la relance.'
            : 'Air light. Input as soon as the launcher hits.'}
        </p>
        <p>
          <kbd>{moveInputHint('→ + L', $bindings)}</kbd>
          · {fighterId === 'kurapika'
            ? 'Dowsing Whip · 24 aura'
            : language === 'fr'
              ? 'Bungee Gum · 55 aura et lien actif sélectionné sur l’adversaire'
              : 'Bungee Gum · 55 aura and an active selected tether on the opponent'}
        </p>
      {/if}
      <h3>{language === 'fr' ? 'Exemples de combos' : 'Example combos'}</h3>
      {#each moveset.combos as route}
        <p>{route.map(moveName).join(' → ')}</p>
      {/each}
    </div>
    {#if moveset.moves.some((move) => move.category === 'finisher')}
      <footer>
        <strong
          >{fighterId === 'chrollo'
            ? `Double Face · ${$bindings.playerFinisher}`
            : language === 'fr'
              ? 'Condition du finisher'
              : 'Finisher condition'}</strong
        >
        <span
          >{moveInputHint(
            language === 'fr' ? moveset.finisherConditionFr : moveset.finisherConditionEn,
            $bindings,
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
    grid-template-columns: 58px 1fr;
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

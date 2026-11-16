<script lang="ts">
  import { movesetFor, moveById } from '$lib/fighting/movesets'
  import type { FighterId } from '$lib/fighting/types'

  export let fighterId: FighterId
  export let language: 'fr' | 'en'

  $: moveset = movesetFor(fighterId)
  $: groups = moveset
    ? ([
        ['normal', language === 'fr' ? 'Normales' : 'Normals'],
        ['command', 'Command normals'],
        ['special', language === 'fr' ? 'Techniques' : 'Techniques'],
        ['throw', language === 'fr' ? 'Projection' : 'Throw'],
        ['finisher', 'Finisher Hatsu'],
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
      <p>{language === 'fr' ? moveset.mechanicFr : moveset.mechanicEn}</p>
    </header>
    <div class="move-groups">
      {#each groups as [category, title] (category)}
        {#if moveset.moves.some((move) => move.category === category)}
        <div>
          <h3>{title}</h3>
          {#each moveset.moves.filter((move) => move.category === category) as move (move.id)}
            <p>
              <kbd>{move.input}</kbd><span>{language === 'fr' ? move.nameFr : move.nameEn}</span>
            </p>
          {/each}
        </div>
        {/if}
      {/each}
    </div>
    <div class="routes">
      <h3>{language === 'fr' ? 'Routes courtes' : 'Short routes'}</h3>
      {#each moveset.combos as route (route.join(':'))}
        <p>{route.map(moveName).join(' → ')}</p>
      {/each}
    </div>
    {#if moveset.moves.some((move) => move.category === 'finisher')}
    <footer>
      <strong>{language === 'fr' ? 'Condition du finisher' : 'Finisher condition'}</strong>
      <span>{language === 'fr' ? moveset.finisherConditionFr : moveset.finisherConditionEn}</span>
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

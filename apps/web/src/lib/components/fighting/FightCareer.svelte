<script lang="ts">
  import { onMount } from 'svelte'
  import { clashCareer, careerFighters } from '$lib/fighting/career/profile'
  import { fighterDefinition } from '$lib/fighting/roster'
  import { rematchVowLabel } from '$lib/fighting/career/rematchVow'
  import type { RematchVowKind } from '$lib/fighting/career/types'
  export let career = clashCareer
  export let language: 'fr' | 'en'
  $: fr = language === 'fr'
  $: played = careerFighters($career)
  const rematchVows: readonly RematchVowKind[] = ['no-retreat', 'open-hatsu', 'single-hatsu']
  onMount(() => career.load())
</script>

<section class="career-panel" aria-label={fr ? 'Profil Clash' : 'Clash profile'}>
  <h2>{fr ? 'Mon profil' : 'My profile'}</h2>
  <form
    onsubmit={(event) => {
      event.preventDefault()
      const form = new FormData(event.currentTarget)
      career.configure(String(form.get('name')), {
        theme: form.get('theme') as 'whale',
        intro: form.get('intro') as 'full',
        victory: form.get('victory') as 'salute',
      })
    }}
  >
    <label
      >{fr ? 'Pseudo local' : 'Local name'}<input
        name="name"
        maxlength="24"
        value={$career.name}
      /></label
    >
    <label
      >{fr ? 'Habillage' : 'Theme'}<select
        name="theme"
        aria-label={fr ? 'Habillage' : 'Theme'}
        value={$career.appearance.theme}
        ><option value="whale">Black Whale</option><option value="heavens">Heavens</option><option
          value="nocturne">Nocturne</option
        ></select
      ></label
    >
    <label
      >{fr ? 'Introductions' : 'Introductions'}<select
        name="intro"
        aria-label={fr ? 'Introductions' : 'Introductions'}
        value={$career.appearance.intro}
        ><option value="full">{fr ? 'Complètes' : 'Full'}</option><option value="brief"
          >{fr ? 'Brèves' : 'Brief'}</option
        ><option value="off">{fr ? 'Désactivées' : 'Off'}</option></select
      ></label
    >
    <label
      >{fr ? 'Pose de victoire' : 'Victory pose'}<select
        name="victory"
        aria-label={fr ? 'Pose de victoire' : 'Victory pose'}
        value={$career.appearance.victory}
        ><option value="salute">{fr ? 'Salut' : 'Salute'}</option><option value="ready"
          >{fr ? 'En garde' : 'Ready'}</option
        ><option value="still">{fr ? 'Repos' : 'Still'}</option></select
      ></label
    >
    <button type="submit">{fr ? 'Enregistrer le profil' : 'Save profile'}</button>
  </form>
  <p>
    {fr
      ? 'La maîtrise mesure ta pratique. Les niveaux et habillages ne modifient aucune règle du Nen ni aucune statistique de combat.'
      : 'Mastery measures your practice. Levels and themes change no Nen rules or combat statistics.'}
  </p>
  <h2>{fr ? 'Maîtrise des personnages' : 'Fighter mastery'}</h2>
  {#if played.length}<div class="career-grid">
      {#each played as fighter (fighter.id)}<article>
          <strong>{fighter.name} · {fr ? 'niveau' : 'level'} {fighter.level}</strong>
          <p>
            {fighter.matches}
            {fighter.matches === 1 ? 'match' : fr ? 'matchs' : 'matches'} · {fighter.wins} V / {fighter.losses}
            D
          </p>
          <p>
            {fighter.points} XP · {fr ? 'meilleur combo' : 'best combo'}
            {fighter.bestCombo} / {fighter.bestComboDamage.toFixed(1)}
          </p>
        </article>{/each}
    </div>{:else}<p>
      {fr
        ? 'Termine un match pour commencer ta maîtrise.'
        : 'Finish a match to start your mastery.'}
    </p>{/if}
  <h2>{fr ? 'Historique · 200 derniers matchs' : 'History · last 200 matches'}</h2>
  <p>
    {fr
      ? 'Les replays, le laboratoire et les matchs quittés ne donnent pas de progression. Les PV perdus incluent les coûts physiques et les dégâts reçus.'
      : 'Replays, the lab and abandoned matches grant no progress. Health lost includes physical costs and received damage.'}
  </p>
  <ol>
    {#each $career.history as match (match.id)}<li>
        <strong
          >{fighterDefinition(match.player).name} — {fighterDefinition(match.opponent).name}</strong
        >
        <span
          >{match.source} · {new Date(match.at).toLocaleDateString(language)} · {match.rounds
            .player}–{match.rounds.opponent} · {match.winner === 'player'
            ? fr
              ? 'Victoire'
              : 'Victory'
            : fr
              ? 'Défaite'
              : 'Defeat'}</span
        >
        <small
          >{Math.round(match.practice.frames / 60)} s · {fr ? 'PV perdus' : 'Health lost'}
          {match.practice.player.healthLost.toFixed(1)} · {match.stage}</small
        >
        {#if match.winner === 'opponent'}<div class="vows">
            {#each rematchVows as kind}<button
                type="button"
                onclick={() => career.pledgeRematch(match.id, kind)}
                >{rematchVowLabel(kind, language)}</button
              >{/each}
          </div>{/if}
      </li>{/each}
  </ol>
  <details>
    <summary>{fr ? 'Effacer les données locales' : 'Clear local data'}</summary><button
      type="button"
      onclick={() => career.clear()}
      >{fr
        ? 'Effacer mon historique et mes préférences'
        : 'Clear my history and preferences'}</button
    >
  </details>
</section>

<style>
  .career-panel {
    border: 1px solid #576c7c;
    padding: 1rem;
    margin: 1rem 0;
    background: #101f2b;
  }
  form,
  .career-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 210px), 1fr));
    gap: 0.8rem;
  }
  label {
    display: grid;
    gap: 0.4rem;
  }
  input,
  select,
  button {
    min-height: 44px;
    box-sizing: border-box;
    min-width: 0;
    max-width: 100%;
    color: white;
    background: #203a4e;
    border: 1px solid #91a6b6;
    padding: 0.5rem;
  }
  article {
    padding: 0.7rem;
    border: 1px solid #4c687c;
  }
  p,
  li {
    line-height: 1.6;
  }
  ol {
    padding-left: 1.3rem;
  }
  li {
    padding: 0.6rem 0;
    border-bottom: 1px solid #3d5364;
    overflow-wrap: anywhere;
  }
  span,
  small {
    display: block;
  }
  .vows {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  summary {
    min-height: 44px;
    cursor: pointer;
  }
  :focus-visible {
    outline: 2px solid #f5d25c;
    outline-offset: 2px;
  }
</style>

<script lang="ts">
  import { onMount } from 'svelte'
  import { FIGHTING_ROSTER, fighterDefinition } from '$lib/fighting/roster'
  import {
    SOLO_MODES,
    SOLO_ROUTES,
    SURVIVAL_FIGHTERS,
    encounterIds,
  } from '$lib/fighting/solo/catalogue'
  import { createSoloController } from '$lib/fighting/solo/controller'
  import type { SoloMode, SoloRouteId } from '$lib/fighting/solo/types'
  import type { FighterId } from '$lib/fighting/types'
  import FightSoloBattle from './FightSoloBattle.svelte'
  import FightSoloResult from './FightSoloResult.svelte'
  export let language: 'fr' | 'en'
  export let controller = createSoloController()
  export let animate = true
  let mode: SoloMode = 'story',
    route: SoloRouteId = 'reading',
    fighter: FighterId = 'kurapika'
  $: fr = language === 'fr'
  $: session = $controller.session
  $: allowed =
    mode === 'survival'
      ? FIGHTING_ROSTER.filter((f) => SURVIVAL_FIGHTERS.includes(f.id))
      : FIGHTING_ROSTER
  $: if (!allowed.some((f) => f.id === fighter)) fighter = allowed[0].id
  $: description = SOLO_MODES.find((m) => m.id === mode)!.description[fr ? 0 : 1]
  $: issue = $controller.issue
  onMount(() => {
    try {
      controller.load(localStorage)
    } catch {
      controller.load()
    }
  })
</script>

<div class="solo-hub">
  <p>
    {fr
      ? 'Scénarios originaux de Clash, avec les facultés déjà jouables. Les objectifs peuvent se terminer sans K.-O. Les sauvegardes se font entre rencontres ; une partie quittée en combat reprend au début de cette rencontre.'
      : 'Original Clash scenarios using existing playable abilities. Objectives can end without a KO. Saves occur between encounters; leaving during combat resumes at the start of that encounter.'}
  </p>
  {#if !session}
    <form
      onsubmit={(event) => {
        event.preventDefault()
        controller.start({ mode, route, fighter })
      }}
    >
      <label
        >{fr ? 'Mode solo' : 'Solo mode'}<select
          bind:value={mode}
          aria-label={fr ? 'Mode solo' : 'Solo mode'}
          >{#each SOLO_MODES as entry (entry.id)}<option value={entry.id}
              >{entry.title[fr ? 0 : 1]}</option
            >{/each}</select
        ></label
      >
      {#if mode === 'story'}<label
          >{fr ? 'Parcours' : 'Route'}<select
            bind:value={route}
            aria-label={fr ? 'Parcours' : 'Route'}
            >{#each SOLO_ROUTES as entry (entry.id)}<option value={entry.id}
                >{entry.title[fr ? 0 : 1]}</option
              >{/each}</select
          ></label
        >{/if}
      <label
        >{fr ? 'Personnage pour les duels' : 'Fighter for duels'}<select
          bind:value={fighter}
          aria-label={fr ? 'Personnage pour les duels' : 'Fighter for duels'}
          >{#each allowed as entry (entry.id)}<option value={entry.id}>{entry.name}</option
            >{/each}</select
        ></label
      >
      <p>{description}</p>
      <button>{fr ? 'Démarrer une nouvelle partie' : 'Start a new run'}</button>
    </form>
    {#if $controller.save.run}<button type="button" onclick={() => controller.resume()}
        >{fr ? 'Ouvrir la partie sauvegardée' : 'Open saved run'}</button
      >{/if}
    <section aria-label={fr ? 'Récits et titres' : 'Stories and titles'}>
      <h2>{fr ? 'Récits et titres' : 'Stories and titles'}</h2>
      {#if !$controller.save.routes.length}<p>
          {fr
            ? 'Termine un parcours pour conserver sa fin et son titre local.'
            : 'Finish a route to keep its ending and local title.'}
        </p>{/if}
      {#each SOLO_ROUTES.filter( (r) => $controller.save.routes.includes(r.id) ) as entry (entry.id)}<details
        >
          <summary>{entry.reward[fr ? 0 : 1]} · {entry.title[fr ? 0 : 1]}</summary>
          <p>{entry.ending[fr ? 0 : 1]}</p>
        </details>{/each}
    </section>
    <section aria-label={fr ? 'Records locaux' : 'Local records'}>
      <h2>{fr ? 'Records locaux' : 'Local records'}</h2>
      <p>
        {fr
          ? 'Records de ce navigateur, essais rejouables, hors classement serveur.'
          : 'Records for this browser, with replayable attempts, outside server standings.'}
      </p>
      <div class="table">
        <table>
          <thead
            ><tr
              ><th>Mode</th><th>{fr ? 'Victoires' : 'Wins'}</th><th>Score</th><th
                >{fr ? 'Temps simulé' : 'Simulated time'}</th
              ></tr
            ></thead
          ><tbody>
            {#each SOLO_MODES.filter((m) => m.id !== 'story') as entry (entry.id)}{@const record =
                $controller.save.records[entry.id as Exclude<SoloMode, 'story'>]}<tr
                ><td>{entry.title[fr ? 0 : 1]}</td><td>{record?.wins ?? '—'}</td><td
                  >{record?.score ?? '—'}</td
                ><td>{record ? `${(record.frames / 60).toFixed(1)} s` : '—'}</td></tr
              >{/each}
          </tbody>
        </table>
      </div>
    </section>
  {:else}
    <header>
      <h2>
        {SOLO_MODES.find((m) => m.id === session.run.mode)!.title[fr ? 0 : 1]} · {session.run
          .index + 1}/{encounterIds(session.run).length}
      </h2>
      <p>
        {fr ? 'Temps de session' : 'Session time'} : {(session.run.elapsed / 60).toFixed(1)} s · {fr
          ? 'Score'
          : 'Score'} : {session.run.score}
      </p>
    </header>
    {#if session.run.status === 'briefing'}<section
        class="solo-briefing"
        aria-label={fr ? 'Prémisses de la rencontre' : 'Encounter premises'}
      >
        <h3>{session.encounter.title[fr ? 0 : 1]}</h3>
        <p>
          <strong>{fighterDefinition(session.state.player.id).name}</strong> / {fighterDefinition(
            session.state.opponent.id,
          ).name}
        </p>
        <p>{session.encounter.premises[fr ? 0 : 1]}</p>
        <p>{session.encounter.instruction[fr ? 0 : 1]}</p>
        <p>
          {fr ? 'Ressources de départ' : 'Starting resources'} · P1 : {session.state.player.health} PV
          / {session.state.player.aura.toFixed(0)}
          {fr ? 'aura' : 'aura'} · P2 : {session.state.opponent.health} PV / {session.state.opponent.aura.toFixed(
            0,
          )}
          {fr ? 'aura' : 'aura'}
        </p>
        <button type="button" onclick={() => controller.begin()}
          >{fr ? 'Commencer la rencontre' : 'Start encounter'}</button
        >
        <button type="button" onclick={() => controller.leave()}
          >{fr ? 'Retour aux parcours' : 'Back to routes'}</button
        >
      </section>
    {:else if session.run.status === 'playing'}<p class="objective" role="status">
        {session.encounter.instruction[fr ? 0 : 1]}
      </p>
      <FightSoloBattle {controller} {language} {animate} />
    {:else}<FightSoloResult {controller} {language} />{/if}
  {/if}
  {#if issue}<p role="status">
      {issue === 'rules'
        ? fr
          ? 'Les règles ont changé : les récits et titres sont conservés, une nouvelle partie est nécessaire.'
          : 'Rules changed: stories and titles are kept; start a new run.'
        : issue === 'invalid'
          ? fr
            ? 'Sauvegarde illisible. Elle reste intacte tant que tu ne démarres pas une nouvelle partie.'
            : 'Unreadable save. It is kept until you start a new run.'
          : fr
            ? 'Sauvegarde indisponible. La session reste jouable sans progression durable.'
            : 'Saving unavailable. The session remains playable without durable progress.'}
    </p>{/if}
</div>

<style>
  .solo-hub {
    min-width: 0;
    color: #e5eff9;
    font:
      15px/1.5 system-ui,
      sans-serif;
  }
  form,
  section {
    border: 1px solid #526c7b;
    padding: 1rem;
    margin: 1rem 0;
    min-width: 0;
  }
  form {
    display: flex;
    gap: 0.8rem;
    flex-wrap: wrap;
    align-items: end;
  }
  label {
    display: grid;
    gap: 0.4rem;
    min-width: 0;
    grid-template-columns: minmax(0, 1fr);
  }
  select,
  button {
    min-height: 44px;
    max-width: 100%;
    box-sizing: border-box;
    padding: 0.6rem;
    font: inherit;
    background: #193449;
    color: #edf4f8;
    border: 1px solid #7892a4;
  }
  button {
    margin: 0.4rem 0.5rem 0.4rem 0;
    cursor: pointer;
  }
  p {
    line-height: 1.6;
    overflow-wrap: anywhere;
  }
  form p {
    flex-basis: 100%;
    margin: 0;
  }
  .objective {
    border-left: 3px solid #8db7ca;
    padding: 0.6rem;
  }
  summary {
    cursor: pointer;
  }
  .table {
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }
  th,
  td {
    padding: 0.5rem 0.3rem;
    border-bottom: 1px solid #526c7b;
  }
  h2 {
    font-size: 1.25rem;
  }
  :focus-visible {
    outline: 2px solid #f5d25c;
    outline-offset: 2px;
  }
</style>

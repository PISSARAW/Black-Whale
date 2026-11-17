<script lang="ts">
  import { onMount } from 'svelte'
  import FightTeamBattle from './FightTeamBattle.svelte'
  import FightTeamSelection from './FightTeamSelection.svelte'
  import { createTeamFight } from '$lib/fighting/teamMatch'
  import { FIGHT_STAGES } from '$lib/fighting/stages'
  import {
    defaultTeamDraft,
    readTeamDraft,
    saveTeamDraft,
    validTeamDraft,
    type DraftStorage,
  } from '$lib/fighting/teams/draft'
  import type { FighterId, FightSide, FightState } from '$lib/fighting/types'
  export let language: 'fr' | 'en'
  let draft = defaultTeamDraft(),
    state: FightState | null = null,
    message = ''
  let storage: DraftStorage | undefined
  $: fr = language === 'fr'
  onMount(() => {
    try {
      storage = localStorage
    } catch {
      storage = undefined
    }
    const loaded = readTeamDraft(storage)
    draft = loaded.draft
    if (loaded.issue)
      message = fr
        ? 'Sélection sauvegardée indisponible. Tu peux préparer une nouvelle équipe.'
        : 'Saved selection unavailable. You can prepare a new team.'
  })
  function select(side: FightSide, roster: FighterId[]) {
    draft = { ...draft, rosters: { ...draft.rosters, [side]: roster } }
    message = ''
  }
  function save() {
    message = saveTeamDraft(storage, draft)
      ? fr
        ? 'Sélection conservée sur ce navigateur.'
        : 'Selection saved in this browser.'
      : fr
        ? 'Sauvegarde indisponible. Le match reste jouable.'
        : 'Saving unavailable. The match remains playable.'
  }
  function start() {
    if (!validTeamDraft(draft)) return
    state = createTeamFight(draft.rosters, {
      stageId: draft.stage,
      arenaInteractions: draft.interactive,
    })
    save()
  }
</script>

<section class="teams" aria-label={fr ? 'Équipes et relais' : 'Teams and relays'}>
  <h1>{fr ? 'Clash · Équipes et relais' : 'Clash · Teams and relays'}</h1>
  {#if state}<FightTeamBattle bind:state {language} onExit={() => (state = null)} />{:else}
    <p>
      {fr
        ? 'Choisis et ordonne trois combattants distincts par équipe. Chaque défaite élimine le corps en scène ; le dernier groupe encore en lice gagne.'
        : 'Choose and order three distinct fighters per team. Each defeat eliminates the body on stage; the last team standing wins.'}
    </p>
    <details class="rules" open>
      <summary>{fr ? 'Ressources et relais' : 'Resources and relays'}</summary>
      <p>
        {fr
          ? 'Le survivant conserve ses PV et son aura. Les réserves ne régénèrent rien hors scène. Une nouvelle manche applique les remises ordinaires des manifestations, équipements et préparations ; les coûts persistants conservés par le moteur restent attachés au bon corps.'
          : 'Survivors retain HP and aura. Reserves regenerate nothing off stage. A new round applies ordinary manifestation, equipment and preparation resets; persistent costs retained by the engine remain attached to their actual body.'}
      </p>
      <p>
        {fr
          ? 'Un relais temporaire par équipe et par set : au bord, corps libre et engagements résolus, un allié entre à ta place, tente un léger puis revient à pied. Il reste vulnérable et peut perdre son propre stock. Les corps ne sont pas simultanés.'
          : 'One temporary relay per team per set: at your gate, with a free body and resolved commitments, an ally replaces you, attempts a light strike and walks back. The ally remains vulnerable and may lose their own stock. Bodies are not simultaneous.'}
      </p>
      <p>
        {fr
          ? 'L’équipe ne fournit ni faculté copiée, matériel, partisans, bonus ni invulnérabilité. Les résultats restent locaux, hors carrière et classement.'
          : 'The team grants no copied ability, equipment, supporters, bonus or invulnerability. Results remain local, outside career and rankings.'}
      </p>
    </details>
    <form
      onsubmit={(event) => {
        event.preventDefault()
        start()
      }}
    >
      <div class="selection">
        <FightTeamSelection
          roster={draft.rosters.player}
          side="player"
          {language}
          interactive={draft.interactive}
          onChange={(roster) => select('player', roster)}
        />
        <FightTeamSelection
          roster={draft.rosters.opponent}
          side="opponent"
          {language}
          interactive={draft.interactive}
          onChange={(roster) => select('opponent', roster)}
        />
      </div>
      <label
        >{fr ? 'Arène' : 'Arena'}<select
          bind:value={draft.stage}
          aria-label={fr ? 'Arène' : 'Arena'}
          >{#each FIGHT_STAGES as stage (stage.id)}<option value={stage.id}
              >{fr ? stage.nameFr : stage.nameEn}</option
            >{/each}</select
        ></label
      >
      <label class="check"
        ><input type="checkbox" bind:checked={draft.interactive} />{fr
          ? 'Couverts destructibles et actions d’arène'
          : 'Destructible cover and arena actions'}</label
      >
      {#if draft.interactive}<p>
          {fr
            ? 'Deux caisses réelles sont présentes au départ. Leur position, leurs dégâts et leur disparition sont conservés entre les combattants du set. Les effets de Nen suivent la remise en manche ordinaire. Les capacités de terrain gardent leurs prérequis personnels ; aucune ressource de scénario n’est ajoutée.'
            : 'Two real crates are present initially. Their position, damage and disappearance persist between fighters in this set. Nen effects follow ordinary round resets. Terrain abilities retain their personal prerequisites; no scenario resource is added.'}
        </p>{/if}
      <button type="submit" disabled={!validTeamDraft(draft)}
        >{fr ? 'Préparer les équipes' : 'Prepare teams'}</button
      >
      <button type="button" onclick={save} disabled={!validTeamDraft(draft)}
        >{fr ? 'Conserver cette sélection' : 'Save this selection'}</button
      >
      {#if message}<p role="status">{message}</p>{/if}
    </form>
  {/if}
</section>

<style>
  .teams {
    max-width: 100%;
    color: #e5eff9;
    font: 0.85rem/1.6 var(--font-mono, monospace);
  }
  .selection {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.6rem;
  }
  .rules {
    border: 1px solid #586b80;
    padding: 0.75rem;
    margin: 1rem 0;
  }
  summary {
    cursor: pointer;
  }
  label {
    display: grid;
    gap: 0.3rem;
    margin: 0.7rem 0;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  select,
  button {
    max-width: 100%;
    min-height: 44px;
    padding: 0.6rem;
    font: inherit;
    color: inherit;
    background: #22394a;
    border: 1px solid #6e869e;
  }
  button {
    margin: 0.3rem 0.5rem 0.3rem 0;
  }
  button:disabled {
    opacity: 0.4;
  }
  p {
    max-width: 80ch;
    overflow-wrap: anywhere;
  }
  @media (max-width: 450px) {
    .selection {
      grid-template-columns: 1fr;
    }
  }
</style>

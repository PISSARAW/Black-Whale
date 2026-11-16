<script lang="ts">
  import FightTeamBattle from './FightTeamBattle.svelte'
  import { createTeamFight } from '$lib/fighting/teamMatch'
  import { FIGHTING_ROSTER } from '$lib/fighting/roster'
  import { FIGHT_STAGES, type FightStageId } from '$lib/fighting/stages'
  import type { FighterId, FightState } from '$lib/fighting/types'
  export let language: 'fr' | 'en'
  let player: FighterId[] = ['kurapika', 'hisoka', 'theta'],
    opponent: FighterId[] = ['chrollo', 'franklin', 'hanzo']
  let stageId: FightStageId = 'heavens-arena',
    state: FightState | null = null,
    error = ''
  $: fr = language === 'fr'
  function start() {
    try {
      state = createTeamFight({ player, opponent }, { stageId })
      error = ''
    } catch {
      error = fr
        ? 'Choisis trois personnages distincts par équipe.'
        : 'Choose three different fighters per team.'
    }
  }
</script>

<section class="teams" aria-label={fr ? 'Équipes et relais' : 'Teams and relays'}>
  <h1>{fr ? 'Clash · Équipes et relais' : 'Clash · Teams and relays'}</h1>
  <p>
    {fr
      ? 'Deux équipes locales de trois combattants. Chaque KO ou défaite au temps élimine le corps en scène ; le survivant conserve ses PV et son aura. Le dernier groupe encore en lice gagne.'
      : 'Two local teams of three fighters. Each KO or timeout defeat eliminates the body on stage; survivors keep HP and aura. The last team standing wins.'}
  </p>
  <p>
    {fr
      ? 'Une assistance par équipe : au bord de l’arène, un allié entre à ta place, tente un léger puis se retire. Les corps ne combattent pas simultanément. Aucun équipement, pouvoir copié, bonus ou invulnérabilité n’est fourni.'
      : 'One assist per team: from your arena gate, an ally enters in your place, attempts a light strike and retreats. Bodies do not fight simultaneously. No equipment, copied power, bonus or invulnerability is granted.'}
  </p>
  <p>
    {fr
      ? 'Le Nen doit être au repos pour quitter la scène. Blessures, sceaux, contrats, copies engagées et manifestations peuvent retenir un corps. Ce mode local ne compte pas dans la carrière ni le classement.'
      : 'Nen must be at rest to leave the stage. Wounds, seals, contracts, committed copies and manifestations can retain a body. This local mode does not count for career or rankings.'}
  </p>
  {#if state}<FightTeamBattle bind:state {language} onExit={() => (state = null)} />{:else}
    <form
      onsubmit={(event) => {
        event.preventDefault()
        start()
      }}
    >
      <div class="selection">
        {#each ['P1', 'P2'] as side (side)}<fieldset>
            <legend>{side}</legend>
            {#each [0, 1, 2] as index (index)}<label
                >{side} · {index + 1}
                {#if side === 'P1'}<select bind:value={player[index]}
                    >{#each FIGHTING_ROSTER as fighter (fighter.id)}<option value={fighter.id}
                        >{fighter.name}</option
                      >{/each}</select
                  >
                {:else}<select bind:value={opponent[index]}
                    >{#each FIGHTING_ROSTER as fighter (fighter.id)}<option value={fighter.id}
                        >{fighter.name}</option
                      >{/each}</select
                  >{/if}
              </label>{/each}
          </fieldset>{/each}
      </div>
      <label
        >{fr ? 'Arène' : 'Arena'}<select bind:value={stageId}
          >{#each FIGHT_STAGES as stage (stage.id)}<option value={stage.id}
              >{fr ? stage.nameFr : stage.nameEn}</option
            >{/each}</select
        ></label
      >
      <button type="submit">{fr ? 'Préparer les équipes' : 'Prepare teams'}</button>
      {#if error}<p role="alert">{error}</p>{/if}
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
  fieldset {
    min-width: 0;
    border: 1px solid #6e869e;
  }
  label {
    display: grid;
    gap: 0.3rem;
    margin: 0.6rem 0;
  }
  select,
  button {
    max-width: 100%;
    padding: 0.6rem;
    font: inherit;
    color: inherit;
    background: #22394a;
    border: 1px solid #6e869e;
  }
  p {
    max-width: 75ch;
  }
  @media (max-width: 450px) {
    .selection {
      grid-template-columns: 1fr;
    }
  }
</style>

<script lang="ts">
  import {
    teamLivingForView,
    teamMemberForView,
    teamMemberStatus,
  } from '$lib/fighting/teams/status'
  import { teamMemberAlive } from '$lib/fighting/teamTypes'
  import { teamAssistOptions, TEAM_ASSIST_LABELS } from '$lib/fighting/teams/availability'
  import { nextTeamIndex } from '$lib/fighting/teams/next'
  import { fighterDefinition } from '$lib/fighting/roster'
  import type { FightState, FightSide } from '$lib/fighting/types'
  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  export let paused: boolean
  export let onAssist: (index: number) => void
  $: seat = state.teamMatch!.seats[side]
  $: fr = language === 'fr'
  $: label = side === 'player' ? 'P1' : 'P2'
  $: blocks = teamAssistOptions(state, side)
  $: next = seat.members[nextTeamIndex(seat)]
  const phases = {
    approach: ['Approche', 'Approach'],
    strike: ['Tentative de frappe', 'Strike attempt'],
    retreat: ['Retour au bord', 'Return to gate'],
  } as const
</script>

<section aria-label={label}>
  <h2>{label} · {teamLivingForView(state, side)}/3</h2>
  {#each seat.members as _stored, index (index)}
    {@const member = teamMemberForView(state, side, index)}
    {@const pendingBody =
      index === seat.active && Boolean(state.catsName || state.gumResuscitation)}
    {@const block = blocks[index]}
    {@const alive = teamMemberAlive(member)}
    <div class="member" class:eliminated={!alive && !pendingBody}>
      <strong>{fighterDefinition(seat.roster[index]).name}</strong>
      <span>{teamMemberStatus(state, side, index)[fr ? 0 : 1]}</span>
      {#if member.halkSoul && (member.halkCohortBody || member.id !== seat.roster[index])}
        <span
          >{fr ? 'Corps occupé' : 'Occupied body'} : {member.halkCohortBody
            ? fr
              ? 'Partisan'
              : 'Supporter'
            : fighterDefinition(member.id).name}</span
        >
      {/if}
      <p>
        {fr ? 'PV' : 'HP'} : {member.health}/{member.maxHealth} · Aura : {member.aura.toFixed(1)}
      </p>
      {#if alive && index !== seat.active}
        <button
          type="button"
          disabled={paused || Boolean(block)}
          aria-describedby={`${side}-relay-${index}`}
          aria-label={`${label} · ${fr ? 'Appeler' : 'Call'} ${fighterDefinition(member.id).name}`}
          onclick={() => onAssist(index)}>{fr ? 'Appeler en relais' : 'Call relay'}</button
        >
        <small id={`${side}-relay-${index}`}
          >{paused
            ? fr
              ? 'Partie en pause.'
              : 'Paused.'
            : block
              ? TEAM_ASSIST_LABELS[block][fr ? 0 : 1]
              : fr
                ? 'Demande vérifiée à l’entrée. L’allié reste vulnérable.'
                : 'Request checked on entry. The ally remains vulnerable.'}</small
        >
      {/if}
    </div>
  {/each}
  {#if seat.relay}<p role="status">
      {phases[seat.relay.phase][fr ? 0 : 1]} · {fr
        ? 'Le retour attend la libération du corps et des engagements.'
        : 'Returning waits for the body and commitments to be free.'}
    </p>{/if}
  {#if state.phase === 'finished' && !state.teamMatch?.winner && next}<p class="next">
      {fr ? 'Prochaine entrée' : 'Next entry'} : {fighterDefinition(next.id).name} · {next.health}
      {fr ? 'PV' : 'HP'} · {next.aura.toFixed(1)} aura
    </p>{/if}
</section>

<style>
  section {
    padding: 0.7rem;
    border: 1px solid #586b80;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .member {
    margin: 0.5rem 0;
    padding: 0.5rem 0;
    border-bottom: 1px solid #405366;
  }
  span,
  small {
    display: block;
  }
  p {
    margin: 0.3rem 0;
  }
  .eliminated {
    opacity: 0.5;
  }
  .next {
    border-left: 2px solid #e7c861;
    padding-left: 0.6rem;
  }
  button {
    min-height: 44px;
    padding: 0.5rem;
    margin: 0.3rem 0;
    color: inherit;
    border: 1px solid #6e869e;
    background: #22394a;
    font: inherit;
  }
  button:disabled {
    opacity: 0.45;
  }
</style>

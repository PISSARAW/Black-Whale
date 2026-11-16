<script lang="ts">
  import { localizePath } from '$lib/i18n/config'
  import { FIGHT_CHALLENGES } from '$lib/fighting/fightChallenges'
  import { ARCADE_ENCOUNTERS } from '$lib/fighting/clashArcade'
  import type { ClashPractice } from '$lib/fighting/clashPractice'
  import type { FightState, FighterId } from '$lib/fighting/types'
  export let practice: ClashPractice
  export let state: FightState | null
  export let fighter: FighterId = 'kurapika'
  export let language: 'fr' | 'en'
  export let expanded = false
  export let onLaunch: (state: FightState | null) => void
  $: index = language === 'fr' ? 0 : 1
  $: challenge = FIGHT_CHALLENGES.find((entry) => entry.id === $practice.challenge?.id)
  $: encounter = $practice.arcade ? ARCADE_ENCOUNTERS[$practice.arcade.index] : null
  function leave() {
    practice.exit()
    onLaunch(null)
  }
</script>

<section
  class="practice-hub"
  data-fight-scroll
  aria-label={language === 'fr' ? 'Défis et parcours Arcade' : 'Challenges and Arcade route'}
>
  {#if challenge && $practice.challenge}
    <div class="active-practice" role="status">
      <strong>{challenge.title[index]}</strong>
      <p>{challenge.instruction[index]}</p>
      <p>
        {$practice.challenge.complete
          ? language === 'fr'
            ? 'Défi réussi.'
            : 'Challenge complete.'
          : $practice.challenge.failed
            ? language === 'fr'
              ? 'Défi échoué. Recommence le scénario.'
              : 'Challenge failed. Retry the scenario.'
            : language === 'fr'
              ? 'Objectif en cours · 20 secondes de combat maximum.'
              : 'In progress · up to 20 seconds of combat.'}
      </p>
      <div class="actions">
        <button type="button" onclick={() => onLaunch(practice.challenge(challenge!.id))}
          >{language === 'fr' ? 'Recommencer le défi' : 'Retry challenge'}</button
        ><button type="button" onclick={leave}
          >{language === 'fr' ? 'Quitter le défi' : 'Leave challenge'}</button
        >
      </div>
    </div>
  {:else if encounter && $practice.arcade}
    <div class="active-practice" role="status">
      <strong>{encounter.title[index]}</strong>
      <p>{encounter.lesson[index]}</p>
      {#if $practice.arcade.complete}<p>
          {language === 'fr' ? 'Parcours Arcade terminé.' : 'Arcade route complete.'}
        </p>
      {:else if $practice.arcade.failed}<p>
          {language === 'fr'
            ? 'Rencontre perdue. Tu peux réessayer sans bonus.'
            : 'Encounter lost. Retry without bonuses.'}
        </p>
        <button type="button" onclick={() => onLaunch(practice.retry())}
          >{language === 'fr' ? 'Réessayer la rencontre' : 'Retry encounter'}</button
        >
      {:else if state?.matchWinner === 'player'}<button
          type="button"
          onclick={() => state && onLaunch(practice.next(state))}
          >{language === 'fr' ? 'Rencontre suivante' : 'Next encounter'}</button
        >{/if}
      <button type="button" onclick={leave}
        >{language === 'fr' ? 'Quitter le parcours' : 'Leave Arcade'}</button
      >
    </div>
  {/if}
  <a href={localizePath('/fighting/pvp', language)}
    >{language === 'fr' ? 'Jouer en duel privé' : 'Play a private duel'}</a
  >
  <a href={localizePath('/fighting/profile', language)}
    >{language === 'fr' ? 'Profil, saison et tournois' : 'Profile, season and tournaments'}</a
  >
  <details open={expanded}>
    <a href={localizePath('/fighting/teams', language)}
      >{language === 'fr' ? 'Équipes et assistances par relais' : 'Teams and relay assists'}</a
    >
    <summary
      >{language === 'fr' ? 'Défis et parcours Arcade' : 'Challenges and Arcade route'}</summary
    >
    <h3>{language === 'fr' ? 'Défis du Nen' : 'Nen challenges'}</h3>
    <div class="actions">
      {#each FIGHT_CHALLENGES as entry (entry.id)}<button
          type="button"
          onclick={() => onLaunch(practice.challenge(entry.id))}>{entry.title[index]}</button
        >{/each}
    </div>
    <h3>
      {language === 'fr' ? 'Parcours Arcade · cinq rencontres' : 'Arcade route · five encounters'}
    </h3>
    <p>
      {language === 'fr'
        ? 'Deux manches gagnantes par adversaire. Corps, aura et conditions repartent à neuf entre rencontres.'
        : 'Win two rounds per opponent. Body, aura and conditions reset between encounters.'}
    </p>
    <button type="button" onclick={() => onLaunch(practice.arcade(state?.player.id ?? fighter))}
      >{language === 'fr' ? 'Lancer le parcours avec' : 'Start route with'}
      {state?.player.id ?? fighter}</button
    >
  </details>
</section>

<style>
  .practice-hub {
    margin: 0.65rem 0;
    padding: 0.8rem;
    border: 1px solid #526878;
    background: #0b1620;
    color: #dce5ea;
    font: 0.85rem/1.5 var(--font-mono);
  }
  .active-practice {
    border-left: 2px solid #f5d25c;
    padding: 0.5rem 0.7rem;
    margin-bottom: 0.5rem;
  }
  summary {
    cursor: pointer;
    color: #f5d25c;
    min-height: 44px;
  }
  a {
    display: block;
    padding: 0.5rem 0;
    color: #f5d25c;
  }
  p {
    margin: 0.5rem 0;
  }
  h3 {
    margin: 1rem 0 0.5rem;
    font-size: 0.95rem;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0.5rem 0;
    align-items: center;
  }
  button {
    min-height: 44px;
    max-width: 100%;
    padding: 0.5rem 0.65rem;
    background: #172c3c;
    color: white;
    border: 1px solid #718b9e;
    font: inherit;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  button:focus-visible {
    outline: 2px solid #f5d25c;
    outline-offset: 2px;
  }
</style>

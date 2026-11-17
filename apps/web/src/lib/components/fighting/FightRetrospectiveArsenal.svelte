<script lang="ts">
  import { dowsingIndication } from '$lib/fighting/dowsingPresentation'
  import {
    judgmentClauseLabel,
    implantedJudgmentLabel,
    preparedJudgmentLabel,
  } from '$lib/fighting/judgmentPresentation'
  import { fighterDefinition } from '$lib/fighting/roster'
  import { phoneGuidance } from '$lib/fighting/retrospectivePresentation'
  import { arsenalOptions } from '$lib/fighting/retrospectiveArsenal'
  import type { ArsenalCommand } from '$lib/fighting/retrospectiveTypes'
  import type { FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let language: 'fr' | 'en'
  export let paused = false
  export let onUse: (side: FightSide, command: ArsenalCommand) => void
  $: sides =
    state.mode === 'versus-local' || state.mode === 'training'
      ? (['player', 'opponent'] as const)
      : (['player'] as const)
</script>

{#each ['player', 'opponent'] as publicSide (publicSide)}
  {@const caster = state[publicSide as FightSide]}
  {#if caster.attack?.moveId === 'kurapika:finisher' && caster.judgmentDeclaration}
    <p role="status">
      {fighterDefinition(caster.id).name} · Judgment : {judgmentClauseLabel(
        caster.judgmentDeclaration.clauses,
        language,
      )}
    </p>
  {/if}
{/each}

{#each sides as side (side)}
  {@const options = arsenalOptions(state, side)}
  {#if options.length}
    <section
      class="arsenal"
      aria-label={language === 'fr' ? 'Arsenal rétrospectif' : 'Retrospective arsenal'}
    >
      <strong
        >{side === 'player' ? 'P1' : 'P2'} · {language === 'fr'
          ? 'Techniques et préparations'
          : 'Techniques and preparation'}</strong
      >
      {#if state[side].id === 'kurapika'}<span
          >{language === 'fr' ? 'Prochaine implantation' : 'Next implantation'} · {preparedJudgmentLabel(
            state[side],
            language,
          )}</span
        >{/if}
      {#if state[side].judgmentChain}<strong
          >Judgment · {implantedJudgmentLabel(state[side], language)} · {language === 'fr'
            ? 'Rompre une clause est fatal.'
            : 'Breaking a clause is fatal.'}</strong
        >{/if}
      {#if state[side].heardWords && state.frame - state[side].heardWords!.frame < 180}<span
          >{fighterDefinition(state[side].heardWords!.speaker).name} : {state[side].heardWords!
            .text}</span
        >{/if}
      {#if state[side].dowsingReading}
        <span
          >Dowsing · {language === 'fr' ? 'Dernière lecture' : 'Latest reading'} ({Math.floor(
            state[side].dowsingReading!.frame / 60,
          )} s) · {state[side].dowsingReading!.text} · {dowsingIndication(
            state[side].dowsingReading!,
            language,
          )}</span
        >
      {/if}
      {#if state[side].devicePlayback}
        <strong
          >{language === 'fr' ? 'Dernière lecture de la caméra' : 'Latest camera playback'} · {Math.floor(
            state[side].devicePlayback!.viewedAt / 60,
          )} s</strong
        >
        {#each state[side].devicePlayback!.pictures.slice(-2) as frame, i (`${frame.frame}:${frame.subject}:${i}`)}
          <span
            >{Math.floor(frame.frame / 60)} s · {fighterDefinition(frame.appearance).name} · x {frame.x.toFixed(
              1,
            )}</span
          >
        {/each}
        {#each state[side].devicePlayback!.words.slice(-3) as word, i (`${word.frame}:${word.subject}:${i}`)}
          <span
            >{Math.floor(word.frame / 60)} s · {fighterDefinition(word.appearance).name} : {word.text}</span
          >
        {/each}
      {/if}
      {#if state[side].receiverReading}
        <span
          >{language === 'fr' ? 'Dernière réception radio' : 'Latest radio reading'} · {Math.floor(
            state[side].receiverReading!.frame / 60,
          )} s · x {state[side].receiverReading!.x.toFixed(1)}, y {state[
            side
          ].receiverReading!.y.toFixed(1)}</span
        >
      {/if}
      {#each options as option (`${option.command.action}:${option.command.target ?? ''}`)}
        <button
          type="button"
          disabled={paused || !option.ready}
          title={language === 'fr' ? option.conditionFr : option.conditionEn}
          onclick={() => onUse(side, option.command)}
        >
          {language === 'fr' ? option.labelFr : option.labelEn}
        </button>
        <small>{language === 'fr' ? option.conditionFr : option.conditionEn}</small>
      {/each}
      {#if state[side].chrolloHistorical?.phone}<span>{phoneGuidance(state, side, language)}</span
        >{/if}
      {#if state[side].gumCatch?.projectile}<span
          >{language === 'fr'
            ? 'Objet réel retenu par Bungee Gum'
            : 'Real object held by Bungee Gum'}</span
        >{/if}
      {#if state[side].cookie}
        <span
          >Cookie · {Math.floor(state[side].cookie!.frames / 60)} s
          {#if state[side].cookie!.mode === 'piano'}
            / 1 800 s{/if}</span
        >
      {/if}
    </section>
  {/if}
{/each}

<style>
  .arsenal {
    display: grid;
    gap: 0.4rem;
    padding: 0.75rem;
    border: 1px solid #715887;
    background: #17101e;
    color: #e5dcef;
  }
  button {
    min-height: 44px;
    padding: 0.5rem;
    color: inherit;
    background: #30213c;
    border: 1px solid #856a9a;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.45;
    cursor: default;
  }
  button:focus-visible {
    outline: 2px solid #ecd17b;
    outline-offset: 2px;
  }
  small {
    color: #c2b6cc;
  }
</style>

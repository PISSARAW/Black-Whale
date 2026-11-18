<script lang="ts">
  import FightDolphinPeople from './FightDolphinPeople.svelte'
  import FightJudgmentInterview from './FightJudgmentInterview.svelte'
  import FightDowsingInterview from './FightDowsingInterview.svelte'
  import FightLittleEyeScreen from './FightLittleEyeScreen.svelte'
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
  import FightMultiCombatStatus from './FightMultiCombatStatus.svelte'
  import FightPriorityStatus from './FightPriorityStatus.svelte'
  import FightGumNetwork from './FightGumNetwork.svelte'
  import FightPaperDocument from './FightPaperDocument.svelte'
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
  {#if caster.ghostwriterWriting}<p role="status">
      {publicSide === 'player' ? 'P1' : 'P2'} · Lovely Ghostwriter · {language === 'fr'
        ? 'Écriture automatique'
        : 'Automatic writing'} · {(caster.ghostwriterWriting.frames / 60).toFixed(1)} s
    </p>{/if}
  {#if caster.machiReattachment}<p role="status">
      {publicSide === 'player' ? 'P1' : 'P2'} · Nen Stitches · {language === 'fr'
        ? 'Raccordement des tissus'
        : 'Reconnecting tissues'} · {(caster.machiReattachment.frames / 60).toFixed(1)} s
    </p>{/if}
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
      {#if state[side].bashoWard}
        <span
          >Great Hiker · {language === 'fr'
            ? 'Talisman contre les faibles esprits'
            : 'Weak-spirit charm'} · {Math.max(
            0,
            state[side].bashoWard!.remainingFrames / 60,
          ).toFixed(1)} s</span
        >
      {/if}
      {#if state[side].blackVoiceAutopilot}
        <p role="status">
          Black Voice · {language === 'fr'
            ? 'Auto-manipulation : mission en cours, aucune annulation volontaire.'
            : 'Autopilot: mission running, no voluntary cancellation.'}
        </p>
      {/if}
      {#if state[side].blackVoiceAftermath}
        <p role="status">
          Black Voice · {language === 'fr'
            ? 'Douleurs musculaires ; aucun souvenir de la mission.'
            : 'Muscle soreness; no memory of the mission.'}
          {Math.ceil(state[side].blackVoiceAftermath!.remainingFrames / (60 * 60 * 60))} h
        </p>
      {/if}
      {#if state[side].blackVoiceScreen}
        {@const screen = state[side].blackVoiceScreen!}
        <p>
          Black Voice · {language === 'fr' ? 'Image reçue' : 'Received image'}
          {Math.floor(screen.frame / 60)} s
        </p>
        {#if screen.blank}
          <p>
            {language === 'fr'
              ? 'Aucune image visible par la cible.'
              : 'No image visible to the subject.'}
          </p>
        {/if}
        {#each screen.pictures as picture, i (i)}
          <p>
            {picture.appearance} · {picture.x.toFixed(1)} / {picture.y.toFixed(
              1,
            )}{picture.projection ? ' · projection' : ''}
          </p>
        {/each}
      {/if}
      <FightDolphinPeople {state} {side} {language} />
      <FightJudgmentInterview {state} {side} {language} {paused} {onUse} />
      <FightDowsingInterview {state} {side} {language} {paused} {onUse} />
      <FightPaperDocument {state} {side} {language} {paused} {onUse} />
      <FightLittleEyeScreen screen={state[side].littleEyeScreen} {language} />
      {#if state[side].devicePlayback}
        <strong
          >{language === 'fr' ? 'Dernière lecture de la caméra' : 'Latest camera playback'} · {Math.floor(
            state[side].devicePlayback!.viewedAt / 60,
          )} s</strong
        >
        {#each state[side].devicePlayback!.pictures.slice(-4) as frame, i (`${frame.frame}:${frame.subject}:${i}`)}
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
      {#if state[side].chrolloHistorical?.galleryReading}
        {@const reading = state[side].chrolloHistorical!.galleryReading!}
        <strong
          >Gallery Fake · {language === 'fr' ? 'Repérage' : 'Location'} · {Math.floor(
            reading.frame / 60,
          )} s</strong
        >
        <span
          >{state[side].chrolloHistorical?.galleryFocus
            ? language === 'fr'
              ? 'Contact avec l’original maintenu'
              : 'Contact with the original maintained'
            : language === 'fr'
              ? 'Dernière observation, contact interrompu'
              : 'Last observation, contact interrupted'}</span
        >
        {#each reading.copies as copy, i (copy.id)}
          <span
            >{language === 'fr' ? 'Copie' : 'Copy'}
            {i + 1} · x {copy.x.toFixed(1)}, y {copy.y.toFixed(1)} · {copy.contacts.length}
            {language === 'fr' ? 'contacts dans la copie' : 'contacts within the copy'}</span
          >
          {#if copy.contacts.length}
            <span
              >{copy.contacts
                .map((contact) => `x ${contact.x.toFixed(1)}, y ${contact.y.toFixed(1)}`)
                .join(' · ')}</span
            >
          {/if}
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
      <FightMultiCombatStatus {state} {side} {language} />
      <FightPriorityStatus {state} {side} {language} />
      <FightGumNetwork {state} {side} {language} {paused} {onUse} />
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

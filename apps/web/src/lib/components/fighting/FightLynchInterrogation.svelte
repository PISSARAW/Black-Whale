<script lang="ts">
  import { hasBodyAndSoul, canAskLynchQuestion } from '$lib/fighting/lynchRules'
  import { privateLynchReplies } from '$lib/fighting/lynchInterrogation'
  import { lynchReplyText } from '$lib/fighting/lynchPresentation'
  import { LYNCH_QUESTIONS, type LynchQuestionId } from '$lib/fighting/lynchTypes'
  import { fighterDefinition } from '$lib/fighting/roster'
  import type { FightSide, FightState } from '$lib/fighting/types'

  export let state: FightState
  export let language: 'fr' | 'en'
  export let paused = false
  export let onQuestion: (side: FightSide, question: LynchQuestionId) => void
  const sides: FightSide[] = ['player', 'opponent']
  let choices: Record<FightSide, LynchQuestionId> = { player: 'identity', opponent: 'identity' }
  let localViewer: FightSide | undefined
  let listening = false
  let shownReply = ''
  $: viewer = state.mode === 'versus-local' ? localViewer : ('player' as FightSide)
  $: replies = privateLynchReplies(state, viewer)
  $: last = replies[replies.length - 1]
  $: replyKey = last ? `${state.roundNumber}:${last.frame}:${last.questioner}:${last.question}` : ''
  $: if (replyKey !== shownReply) {
    listening = false
    shownReply = replyKey
  }
  $: relevant = sides.some(
    (side) =>
      state[side].id === 'lynch' ||
      hasBodyAndSoul(state[side]) ||
      state[side].lynchQuestion ||
      state[side].bodyAndSoulReplies?.length,
  )
  const human = (side: FightSide) => side === 'player' || state.mode !== 'versus-ai'
</script>

{#if relevant}
  <aside class="interrogation" aria-label="Body and Soul">
    <strong
      >Body and Soul · {language === 'fr'
        ? 'Question → coup de poing → vérité'
        : 'Question → fist strike → truth'}</strong
    >
    <p>
      {language === 'fr'
        ? 'Posez une question à portée de voix, puis touchez du poing. La cible doit rester consciente. Les dégâts sont ceux du coup ordinaire ; 10 aura par réponse est un réglage de duel.'
        : 'Ask within speaking range, then land a fist. The target must remain conscious. Damage comes from the ordinary punch; 10 aura per reply is duel tuning.'}
    </p>
    {#each sides as side (side)}
      {#if human(side) && (state[side].id === 'lynch' || hasBodyAndSoul(state[side]))}
        <div class="question">
          <label for={`lynch-question-${side}`}
            >{side === 'player' ? 'P1' : 'P2'} · {language === 'fr'
              ? 'Question'
              : 'Question'}</label
          >
          <select id={`lynch-question-${side}`} bind:value={choices[side]}>
            {#each Object.entries(LYNCH_QUESTIONS) as [id, question] (id)}
              <option value={id}>{question[language]}</option>
            {/each}
          </select>
          <button
            type="button"
            disabled={paused || !canAskLynchQuestion(state, side)}
            onclick={() => onQuestion(side, choices[side])}
            >{language === 'fr' ? 'Poser la question' : 'Ask the question'}</button
          >
        </div>
      {/if}
      {#if state[side].lynchQuestion}
        <p>
          {fighterDefinition(state[side].id).name} · {LYNCH_QUESTIONS[
            state[side].lynchQuestion!.id
          ][language]}
        </p>
      {/if}
    {/each}
    {#if state.mode === 'versus-local'}
      <label for="lynch-private-viewer"
        >{language === 'fr' ? 'Participant qui consulte' : 'Viewing participant'}</label
      >
      <select
        id="lynch-private-viewer"
        value={localViewer ?? ''}
        onchange={(event) => {
          localViewer = (event.currentTarget.value as FightSide) || undefined
          listening = false
        }}
      >
        <option value=""
          >{language === 'fr' ? 'Choisir un participant' : 'Choose a participant'}</option
        >
        <option value="player">P1</option><option value="opponent">P2</option>
      </select>
    {/if}
    {#if last}
      <p class="private-note">
        {language === 'fr'
          ? 'Réponse privée : seuls l’interrogateur et la cible l’entendent. Sur cet écran partagé, consultez-la à l’abri des spectateurs.'
          : 'Private reply: only the questioner and target hear it. On this shared screen, read away from spectators.'}
      </p>
      <button
        type="button"
        class="listen"
        onpointerdown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          listening = true
        }}
        onpointerup={() => (listening = false)}
        onpointercancel={() => (listening = false)}
        onblur={() => (listening = false)}
        onkeydown={(event) => {
          if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault()
            listening = true
          }
        }}
        onkeyup={() => (listening = false)}
      >
        {language === 'fr' ? 'Maintenir pour écouter la réponse' : 'Hold to hear the reply'}
      </button>
      {#if listening}
        <p>
          {language === 'fr'
            ? 'Réponse obtenue au contact — elle décrit cet instant.'
            : 'Reply obtained on contact — it describes that moment.'}
        </p>
        <blockquote>
          {LYNCH_QUESTIONS[last.question][language]}<br />{lynchReplyText(last, language)}
        </blockquote>
      {/if}
    {:else}
      <p>
        {language === 'fr' ? 'Aucune réponse privée à consulter.' : 'No private reply to read.'}
      </p>
    {/if}
  </aside>
{/if}

<style>
  .interrogation {
    background: #17131b;
    border: 1px solid #886986;
    border-radius: 0.5rem;
    padding: 0.8rem 1rem;
    color: #eddfed;
    font: 500 0.8rem/1.5 var(--font-body);
  }
  .question {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    margin: 0.5rem 0;
  }
  p {
    margin: 0.45rem 0;
  }
  select,
  button {
    font: inherit;
    color: inherit;
    background: #322539;
    border: 1px solid #886986;
    border-radius: 0.25rem;
    padding: 0.35rem 0.5rem;
  }
  button:disabled {
    opacity: 0.5;
  }
  button:focus-visible,
  select:focus-visible {
    outline: 2px solid #e5bde6;
    outline-offset: 2px;
  }
  .private-note {
    color: #cfb8cd;
  }
  blockquote {
    margin: 0.5rem 0;
    padding-left: 0.7rem;
    border-left: 2px solid #c78fc5;
  }
</style>

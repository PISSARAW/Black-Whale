<script lang="ts">
  import { judgmentQuestionReady, judgmentAnswerReady } from '$lib/fighting/judgmentInquiryRules'
  import {
    JUDGMENT_QUESTION_LENGTH,
    JUDGMENT_REPLY_LENGTH,
  } from '$lib/fighting/judgmentInquiryTypes'
  import type { ArsenalCommand } from '$lib/fighting/retrospectiveTypes'
  import type { FightSide, FightState } from '$lib/fighting/types'

  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  export let paused = false
  export let onUse: (side: FightSide, command: ArsenalCommand) => void
  let question = ''
  let answer = ''
  $: canAsk = judgmentQuestionReady(state, side)
  $: inquiry = state[side].judgmentChain?.inquiry
  $: ready = !paused && judgmentAnswerReady(state, side)
</script>

{#if canAsk}
  <label>
    Judgment · {language === 'fr' ? 'Question à prononcer' : 'Spoken question'}
    <input
      type="text"
      bind:value={question}
      maxlength={JUDGMENT_QUESTION_LENGTH}
      onkeydown={(event) => event.stopPropagation()}
      onkeyup={(event) => event.stopPropagation()}
    />
  </label>
  <button
    type="button"
    disabled={paused || !question.trim()}
    onclick={() => onUse(side, { action: 'judgment-ask', target: `question:${question.trim()}` })}
  >
    Judgment · {language === 'fr' ? 'Poser cette question' : 'Ask this question'}
  </button>
{/if}
{#if inquiry}
  <p class="judgment-inquiry" role="status">Judgment · {inquiry.text}</p>
  <label>
    {language === 'fr' ? 'Réponse à prononcer' : 'Spoken answer'}
    <input
      type="text"
      bind:value={answer}
      maxlength={JUDGMENT_REPLY_LENGTH}
      onkeydown={(event) => event.stopPropagation()}
      onkeyup={(event) => event.stopPropagation()}
    />
  </label>
  <small
    >{language === 'fr'
      ? 'Choisir l’intention consciente de cette réponse. Le jeu ne déduit pas sa sincérité du texte saisi.'
      : 'Choose this answer’s conscious intent. The game does not infer sincerity from the entered text.'}</small
  >
  <button
    type="button"
    disabled={!ready || !answer.trim()}
    onclick={() => onUse(side, { action: 'judgment-answer', target: `truth:${answer.trim()}` })}
  >
    Judgment · {language === 'fr' ? 'Prononcer ma réponse sincère' : 'Speak my sincere answer'}
  </button>
  <button
    type="button"
    disabled={!ready || !answer.trim()}
    onclick={() => onUse(side, { action: 'judgment-answer', target: `lie:${answer.trim()}` })}
  >
    Judgment · {language === 'fr' ? 'Prononcer mon mensonge — fatal' : 'Speak my lie — fatal'}
  </button>
{/if}

<style>
  label {
    display: grid;
    gap: 0.3rem;
  }
  input {
    min-width: 0;
    width: 100%;
    min-height: 44px;
    box-sizing: border-box;
    color: inherit;
    background: #17101e;
    border: 1px solid #856a9a;
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
  button:focus-visible,
  input:focus-visible {
    outline: 2px solid #ecd17b;
    outline-offset: 2px;
  }
  p,
  small {
    overflow-wrap: anywhere;
  }
</style>

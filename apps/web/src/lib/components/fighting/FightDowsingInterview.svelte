<script lang="ts">
  import { canAskDowsing, currentDowsingQuestion } from '$lib/fighting/dowsingRules'
  import { voiceAvailable } from '$lib/fighting/kallutoListening'
  import { DOWSING_TEXT_LENGTH } from '$lib/fighting/dowsingTypes'
  import type { ArsenalCommand } from '$lib/fighting/retrospectiveTypes'
  import type { FightSide, FightState } from '$lib/fighting/types'

  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  export let paused = false
  export let onUse: (side: FightSide, command: ArsenalCommand) => void
  let question = ''
  let answer = ''
  $: canAsk = canAskDowsing(state, side)
  $: prompt = state[side].dowsingPrompt
  $: canAnswer =
    !paused && prompt && voiceAvailable(state, side) && currentDowsingQuestion(state, side, prompt)
</script>

{#if canAsk}
  <label>
    Dowsing · {language === 'fr' ? 'Question à prononcer' : 'Spoken question'}
    <input
      type="text"
      bind:value={question}
      maxlength={DOWSING_TEXT_LENGTH}
      onkeydown={(event) => event.stopPropagation()}
      onkeyup={(event) => event.stopPropagation()}
    />
  </label>
  <button
    type="button"
    disabled={paused || !question.trim()}
    onclick={() => onUse(side, { action: 'dowsing-ask', target: `question:${question.trim()}` })}
  >
    Dowsing · {language === 'fr' ? 'Poser cette question' : 'Ask this question'}
  </button>
{/if}
{#if prompt?.question === 'free'}
  <p role="status">Dowsing · {prompt.text}</p>
  <label>
    Dowsing · {language === 'fr' ? 'Réponse à prononcer' : 'Spoken answer'}
    <input
      type="text"
      bind:value={answer}
      maxlength={DOWSING_TEXT_LENGTH}
      onkeydown={(event) => event.stopPropagation()}
      onkeyup={(event) => event.stopPropagation()}
    />
  </label>
  <small
    >{language === 'fr'
      ? 'Déclarer l’intention consciente du personnage. La chaîne détecte un mensonge conscient ; elle ne révèle pas la vérité cachée.'
      : 'Declare the character’s conscious intent. The chain detects a knowing lie; it does not reveal hidden truth.'}</small
  >
  <button
    type="button"
    disabled={!canAnswer || !answer.trim()}
    onclick={() => onUse(side, { action: 'dowsing-answer', target: `truth:${answer.trim()}` })}
  >
    Dowsing · {language === 'fr' ? 'Prononcer ma réponse sincère' : 'Speak my sincere answer'}
  </button>
  <button
    type="button"
    disabled={!canAnswer || !answer.trim()}
    onclick={() => onUse(side, { action: 'dowsing-answer', target: `lie:${answer.trim()}` })}
  >
    Dowsing · {language === 'fr' ? 'Prononcer mon mensonge conscient' : 'Speak my knowing lie'}
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

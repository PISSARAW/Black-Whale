<script lang="ts">
  import { arenaTrainingFeedback } from '$lib/arena/training'
  import type { CombatEvent } from '$lib/combat/types'

  interface Props {
    event: CombatEvent
    french: boolean
    impact: string
    zone: string
  }

  let { event, french, impact, zone }: Props = $props()
  let feedback = $derived(arenaTrainingFeedback(event, french ? 'fr' : 'en'))
</script>

<div
  class="event-line"
  class:training={Boolean(feedback)}
  class:punish={feedback?.tone === 'punish'}
  aria-live="polite"
>
  <strong>{impact}</strong>
  <span>· {zone}</span>
  {#if feedback}
    <span class="frames">
      <b>{feedback.data.startup}f</b> startup · {feedback.data.active}f active · {feedback.data
        .recovery}f rec.
      {#if feedback.data.onBlock !== '—'}· block {feedback.data.onBlock}{/if}
    </span>
    <small>{feedback.lesson}</small>
  {/if}
</div>

<style>
  .event-line.training {
    display: grid;
    grid-template-columns: auto auto 1fr;
    width: min(48rem, calc(100vw - 2rem));
    min-height: 3.3rem;
    align-items: center;
    column-gap: 0.35rem;
  }

  .frames {
    justify-self: end;
    color: #9fcbd3;
    font:
      500 0.54rem 'IBM Plex Mono',
      monospace;
    letter-spacing: 0.04em;
  }

  .frames b {
    color: #fffff0;
  }

  small {
    grid-column: 1 / -1;
    color: #c6d7da;
    font-size: 0.58rem;
    text-align: center;
  }

  .punish small,
  .punish .frames b {
    color: #ffd36e;
  }

  @media (max-width: 680px) {
    .event-line.training {
      grid-template-columns: auto auto;
    }
    .frames {
      grid-column: 1 / -1;
      justify-self: center;
    }
  }
</style>

<script lang="ts">
  export let elapsed: number
  export let language: 'fr' | 'en'
  $: fr = language === 'fr'
  $: question = elapsed >= 0.4 && elapsed < 2.2
  $: insist = elapsed >= 3.15 && elapsed < 4.1
  $: last = elapsed >= 6.05 && elapsed < 6.6
</script>

{#if question || insist || last}
  <div class="interrogation">
    <span>BODY AND SOUL</span>
    <b
      >{question
        ? fr
          ? 'Qui es-tu réellement ?'
          : 'Who are you really?'
        : insist
          ? fr
            ? 'Encore.'
            : 'Again.'
          : fr
            ? 'J’ai compris.'
            : 'I understand.'}</b
    >
  </div>
{/if}
{#if elapsed >= 2.2 && elapsed < 6.6}<div class="listening"></div>{/if}

<style>
  .interrogation {
    position: absolute;
    left: 5%;
    right: 5%;
    bottom: 14%;
    text-align: center;
    display: grid;
    gap: 0.6rem;
    color: #fff0df;
    text-shadow: 0 2px 10px #000;
  }
  span {
    font-size: clamp(9px, 1vw, 16px);
    letter-spacing: 0.24em;
    color: #e9adac;
  }
  b {
    font-size: clamp(16px, 2.1vw, 34px);
    font-family: Georgia, serif;
  }
  .listening {
    position: absolute;
    inset: 7% 0;
    box-shadow: inset 0 0 9vw 3vw #23041672;
    pointer-events: none;
  }
</style>

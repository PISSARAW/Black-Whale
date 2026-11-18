<script lang="ts">
  export let label: string
  export let className = ''
  export let onPress: () => void
</script>

<button
  type="button"
  class={className}
  aria-label={label}
  title={label}
  oncontextmenu={(event) => event.preventDefault()}
  onpointerdown={(event) => {
    if (event.button !== 0) return
    event.preventDefault()
    onPress()
  }}
  onclick={(event) => {
    if (event.detail === 0) onPress()
  }}><slot /></button
>

<style>
  button {
    width: 100%;
    min-width: 44px;
    min-height: 44px;
    padding: 0.3rem;
    border: 1px solid #b990cf8c;
    border-radius: 50%;
    color: #fff;
    background: #33213eeb;
    font: 700 0.65rem/1.1 var(--font-mono);
    touch-action: none;
    -webkit-touch-callout: none;
    cursor: pointer;
    box-shadow: 0 3px 0 #08050cb3;
  }
  button:active {
    color: #211008;
    background: #ffab78;
  }
  button:focus-visible {
    outline: 2px solid #ffb38a;
    outline-offset: 2px;
  }
  .heavy-button {
    background: #623533eb;
    border-color: #ff9867;
  }
  .finisher-button {
    color: #ffe0aa;
    border-color: #dfb469;
  }
</style>

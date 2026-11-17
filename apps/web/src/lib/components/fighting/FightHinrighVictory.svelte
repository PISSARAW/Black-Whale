<script lang="ts">
  export let elapsed: number
  $: visible = elapsed >= 0.5 && elapsed < 8
  $: seconds = Math.min(9, Math.floor(elapsed))
</script>

{#if visible}
  <div class="recording" aria-hidden="true"><i></i> REC <span>00:00:0{seconds}</span></div>
  <div class="viewfinder" aria-hidden="true"></div>
{/if}
{#if elapsed >= 6.035 && elapsed < 6.085}<div class="shutter" aria-hidden="true"></div>{/if}

<style>
  .recording {
    position: absolute;
    z-index: 45;
    top: 14%;
    right: 7%;
    padding: 0.4rem 0.65rem;
    background: #080b0dc9;
    color: #eee9de;
    font: 600 clamp(10px, 1.2vw, 18px) monospace;
    letter-spacing: 0.15em;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    pointer-events: none;
  }
  .recording i {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: #cc3b34;
  }
  .recording span {
    color: #a8b7b5;
    font-size: 0.8em;
  }
  .viewfinder {
    position: absolute;
    z-index: 35;
    inset: 17% 8%;
    border: 1px solid #b8c7bd26;
    pointer-events: none;
    clip-path: polygon(
      0 0,
      8% 0,
      8% 1%,
      1% 1%,
      1% 10%,
      0 10%,
      0 0,
      100% 0,
      100% 10%,
      99% 10%,
      99% 1%,
      92% 1%,
      92% 0,
      100% 0,
      100% 100%,
      92% 100%,
      92% 99%,
      99% 99%,
      99% 90%,
      100% 90%,
      100% 100%,
      0 100%,
      0 90%,
      1% 90%,
      1% 99%,
      8% 99%,
      8% 100%,
      0 100%
    );
  }
  .shutter {
    position: absolute;
    z-index: 46;
    inset: 0;
    background: #050709;
    pointer-events: none;
  }
</style>

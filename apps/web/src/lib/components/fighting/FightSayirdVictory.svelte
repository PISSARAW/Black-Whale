<script lang="ts">
  export let elapsed: number
  export let reduced = false
</script>

{#if !reduced && elapsed >= 2.3 && elapsed < 3.1}
  <div class="little-eye" aria-label="Little Eye">
    <span>LITTLE EYE</span><i></i>
  </div>
{/if}

<style>
  .little-eye {
    position: absolute;
    inset: 7% 0;
    border-radius: 42%;
    box-shadow: inset 0 0 12vw 4vw #030b06e8;
    background: linear-gradient(110deg, #23442322, transparent, #23442322);
    color: #c5e6ba;
  }
  span {
    position: absolute;
    top: 8%;
    left: 50%;
    transform: translateX(-50%);
    letter-spacing: 0.28em;
    font-size: clamp(12px, 1.4vw, 22px);
  }
  i {
    position: absolute;
    inset: 0;
    opacity: 0.08;
    background: repeating-linear-gradient(0deg, transparent 0 3px, #d9f0d8 4px 5px);
  }
</style>

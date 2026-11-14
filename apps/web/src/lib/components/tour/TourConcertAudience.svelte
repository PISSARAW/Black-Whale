<script lang="ts">
  let { french }: { french: boolean } = $props()
</script>

<div class="reaction-strip" aria-label={french ? 'Réactions du public' : 'Audience reactions'}>
  {#each Array(9) as _, index (index)}
    <span class="portrait p-{index}" aria-hidden="true">
      <i class="hair"></i><i class="face"></i><i class="eye left"></i><i class="eye right"></i>
    </span>
  {/each}
</div>

<style>
  .reaction-strip {
    position: absolute;
    left: 50%;
    bottom: 9rem;
    display: grid;
    grid-template-columns: repeat(9, minmax(44px, 72px));
    width: min(720px, calc(100% - 2rem));
    height: 78px;
    transform: translateX(-50%);
    z-index: 16;
    overflow: hidden;
    border: 2px solid #181818;
    background: #f5f2e8;
    box-shadow: 0 8px 28px #0008;
    pointer-events: none;
    animation: audience-cut 4s both;
  }
  .portrait {
    position: relative;
    overflow: hidden;
    border-right: 2px solid #181818;
    background: linear-gradient(#eee9dc, #fffdf4);
  }
  .portrait:last-child {
    border-right: 0;
  }
  .face {
    position: absolute;
    left: 50%;
    top: 13px;
    width: 34px;
    height: 48px;
    transform: translateX(-50%);
    border: 2px solid #171717;
    border-radius: 48% 48% 42% 42%;
    background: #eee8d9;
  }
  .hair {
    position: absolute;
    left: 50%;
    top: 5px;
    width: 46px;
    height: 34px;
    transform: translateX(-50%);
    border-radius: 55% 55% 25% 25%;
    background: #252525;
  }
  .eye {
    position: absolute;
    top: 37px;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #111;
  }
  .eye.left {
    left: calc(50% - 10px);
  }
  .eye.right {
    left: calc(50% + 6px);
  }
  .p-1 .hair,
  .p-5 .hair {
    height: 56px;
    border-radius: 45%;
  }
  .p-2 .face,
  .p-7 .face {
    width: 40px;
    border-radius: 42%;
  }
  .p-3 .hair {
    background: repeating-linear-gradient(90deg, #222 0 5px, #eee 6px 8px);
  }
  .p-4 .face {
    height: 42px;
    top: 20px;
  }
  .p-6 .hair {
    width: 55px;
    border-radius: 20% 60% 20% 60%;
  }
  .p-8 .face {
    width: 29px;
    height: 53px;
  }
  @keyframes audience-cut {
    0% {
      opacity: 0;
      transform: translate(-50%, 12px);
    }
    12%,
    82% {
      opacity: 1;
      transform: translate(-50%, 0);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -8px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .reaction-strip {
      animation: none;
    }
  }
</style>

<script lang="ts">
  /**
   * Gyo is aura gathered in the eyes, seen from behind them: the whole view
   * sharpens and warms while it is held. Nothing is drawn in front of the
   * eyes; what Gyo reveals (In, the opponent's aura) is shown where it is.
   */
  interface Props {
    active: boolean
  }

  let { active }: Props = $props()
</script>

<div class="gyo-sight" class:active aria-hidden="true"></div>

<style>
  .gyo-sight {
    position: absolute;
    z-index: 7;
    inset: 0;
    background: radial-gradient(
      ellipse at center,
      transparent 58%,
      rgb(255 214 120 / 7%) 82%,
      rgb(255 196 90 / 16%) 100%
    );
    opacity: 0;
    pointer-events: none;
    transition:
      opacity 280ms ease-out,
      backdrop-filter 280ms ease-out;
  }

  .gyo-sight.active {
    opacity: 1;
    backdrop-filter: contrast(1.14) saturate(1.3) brightness(1.04);
  }

  @media (prefers-reduced-motion: reduce) {
    .gyo-sight {
      transition: none;
    }
  }
</style>

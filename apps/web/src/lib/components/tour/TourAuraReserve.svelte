<script lang="ts">
  import { RESERVE_MAX, RESUME_AT } from '$lib/tour/auraReserve'

  /**
   * The visitor's aura reserve, as a thin bar over the Nen panel.
   *
   * A bar and not a number: the decision it supports is "can I keep this up a
   * little longer", which is read at a glance. The notch is the threshold below
   * which nothing that spends can be raised (`RESUME_AT`).
   */
  interface Props {
    reserve: number
    french?: boolean
  }
  let { reserve, french = false }: Props = $props()
  const share = $derived(Math.max(0, Math.min(1, reserve / RESERVE_MAX)))
  const low = $derived(reserve < RESUME_AT)
</script>

<div
  class="reserve"
  class:low
  role="meter"
  aria-label={french ? 'Réserve d’aura' : 'Aura reserve'}
  aria-valuemin={0}
  aria-valuemax={RESERVE_MAX}
  aria-valuenow={Math.round(reserve)}
  title={`${french ? 'Réserve d’aura' : 'Aura reserve'}: ${Math.round(reserve)} / ${RESERVE_MAX}`}
>
  <span class="fill" style:width={`${share * 100}%`}></span>
  <span class="notch" style:left={`${(RESUME_AT / RESERVE_MAX) * 100}%`}></span>
</div>

<style>
  .reserve {
    position: absolute;
    top: 12.25rem;
    left: 0.75rem;
    z-index: 20;
    width: 4.5rem;
    height: 3px;
    border-radius: 2px;
    background: rgb(142 202 230 / 0.18);
    pointer-events: none;
  }
  .fill {
    position: absolute;
    inset: 0 auto 0 0;
    border-radius: 2px;
    background: #8ecae6;
    transition: width 0.9s linear;
  }
  .low .fill {
    background: #e07a5f;
  }
  .notch {
    position: absolute;
    top: -2px;
    width: 1px;
    height: 7px;
    background: rgb(255 255 240 / 0.45);
  }
  @media (prefers-reduced-motion: reduce) {
    .fill {
      transition: none;
    }
  }
</style>

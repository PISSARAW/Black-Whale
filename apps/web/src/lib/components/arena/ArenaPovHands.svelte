<script lang="ts">
  import type { ArenaCombatMotion } from '$lib/arena/presentation'
  import type { FighterDefinition } from '$lib/fighting/types'

  interface Props {
    fighter: FighterDefinition
    motion: ArenaCombatMotion
    charging: boolean
    mode: 'ten' | 'ren' | 'zetsu'
  }

  let { fighter, motion, charging, mode }: Props = $props()
</script>

<div
  class="combat-hands"
  class:striking={motion === 'attack'}
  class:guarding={motion === 'guard'}
  class:charging
  class:ren={mode === 'ren'}
  class:zetsu={mode === 'zetsu'}
  class:hisoka={fighter.id === 'hisoka'}
  class:kurapika={fighter.id === 'kurapika'}
  class:chrollo={fighter.id === 'chrollo'}
  style={`--fighter-colour:${fighter.colour};--fighter-accent:${fighter.accent}`}
  aria-hidden="true"
>
  <i class="hand left-hand"><b></b></i>
  <i class="hand right-hand"><b></b></i>
  {#if fighter.id === 'hisoka'}
    <i class="cards"><b></b><b></b><b></b></i>
  {:else if fighter.id === 'kurapika'}
    <i class="chain"><b></b><b></b><b></b><b></b><b></b></i>
  {:else if fighter.id === 'chrollo'}
    <i class="book"><b>Skill Hunter</b></i>
  {/if}
  <small>{fighter.name} · {fighter.specialFr}</small>
</div>

<style>
  .hand {
    border-color: color-mix(in srgb, var(--fighter-accent) 65%, white);
    background: linear-gradient(145deg, var(--fighter-colour), #26353d 72%);
    box-shadow:
      inset -0.7rem -0.8rem 1.2rem rgb(0 0 0 / 45%),
      0 0 1.4rem color-mix(in srgb, var(--fighter-accent) 55%, transparent);
  }

  .hand > b {
    background: color-mix(in srgb, var(--fighter-colour) 70%, #17252c);
  }

  small {
    position: absolute;
    bottom: 7.8rem;
    left: 50%;
    color: color-mix(in srgb, var(--fighter-accent) 70%, white);
    font-size: 0.55rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    transform: translateX(-50%);
  }

  .cards {
    position: absolute;
    right: calc(50% - 10rem);
    bottom: 12rem;
    width: 3rem;
    height: 3.8rem;
    transform: rotate(-22deg);
  }

  .cards b {
    position: absolute;
    inset: 0;
    border: 1px solid #f7e8f1;
    border-radius: 0.2rem;
    background: linear-gradient(135deg, #f8f4ef 48%, var(--fighter-accent) 49% 53%, #32203d 54%);
    box-shadow: 0 0 0.8rem color-mix(in srgb, var(--fighter-accent) 55%, transparent);
  }

  .cards b:nth-child(2) {
    transform: rotate(10deg) translateX(0.45rem);
  }

  .cards b:nth-child(3) {
    transform: rotate(20deg) translateX(0.9rem);
  }

  .chain {
    position: absolute;
    left: calc(50% - 8rem);
    bottom: 11rem;
    display: flex;
    transform: rotate(22deg);
  }

  .chain b {
    width: 0.65rem;
    height: 0.4rem;
    border: 2px solid var(--fighter-accent);
    border-radius: 50%;
    margin-left: -0.15rem;
  }

  .book {
    position: absolute;
    right: calc(50% - 11rem);
    bottom: 10rem;
    width: 5rem;
    height: 6rem;
    padding: 0.5rem;
    border: 2px solid #c8b5ff;
    background: #171223;
    color: #e8e0ff;
    font-size: 0.55rem;
    transform: rotate(-12deg);
  }

  @media (max-width: 680px) {
    small {
      display: none;
    }
  }
</style>

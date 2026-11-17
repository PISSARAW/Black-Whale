<script lang="ts">
  import { link } from '$lib/i18n'
  import type { FightScreen } from '$lib/fighting/fightNavigation'
  export let language: 'fr' | 'en'
  export let screen: FightScreen
  export let playing = false
  $: fr = language === 'fr'
  $: steps = [
    { id: 'characters', label: fr ? 'Personnages' : 'Characters' },
    { id: 'stage', label: fr ? 'Terrain' : 'Stage' },
    { id: 'options', label: fr ? 'Règles & combat' : 'Rules & fight' },
  ]
  $: step = steps.findIndex((entry) => entry.id === screen)
</script>

<div class="clash-game" class:clash-game--playing={playing}>
  <div class="clash-frame">
    <header class="clash-topbar">
      <a
        class="clash-brand"
        href={$link('/fighting')}
        aria-label={fr ? 'Clash · Menu principal' : 'Clash · Main menu'}
      >
        <span class="clash-emblem" aria-hidden="true">C<span>/</span></span>
        <span><small>BLACK WHALE</small><strong>CLASH</strong></span>
      </a>
      <nav aria-label={fr ? 'Navigation Clash' : 'Clash navigation'}>
        <a href={$link('/fighting')} aria-current={screen === 'menu' ? 'page' : undefined}
          >{fr ? 'Jouer' : 'Play'}</a
        >
        <a
          href={$link('/fighting/academy')}
          aria-current={screen === 'academy' ? 'page' : undefined}>{fr ? 'Académie' : 'Academy'}</a
        >
        <a
          href={$link('/fighting/replays')}
          aria-current={screen === 'replays' ? 'page' : undefined}>Replays</a
        >
      </nav>
      <span class="clash-edition">HUNTER × HUNTER <b>01</b></span>
    </header>
    {#if step >= 0}
      <nav class="clash-steps" aria-label={fr ? 'Préparation du combat' : 'Fight preparation'}>
        <a
          class="clash-step-home"
          href={$link('/fighting')}
          aria-label={fr ? 'Retour au menu' : 'Back to menu'}
          >← <span>{fr ? 'Menu' : 'Menu'}</span></a
        >
        <ol>
          {#each steps as entry, i (entry.id)}
            <li class:complete={i < step} class:current={i === step}>
              <a
                href={$link(`/fighting/${entry.id}`)}
                aria-current={i === step ? 'step' : undefined}
              >
                <span>{i < step ? '✓' : `0${i + 1}`}</span>{entry.label}
              </a>
            </li>
          {/each}
        </ol>
        <span class="clash-step-count">0{step + 1} / 03</span>
      </nav>
    {/if}
    <slot />
    <div class="clash-bottomline">
      <span>BLACK WHALE: CLASH</span><span
        >{fr ? 'TON NEN. TES RÈGLES.' : 'YOUR NEN. YOUR RULES.'}</span
      >
    </div>
  </div>
</div>

<style>
  .clash-game {
    --clash-orange: #ff864b;
    --clash-violet: #b79aff;
    --clash-muted: #a29eac;
    min-height: calc(100svh - var(--header-height));
    padding: 0 clamp(1rem, 4vw, 4rem);
    color: #f4f0e8;
    background:
      radial-gradient(ellipse at 90% 20%, #53265b26, transparent 50%),
      radial-gradient(ellipse at 0% 65%, #9c451518, transparent 50%), #0d0c10;
  }
  .clash-frame {
    width: min(1440px, 100%);
    margin: auto;
  }
  .clash-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
    min-height: 88px;
    border-bottom: 1px solid #ffffff18;
  }
  .clash-brand {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    text-decoration: none;
    color: inherit;
  }
  .clash-brand small {
    display: block;
    font: 600 0.55rem/1.5 var(--font-mono);
    letter-spacing: 0.17em;
  }
  .clash-brand strong {
    display: block;
    font:
      italic 900 1.55rem/0.95 Arial,
      sans-serif;
    letter-spacing: -0.08em;
  }
  .clash-emblem {
    color: var(--clash-orange);
    font:
      italic 900 2.5rem/1 Arial,
      sans-serif;
    letter-spacing: -0.3em;
    padding-right: 0.5rem;
  }
  .clash-emblem span {
    color: var(--clash-violet);
  }
  .clash-topbar nav {
    display: flex;
    align-self: stretch;
    gap: 2.5rem;
  }
  .clash-topbar nav a {
    display: flex;
    align-items: center;
    border-bottom: 2px solid transparent;
    text-decoration: none;
    color: #aaa5b0;
    font: 600 0.8rem/1.3 var(--font-mono);
  }
  .clash-topbar nav a:hover,
  .clash-topbar nav a[aria-current] {
    color: #fff;
    border-bottom-color: var(--clash-orange);
  }
  .clash-edition {
    color: #77717f;
    font: 500 0.6rem/1 var(--font-mono);
    letter-spacing: 0.12em;
  }
  .clash-edition b {
    margin-left: 1rem;
    color: #c8c1cf;
  }
  .clash-steps {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    min-height: 80px;
    border-bottom: 1px solid #ffffff12;
  }
  .clash-steps a {
    color: #aaa4b3;
    text-decoration: none;
    font: 500 0.72rem/1.4 var(--font-mono);
  }
  .clash-step-home {
    padding-block: 0.8rem;
  }
  .clash-steps ol {
    display: flex;
    list-style: none;
    padding: 0;
    margin: 0;
    gap: 2.5rem;
  }
  .clash-steps li a {
    display: flex;
    gap: 0.65rem;
    align-items: center;
    min-height: 44px;
  }
  .clash-steps li span {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 1px solid #514857;
    font-size: 0.6rem;
  }
  .clash-steps .current a {
    color: #fff;
  }
  .clash-steps .current span {
    background: var(--clash-orange);
    border-color: var(--clash-orange);
    color: #170c08;
  }
  .clash-steps .complete span {
    color: var(--clash-orange);
    border-color: #ff864b80;
  }
  .clash-step-count {
    color: #77717f;
    font: 0.65rem var(--font-mono);
  }
  .clash-bottomline {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    border-top: 1px solid #ffffff12;
    padding: 1.2rem 0;
    color: #746d7b;
    font: 0.55rem var(--font-mono);
    letter-spacing: 0.13em;
  }
  :global(.app-shell:has(.clash-game) .hatsu-dock) {
    display: none;
  }
  @media (max-width: 700px) {
    .clash-topbar {
      min-height: 74px;
      gap: 1rem;
    }
    .clash-edition {
      display: none;
    }
    .clash-topbar nav {
      gap: 1rem;
    }
    .clash-topbar nav a {
      font-size: 0.65rem;
    }
    .clash-steps {
      min-height: 72px;
      gap: 0.5rem;
    }
    .clash-steps ol {
      gap: 0.8rem;
    }
    .clash-steps li a {
      flex-direction: column;
      gap: 0.3rem;
      font-size: 0.55rem;
      text-align: center;
    }
    .clash-step-count,
    .clash-step-home span {
      display: none;
    }
  }
</style>

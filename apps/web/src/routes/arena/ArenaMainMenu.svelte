<script lang="ts">
  import { onMount, tick } from 'svelte'
  import Seo from '$lib/components/Seo.svelte'
  import FightPortrait from '$lib/components/fighting/FightPortrait.svelte'
  import { DEFAULT_ARENA_FIGHTER, DEFAULT_ARENA_OPPONENT } from '$lib/arena/fighting'
  import { BANQUET_HALL_ID, type ArenaTerrainId } from '$lib/arena/terrain'
  import type { FighterId } from '$lib/fighting/types'
  import { link, locale, t } from '$lib/i18n'
  import { breadcrumbSchema } from '$lib/seo/schema'

  import ArenaDuelSetup from './ArenaDuelSetup.svelte'
  import ArenaModeChoices from './ArenaModeChoices.svelte'

  type Panel = 'free' | 'challenges' | 'campaign'

  let panel = $state<Panel | null>(null)
  let panelHeading: HTMLHeadingElement | undefined = $state()
  let fighterId = $state<FighterId>(DEFAULT_ARENA_FIGHTER)
  let opponentFighterId = $state<FighterId>(DEFAULT_ARENA_OPPONENT)
  let terrainId = $state<ArenaTerrainId>(BANQUET_HALL_ID)
  let ready = $state(false)
  const fr = $derived($locale === 'fr')
  const headings = $derived({
    free: fr ? 'Prépare ton duel' : 'Set up your duel',
    challenges: fr ? 'Défis du Nen' : 'Nen challenges',
    campaign: fr ? 'Missions de campagne' : 'Campaign missions',
  })
  const modes = $derived([
    {
      id: 'free',
      label: $t.arena.ui.freeCombat,
      kind: 'Solo',
      description: fr
        ? 'Affronte l’IA en combat d’action 3D à bord du Black Whale.'
        : 'Face an AI opponent in 3D action combat aboard the Black Whale.',
      action: fr ? 'Préparer le duel' : 'Set up the duel',
    },
    {
      id: 'challenges',
      label: headings.challenges,
      kind: fr ? 'Objectifs' : 'Objectives',
      description: fr
        ? 'Choisis un objectif de combat pour travailler ton Ryu, ta garde ou ton Gyo.'
        : 'Pick a combat objective to practice Ryu, guarding or Gyo.',
      action: fr ? 'Voir les défis' : 'View challenges',
    },
    {
      id: 'campaign',
      label: fr ? 'Campagne' : 'Campaign',
      kind: 'Progression',
      description: fr
        ? 'Réussis les missions pour débloquer les prochaines épreuves.'
        : 'Complete missions to unlock the next trials.',
      action: fr ? 'Voir les missions' : 'View missions',
    },
    {
      id: 'online',
      label: fr ? 'Duel privé en ligne' : 'Private online duel',
      kind: fr ? '2 joueurs' : '2 players',
      description: fr
        ? 'Crée un salon et partage le lien d’invitation avec ton adversaire.'
        : 'Create a room and send the invite link to your opponent.',
      action: fr ? 'Ouvrir le salon' : 'Open lobby',
      href: $link('/arena/pvp'),
    },
  ] as const)

  onMount(() => {
    ready = true
  })

  async function togglePanel(next: Panel) {
    panel = panel === next ? null : next
    if (!panel) return
    await tick()
    panelHeading?.focus({ preventScroll: true })
    panelHeading?.scrollIntoView({ block: 'start' })
  }
</script>

<Seo
  title={$t.arena.title}
  description={$t.arena.seoDescription}
  jsonLd={breadcrumbSchema([
    { name: $t.common.home, path: $link('/') },
    { name: $t.arena.breadcrumb, path: $link('/arena') },
  ])}
/>

<div class="arena-menu">
  <div class="menu-shell">
    <header class="menu-hero">
      <div class="hero-copy">
        <p class="hero-kicker">Black Whale / Arena</p>
        <h1>{fr ? 'Entre dans' : 'Enter the'} <span>{fr ? 'l’arène.' : 'arena.'}</span></h1>
      </div>
      <div class="hero-art" aria-hidden="true">
        <div class="hero-fighter player"><FightPortrait id={DEFAULT_ARENA_FIGHTER} /></div>
        <span class="versus">VS</span>
        <div class="hero-fighter opponent">
          <FightPortrait id={DEFAULT_ARENA_OPPONENT} reverse />
        </div>
      </div>
    </header>

    <section aria-labelledby="arena-mode-heading">
      <h2 id="arena-mode-heading" class="mode-heading">
        {fr ? 'Choisis ton mode' : 'Choose your mode'}
      </h2>
      <div class="mode-grid">
        {#each modes as mode (mode.id)}
          {#snippet content()}
            <span class="mode-kind">{mode.kind}</span>
            <strong id={`arena-mode-${mode.id}`}>{mode.label}</strong>
            <span class="mode-description" id={`arena-description-${mode.id}`}
              >{mode.description}</span
            >
            <span class="mode-action">
              {mode.action}<span aria-hidden="true"
                >{'href' in mode ? '↗' : panel === mode.id ? '↑' : '↓'}</span
              >
            </span>
          {/snippet}
          {#if 'href' in mode}
            <a
              class="mode-card"
              href={mode.href}
              aria-labelledby={`arena-mode-${mode.id}`}
              aria-describedby={`arena-description-${mode.id}`}
            >
              {@render content()}
            </a>
          {:else}
            <button
              class="mode-card"
              class:featured={mode.id === 'free'}
              type="button"
              disabled={!ready}
              aria-expanded={panel === mode.id}
              aria-controls="arena-mode-options"
              aria-labelledby={`arena-mode-${mode.id}`}
              aria-describedby={`arena-description-${mode.id}`}
              onclick={() => togglePanel(mode.id)}
            >
              {@render content()}
            </button>
          {/if}
        {/each}
      </div>

      <div id="arena-mode-options" hidden={!panel} class="mode-options">
        {#if panel}
          <h3 bind:this={panelHeading} tabindex="-1">
            {headings[panel]}
          </h3>
          {#if panel === 'free'}
            <ArenaDuelSetup bind:fighterId bind:opponentFighterId bind:terrainId />
          {:else}
            <ArenaModeChoices {panel} />
          {/if}
        {/if}
      </div>
    </section>
  </div>
</div>

<style>
  .arena-menu {
    --arena-gold: #ffda61;
    --arena-cyan: #9ddce7;
    min-height: calc(100dvh - var(--header-height));
    background:
      radial-gradient(ellipse at 77% 12%, #14343c 0%, transparent 45%),
      linear-gradient(135deg, #101a21, #080f14 67%);
    color: #f6f3e9;
  }

  .menu-shell {
    width: min(72rem, calc(100% - clamp(2rem, 8vw, 7rem)));
    margin: 0 auto;
    padding-bottom: clamp(2rem, 5vw, 4.5rem);
  }

  .menu-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: center;
    min-height: 21.5rem;
    overflow: hidden;
  }

  .hero-copy {
    position: relative;
    z-index: 1;
    padding-block: 2rem;
  }

  .hero-kicker,
  .mode-heading,
  .mode-kind,
  .mode-action {
    font-family: var(--font-mono, monospace);
    text-transform: uppercase;
    letter-spacing: 0.11em;
  }

  .hero-kicker {
    margin: 0 0 1rem;
    color: var(--arena-cyan);
    font-size: 0.72rem;
  }

  h1 {
    margin: 0;
    font:
      italic 900 clamp(3.4rem, 7vw, 6.55rem)/0.91 Arial,
      sans-serif;
    letter-spacing: -0.075em;
    text-transform: uppercase;
  }

  h1 span {
    display: block;
    color: var(--arena-gold);
  }

  .hero-art {
    position: relative;
    isolation: isolate;
    height: 21rem;
  }

  .hero-art::before {
    position: absolute;
    z-index: -1;
    inset: 19% 13% 13%;
    border: 1px solid #a5e5ef44;
    background: linear-gradient(115deg, #d2a94a3b, #22728754 62%, #5abccc23);
    transform: skew(-25deg) rotate(-10deg);
    content: '';
  }

  .hero-fighter {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 56%;
  }

  .player {
    left: 1%;
    transform: rotate(-6deg);
  }

  .opponent {
    right: 0;
    transform: rotate(6deg);
  }

  .versus {
    position: absolute;
    z-index: 1;
    top: 46%;
    left: 50%;
    font:
      italic 900 clamp(2rem, 6vw, 4.5rem)/1 Arial,
      sans-serif;
    letter-spacing: -0.09em;
    text-shadow: 3px 3px #4f806e;
    transform: translateX(-50%) rotate(-10deg);
  }

  .mode-heading {
    margin: 0 0 1rem;
    padding: 0.65rem 0;
    border-bottom: 1px solid #9ddce73d;
    color: #d8e7e9;
    font-size: 0.8rem;
  }

  .mode-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.9rem;
  }

  .mode-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    min-width: 0;
    min-height: 11rem;
    overflow: hidden;
    padding: clamp(1rem, 2vw, 1.5rem);
    border: 1px solid #35505a;
    background: linear-gradient(124deg, #1b333b, #111d26 72%);
    color: inherit;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
    transition:
      border-color 150ms,
      transform 150ms;
  }

  .featured {
    border-color: #d4ac53;
    background: linear-gradient(119deg, #4a3920, #1d211e 77%);
  }

  .mode-card:hover,
  .mode-card[aria-expanded='true'] {
    border-color: var(--arena-cyan);
  }

  .mode-card:hover {
    transform: translateY(-3px);
  }

  .featured:hover {
    border-color: var(--arena-gold);
  }

  .mode-card:focus-visible,
  h3:focus-visible {
    outline: 2px solid var(--arena-gold);
    outline-offset: 3px;
  }

  .mode-kind,
  .mode-action {
    color: var(--arena-cyan);
    font-size: 0.68rem;
  }

  .featured .mode-kind,
  .featured .mode-action {
    color: var(--arena-gold);
  }

  .mode-card strong {
    font:
      italic 900 clamp(1.3rem, 2.75vw, 2.05rem)/1.1 Arial,
      sans-serif;
    letter-spacing: -0.045em;
    text-transform: uppercase;
  }

  .mode-description {
    max-width: 28rem;
    color: #cad3d4;
    font-size: 0.88rem;
    line-height: 1.45;
  }

  .mode-action {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-top: auto;
    padding-top: 0.55rem;
  }

  .mode-action > span {
    font:
      1.3rem/1 Arial,
      sans-serif;
  }

  .mode-options {
    margin-top: 1rem;
    padding: clamp(1rem, 2vw, 1.5rem);
    border: 1px solid #35505a;
    background: #101d24;
  }

  .mode-options h3 {
    margin: 0 0 0.8rem;
    font-size: 1.1rem;
    scroll-margin-block: calc(var(--header-height) + 1rem);
  }

  @media (max-width: 600px) {
    .menu-hero {
      grid-template-columns: 1fr;
      min-height: 0;
    }

    .hero-copy {
      padding-block: 2rem 0;
    }

    h1 {
      font-size: clamp(3rem, 12vw, 4.1rem);
    }

    .hero-art {
      height: 13.75rem;
    }

    .mode-grid {
      grid-template-columns: 1fr;
      gap: 0.65rem;
    }

    .mode-card {
      min-height: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .mode-card {
      transition: none;
    }

    .mode-card:hover {
      transform: none;
    }
  }
</style>

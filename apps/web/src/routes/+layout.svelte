<script lang="ts">
  import MangaIcon from '$lib/components/icons/MangaIcon.svelte'
  import '../app.css'
  import { page } from '$app/stores'
  import GlobalHatsuController from '$lib/nen/GlobalHatsuController.svelte'
  import GlobalHatsuEffects from '$lib/nen/GlobalHatsuEffects.svelte'
  import CommandPalette from '$lib/components/CommandPalette.svelte'
  import AmbientToggle from '$lib/audio/AmbientToggle.svelte'
  import LanguageSwitcher from '$lib/i18n/LanguageSwitcher.svelte'
  import SpoilerFilter from '$lib/components/SpoilerFilter.svelte'
  import { link, routePath, t } from '$lib/i18n'
  import { onMount, tick } from 'svelte'
  import { ambientWasEnabled, startAmbient } from '$lib/audio/ambient'
  import type { LayoutData } from './$types'
  import { PUBLIC_FEATURES } from '$lib/config/features'

  export let data: LayoutData

  // Resume a saved audio preference even while its menu control is unmounted.
  onMount(() => {
    if (!ambientWasEnabled()) return
    // Autoplay is blocked until the visitor interacts, so a returning listener's
    // preference is honoured on their first click or key press, not on load.
    const resume = () => {
      void startAmbient()
      teardown()
    }
    const teardown = () => {
      window.removeEventListener('pointerdown', resume)
      window.removeEventListener('keydown', resume)
    }
    window.addEventListener('pointerdown', resume, { once: true })
    window.addEventListener('keydown', resume, { once: true })
    return teardown
  })

  let menuOpen = false
  let paletteOpen = false
  let menuPanel: HTMLElement | undefined
  let menuButton: HTMLButtonElement | undefined

  // `href` is the unprefixed route; `$link` turns it into the URL for the
  // locale being rendered.
  $: primaryNavigation = [
    { href: '/ship', label: $t.nav.explore },
    { href: '/timeline', label: $t.nav.timeline },
    { href: '/characters', label: $t.nav.characters },
    ...(PUBLIC_FEATURES.perspectives ? [{ href: '/perspectives', label: $t.nav.knowledge }] : []),
  ]

  $: secondaryNavigation = [
    { href: '/abilities', label: $t.nav.abilityArchive },
    ...(PUBLIC_FEATURES.compare ? [{ href: '/compare', label: $t.nav.comparePerspectives }] : []),
    { href: '/relationships', label: $t.nav.factionNetwork },
    { href: '/simulations', label: $t.nav.simulations },
    { href: '/tour', label: $t.nav.virtualTour },
    { href: '/tour/modes', label: $t.nav.tourModes },
    { href: '/tour/sources', label: $t.nav.shipSources },
    { href: '/arena', label: $t.nav.arena },
    { href: '/reconstruction', label: $t.nav.reconstruction },
  ]

  // Compared against the locale-stripped path, so a section stays highlighted
  // in every language.
  const isActive = (href: string) => $routePath.startsWith(href)

  // The drawer that carries the secondary sections is behind {#if menuOpen},
  // so nothing links to them in the server-rendered markup — crawlers see the
  // Ability Archive, Faction Network and Simulations as orphans. The footer is
  // the one place every route can expose them without any JavaScript.
  // UTC keeps the year identical between the server render and hydration.
  const copyrightYear = new Date().getUTCFullYear()

  const REPOSITORY_URL = 'https://github.com/PISSARAW/Black-Whale'
  const LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/'

  function closeMenu() {
    menuOpen = false
  }

  async function toggleMenu() {
    menuOpen = !menuOpen
    if (menuOpen) {
      await tick()
      menuPanel?.focus()
    } else {
      menuButton?.focus()
    }
  }

  function openPalette() {
    menuOpen = false
    paletteOpen = true
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && menuOpen) {
      menuOpen = false
      menuButton?.focus()
    }
  }

  // A drawer covering the viewport must not let the page scroll behind it.
  $: if (typeof document !== 'undefined') {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
  }

  // Any navigation (including browser back) closes the drawer.
  $: if ($page.url.pathname) menuOpen = false
</script>

<svelte:head>
  <meta name="theme-color" content="#070a0c" />
  <meta name="color-scheme" content="dark" />
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="app-shell">
  <a class="skip-link" href="#main-content">{$t.layout.skipToContent}</a>

  <header class="app-header" data-hatsu-pass>
    <a href={$link('/')} class="brand" aria-label={$t.layout.brandHome} onclick={closeMenu}>
      <strong>Black Whale</strong>
    </a>

    <nav class="primary-nav" aria-label={$t.layout.primaryNavigation}>
      {#each primaryNavigation as item (item.href)}
        <a
          href={$link(item.href)}
          class:active={isActive(item.href)}
          aria-current={isActive(item.href) ? 'page' : undefined}
        >
          {item.label}
        </a>
      {/each}
    </nav>

    <div class="header-meta">
      <button type="button" onclick={openPalette} aria-label={$t.layout.openQuickNavigation}>
        <span>{$t.layout.quickFind}</span><kbd>⌘K</kbd>
      </button>
      <span class="spoiler-slot">
        <SpoilerFilter limit={data.spoilerFilter.limit} chapters={data.spoilerFilter.chapters} />
      </span>
      <span class="language-slot"><LanguageSwitcher /></span>
    </div>

    <button
      bind:this={menuButton}
      class="menu-toggle"
      class:open={menuOpen}
      type="button"
      aria-label={menuOpen ? $t.layout.closeMenu : $t.layout.openMenu}
      aria-expanded={menuOpen}
      aria-controls="site-menu"
      onclick={toggleMenu}
    >
      <span></span>
      <span></span>
    </button>
  </header>

  {#if menuOpen}
    <div class="menu-backdrop" role="presentation" onclick={closeMenu}></div>
    <div
      bind:this={menuPanel}
      id="site-menu"
      class="site-menu"
      role="dialog"
      aria-modal="true"
      aria-label={$t.layout.siteNavigation}
      tabindex="-1"
      data-hatsu-pass
    >
      <div class="menu-scroll">
        <div class="menu-heading">
          <p>{$t.layout.menuDossier}</p>
        </div>

        <nav class="menu-primary" aria-label={$t.layout.mainSections}>
          {#each primaryNavigation as item (item.href)}
            <a
              href={$link(item.href)}
              class:active={isActive(item.href)}
              aria-current={isActive(item.href) ? 'page' : undefined}
              onclick={closeMenu}
            >
              {item.label}
            </a>
          {/each}
        </nav>

        <nav class="menu-sections" aria-label={$t.layout.archiveSections}>
          {#each secondaryNavigation as item (item.href)}
            <a href={$link(item.href)} class:active={isActive(item.href)} onclick={closeMenu}>
              <strong>{item.label}</strong>
            </a>
          {/each}
        </nav>

        <button class="menu-search" type="button" onclick={openPalette}>
          <span aria-hidden="true"><MangaIcon name="search" /></span>
          <span>{$t.layout.quickFind}</span>
        </button>

        <!-- The spoiler filter rides in the drawer at every width: the header
             row that carries it drops the chip on narrow desktops and is hidden
             outright on mobile, and the one control that decides what the whole
             archive shows must never be unreachable. -->
        <div class="menu-spoiler">
          <SpoilerFilter
            compact
            limit={data.spoilerFilter.limit}
            chapters={data.spoilerFilter.chapters}
          />
        </div>

        <!-- Audio settings live in the menu; the language switcher also stays
             reachable here when the compact header is shown. -->
        <div class="menu-audio">
          <AmbientToggle />
          <LanguageSwitcher compact />
        </div>
      </div>
    </div>
  {/if}

  <main id="main-content">
    {#key $page.url.pathname}
      <div class="route-shell">
        <slot />
      </div>
    {/key}
  </main>

  <footer class="app-footer" data-hatsu-pass>
    <div class="footer-brand">
      <strong>Black Whale</strong>
    </div>

    <nav class="footer-nav" aria-label={$t.layout.archiveSections}>
      <p>{$t.layout.footerSections}</p>
      <ul>
        {#each primaryNavigation as item (item.href)}
          <li><a href={$link(item.href)}>{item.label}</a></li>
        {/each}
        {#each secondaryNavigation as item (item.href)}
          <li><a href={$link(item.href)}>{item.label}</a></li>
        {/each}
      </ul>
    </nav>

    <div class="footer-legal">
      <span>{$t.layout.copyright(copyrightYear)}</span>
      <span>{$t.layout.disclaimer}</span>
      <!-- The catalogue and the hand-drawn maps are CC BY 4.0 (LICENSE-DATA),
           which asks for the credit wherever the material is displayed — every
           route shows one or the other, so it belongs in the shared footer. -->
      <span class="footer-credit">
        {$t.layout.dataCreditPrefix}
        <a href={REPOSITORY_URL} rel="noreferrer" target="_blank"
          >{$t.layout.dataCreditRepository}</a
        >
        {$t.layout.dataCreditLicensedUnder}
        <a href={LICENSE_URL} rel="license noreferrer" target="_blank">CC BY 4.0</a>
      </span>
    </div>
  </footer>

  <!-- The Hatsu layer lives at the root so its state and mechanics survive navigation. -->
  <GlobalHatsuEffects />
  <GlobalHatsuController />
  <CommandPalette bind:open={paletteOpen} />
</div>

<style>
  .app-shell {
    min-height: 100vh;
  }
  .app-header {
    position: sticky;
    top: 0;
    z-index: 80;
    display: grid;
    grid-template-columns: minmax(10rem, 1fr) auto minmax(8rem, 1fr) 3.5rem;
    min-height: var(--header-height);
    align-items: stretch;
    border-bottom: 1px solid var(--line-subtle);
    background: var(--surface-void);
  }
  .brand {
    display: flex;
    align-items: center;
    padding: 0 var(--space-5);
    color: var(--text-primary);
    text-decoration: none;
  }
  .brand strong {
    font-family: var(--font-display);
    font-size: 1.4rem;
    font-weight: 400;
    letter-spacing: 0.04em;
  }
  .primary-nav {
    display: flex;
    align-items: stretch;
  }
  .primary-nav a {
    display: flex;
    align-items: center;
    padding: 0 1rem;
    border-bottom: 2px solid transparent;
    color: var(--text-secondary);
    font-size: 0.8rem;
    text-decoration: none;
  }
  .primary-nav a:hover {
    color: var(--text-primary);
  }
  .primary-nav a.active {
    color: var(--text-primary);
    border-bottom-color: var(--accent-gold);
  }
  .header-meta {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 0 1rem;
    font-size: 0.65rem;
  }
  .header-meta button {
    display: flex;
    min-height: 44px;
    align-items: center;
    gap: 0.6rem;
    border: 0;
    background: none;
    color: var(--text-secondary);
    cursor: pointer;
    font: inherit;
  }
  .header-meta kbd {
    color: var(--text-muted);
    font-size: 0.6rem;
  }
  .menu-toggle {
    display: grid;
    min-width: 3.5rem;
    place-content: center;
    gap: 0.35rem;
    border: 0;
    background: none;
    color: var(--text-primary);
    cursor: pointer;
  }
  .menu-toggle span {
    display: block;
    width: 1.1rem;
    height: 1px;
    background: currentColor;
  }
  .menu-toggle.open span:first-child {
    transform: translateY(0.2rem) rotate(45deg);
  }
  .menu-toggle.open span:last-child {
    transform: translateY(-0.2rem) rotate(-45deg);
  }
  .menu-backdrop {
    position: fixed;
    z-index: 68;
    inset: var(--header-height) 0 0;
    background: rgba(0, 0, 0, 0.55);
  }
  .site-menu {
    position: fixed;
    z-index: 72;
    top: var(--header-height);
    right: 0;
    bottom: 0;
    width: min(27rem, 100%);
    border-left: 1px solid var(--line-default);
    background: var(--surface-deep);
  }
  .site-menu:focus {
    outline: none;
  }
  .menu-scroll {
    display: flex;
    height: 100%;
    flex-direction: column;
    gap: 1.5rem;
    overflow-y: auto;
    padding: 1.5rem 2rem max(2rem, env(safe-area-inset-bottom));
    overscroll-behavior: contain;
  }
  .menu-heading p {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  .menu-sections a {
    display: block;
    min-height: 44px;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--line-subtle);
    color: var(--text-secondary);
    text-decoration: none;
  }
  .menu-sections a strong {
    font-size: 0.95rem;
    font-weight: 400;
  }
  .menu-sections a:hover,
  .menu-sections a.active {
    color: var(--accent-gold-bright);
  }
  .menu-primary,
  .menu-search {
    display: none;
  }
  .menu-spoiler {
    padding-top: 1rem;
    border-top: 1px solid var(--line-subtle);
    color: var(--text-secondary);
    font-size: 0.75rem;
  }
  .menu-audio {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    color: var(--text-secondary);
    font-size: 0.75rem;
  }
  .app-footer {
    display: grid;
    grid-template-columns: 1fr 3fr;
    gap: 1.5rem 3rem;
    margin: 0 auto;
    padding: 2rem var(--page-gutter) max(2rem, env(safe-area-inset-bottom));
    border-top: 1px solid var(--line-subtle);
  }
  .footer-brand strong {
    font-size: 0.9rem;
    font-weight: 500;
  }
  .footer-nav p {
    margin: 0 0 1rem;
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  .footer-nav ul {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .footer-nav a {
    color: var(--text-secondary);
    font-size: 0.75rem;
    text-decoration: none;
  }
  .footer-nav a:hover {
    color: var(--text-primary);
    text-decoration: underline;
  }
  .footer-legal {
    display: grid;
    grid-column: 1 / -1;
    gap: 0.4rem;
    padding-top: 1rem;
    color: var(--text-muted);
    font-size: 0.65rem;
    line-height: 1.6;
  }
  .footer-credit a {
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }
  .route-shell {
    min-height: calc(100vh - var(--header-height));
  }
  @media (max-width: 1200px) {
    .spoiler-slot {
      display: none;
    }
  }
  @media (max-width: 800px) {
    .app-header {
      grid-template-columns: 1fr auto;
    }
    .primary-nav,
    .header-meta {
      display: none;
    }
    .brand {
      padding-inline: 1rem;
    }
    .menu-scroll {
      padding-inline: 1.25rem;
    }
    .menu-primary {
      display: grid;
    }
    .menu-primary a {
      display: flex;
      min-height: 44px;
      align-items: center;
      padding: 0.6rem 0;
      color: var(--text-primary);
      font-size: 1rem;
      text-decoration: none;
    }
    .menu-primary a.active {
      color: var(--accent-gold-bright);
    }
    .menu-search {
      display: flex;
      min-height: 44px;
      align-items: center;
      gap: 0.6rem;
      padding: 0.6rem 0;
      border: 0;
      background: none;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 0.85rem;
    }
    .app-footer {
      grid-template-columns: 1fr;
    }
  }
</style>

<script lang="ts">
  import { page } from '$app/stores'
  import { locale, routePath, t } from '$lib/i18n'
  import { LOCALES, LOCALE_LABELS, localizePath } from '$lib/i18n/config'

  let { compact = false }: { compact?: boolean } = $props()

  // Plain links rather than a <select>: they work with JavaScript off and give
  // crawlers a real path to each locale. View state in the query string (spoiler
  // limit, selected character) survives the switch.
  //
  // The switch reloads instead of navigating client-side: `<html lang>` is
  // stamped by the server hook, so a soft navigation would leave the document
  // declaring the language the visitor just left.
  let targets = $derived(
    LOCALES.map((candidate) => ({
      code: candidate,
      label: LOCALE_LABELS[candidate],
      href: `${localizePath($routePath, candidate)}${$page.url.search}`,
    })),
  )
</script>

<nav class="language-switcher" class:compact aria-label={$t.layout.chooseLanguage}>
  {#each targets as target (target.code)}
    <a
      href={target.href}
      hreflang={target.code}
      lang={target.code}
      class:active={$locale === target.code}
      aria-current={$locale === target.code ? 'true' : undefined}
      data-sveltekit-reload
    >
      <abbr title={target.label}>{target.code.toUpperCase()}</abbr>
    </a>
  {/each}
</nav>

<style>
  .language-switcher {
    display: flex;
    align-items: center;
    gap: 0.15rem;
  }

  .language-switcher a {
    padding: 0.28rem 0.4rem;
    border-radius: 0.25rem;
    color: var(--text-faint);
    font: inherit;
    letter-spacing: inherit;
    text-decoration: none;
  }

  .language-switcher a:hover {
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-primary);
  }

  .language-switcher a.active {
    color: var(--accent-gold);
  }

  .language-switcher abbr {
    text-decoration: none;
  }

  .compact a {
    padding: 0.5rem 0.7rem;
    border: 1px solid var(--line-subtle);
    font-size: 0.62rem;
  }
</style>

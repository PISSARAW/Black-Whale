<script lang="ts">
  import { link, t } from '$lib/i18n'
  export let navigation: Array<{ href: string; label: string }>
  const copyrightYear = new Date().getUTCFullYear()
  const REPOSITORY_URL = 'https://github.com/PISSARAW/Black-Whale'
  const LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/'
</script>

<footer class="app-footer" data-hatsu-pass>
  <div class="footer-brand">
    <strong>Black Whale</strong>
  </div>

  <nav class="footer-nav" aria-label={$t.layout.archiveSections}>
    <p>{$t.layout.footerSections}</p>
    <ul>
      {#each navigation as item (item.href)}
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
      <a href={REPOSITORY_URL} rel="noreferrer" target="_blank">{$t.layout.dataCreditRepository}</a>
      {$t.layout.dataCreditLicensedUnder}
      <a href={LICENSE_URL} rel="license noreferrer" target="_blank">CC BY 4.0</a>
    </span>
  </div>
</footer>

<style>
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
  @media (max-width: 800px) {
    .app-footer {
      grid-template-columns: 1fr;
    }
  }
</style>

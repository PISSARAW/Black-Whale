<script lang="ts">
  import type { PageData } from './$types'
  import Seo from '$lib/components/Seo.svelte'
  import { articleSchema, breadcrumbSchema, publisherSchema } from '$lib/seo/schema'
  import { link, locale, t } from '$lib/i18n'
  import { LOCALE_TAGS } from '$lib/i18n/config'

  let { data }: { data: PageData } = $props()
  const repository = 'https://github.com/PISSARAW/Black-Whale'
</script>

<Seo
  title={$t.discovery.about.title}
  description={$t.discovery.about.seoDescription}
  type="article"
  jsonLd={[
    articleSchema({
      name: $t.discovery.about.title,
      path: $link('/about'),
      description: $t.discovery.about.seoDescription,
      language: LOCALE_TAGS[$locale].html,
      modifiedAt: data.modifiedAt,
      type: 'AboutPage',
      mainEntity: { '@id': 'https://exploreblackwhale.com/#publisher' },
    }),
    publisherSchema(),
    breadcrumbSchema([
      { name: $t.common.home, path: $link('/') },
      { name: $t.discovery.about.title, path: $link('/about') },
    ]),
  ]}
/>

<article class="about-page">
  <header>
    <p class="eyebrow">{$t.discovery.about.eyebrow}</p>
    <h1>{$t.discovery.about.title}</h1>
    <p class="lede">{$t.discovery.about.lede}</p>
  </header>

  <section>
    <h2>{$t.discovery.about.scopeTitle}</h2>
    <p>{$t.discovery.about.scope(data.coverage.first, data.coverage.last)}</p>
  </section>
  <section>
    <h2>{$t.discovery.about.methodTitle}</h2>
    <p>{$t.discovery.about.method}</p>
    <a href={$link('/tour/sources')}>{$t.discovery.about.shipSources} →</a>
  </section>
  <section>
    <h2>{$t.discovery.about.uncertaintyTitle}</h2>
    <p>{$t.discovery.about.uncertainty}</p>
  </section>
  <section>
    <h2>{$t.discovery.about.correctionsTitle}</h2>
    <p>{$t.discovery.about.corrections}</p>
    <a href={repository} rel="noreferrer" target="_blank">{$t.discovery.about.repository} ↗</a>
  </section>
  <footer>
    <p>{$t.discovery.about.disclaimer}</p>
    <small>{$t.discovery.modified(data.modifiedAt)}</small>
  </footer>
</article>

<style>
  .about-page {
    max-width: 760px;
    margin: auto;
    padding: clamp(3rem, 7vw, 6rem) var(--page-gutter) 6rem;
  }
  header {
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--line-default);
  }
  .eyebrow {
    margin: 0 0 0.75rem;
    color: var(--accent-gold-bright);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }
  h1 {
    margin: 0;
    font-size: clamp(2.8rem, 7vw, 4.8rem);
    font-weight: 450;
    line-height: 1.05;
  }
  .lede {
    margin: 1.5rem 0 0;
    color: var(--text-secondary);
    font-size: 1.15rem;
    line-height: 1.8;
  }
  section {
    padding: 2rem 0;
    border-bottom: 1px solid var(--line-default);
  }
  h2 {
    margin: 0;
    font-size: 1.15rem;
  }
  section p,
  footer p {
    margin: 0.8rem 0 0;
    color: var(--text-secondary);
    line-height: 1.8;
  }
  a {
    display: inline-block;
    margin-top: 1rem;
    color: var(--accent-gold-bright);
  }
  footer {
    padding-top: 2rem;
  }
  footer small {
    display: block;
    margin-top: 1rem;
    color: var(--text-muted);
  }
</style>

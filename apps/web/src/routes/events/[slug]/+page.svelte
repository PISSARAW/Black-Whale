<script lang="ts">
  import type { PageData } from './$types'
  import Seo from '$lib/components/Seo.svelte'
  import { articleSchema, breadcrumbSchema, publisherSchema } from '$lib/seo/schema'
  import { link, locale, t } from '$lib/i18n'
  import { LOCALE_TAGS } from '$lib/i18n/config'

  let { data }: { data: PageData } = $props()
  let event = $derived(data.event)
  let description = $derived($t.discovery.event.seoDescription(event.title, event.chapter))
  const chapterNumber = (chapterId: string) => chapterId.replace(/^ch-/, '').split('.')[0]
</script>

<Seo
  title={$t.discovery.event.seoTitle(event.title)}
  {description}
  type="article"
  jsonLd={[
    articleSchema({
      name: event.title,
      path: $link(`/events/${event.id}`),
      description: event.summary ?? description,
      language: LOCALE_TAGS[$locale].html,
      modifiedAt: event.modifiedAt,
      mainEntity: { '@type': 'Thing', name: event.title },
    }),
    publisherSchema(),
    breadcrumbSchema([
      { name: $t.common.home, path: $link('/') },
      { name: $t.discovery.event.archive, path: $link('/timeline') },
      { name: event.title, path: $link(`/events/${event.id}`) },
    ]),
  ]}
/>

<article class="event-dossier" data-event-detail={event.id}>
  <nav><a href={$link('/timeline')}>← {$t.discovery.event.archive}</a></nav>
  <header>
    <p class="chapter">{$t.discovery.chapter(event.chapter)} · {event.chapterTitle}</p>
    <h1>{event.title}</h1>
    <p class="answer">{event.summary}</p>
  </header>

  <dl class="facts">
    <div>
      <dt>{$t.discovery.event.chapter}</dt>
      <dd>{$t.discovery.chapter(event.chapter)}</dd>
    </div>
    <div>
      <dt>{$t.discovery.event.time}</dt>
      <dd>
        {data.chronology?.occurredAtLabel ?? event.occurredAtLabel ?? $t.discovery.event.undated}
      </dd>
    </div>
    <div>
      <dt>{$t.discovery.event.location}</dt>
      <dd>{data.location?.name ?? $t.discovery.event.unknownLocation}</dd>
    </div>
  </dl>

  {#if data.participants.length}
    <section>
      <h2>{$t.discovery.event.participants}</h2>
      <ul class="chips">
        {#each data.participants as participant (participant.id)}
          <li><a href={$link(`/characters/${participant.id}`)}>{participant.name}</a></li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if data.uses.length}
    <section>
      <h2>{$t.discovery.event.abilities}</h2>
      <ul class="uses">
        {#each data.uses as use (use.id)}
          <li>
            <a href={$link(`/abilities/${use.abilityId}`)}>{use.abilityName}</a>
            <span>{use.userName} · {use.note}</span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <section class="sources">
    <h2>{$t.discovery.sources}</h2>
    <ul class="chips">
      {#each event.sources as source (source.chapterId)}
        <li>
          <a href={$link(`/timeline#chapter-${chapterNumber(source.chapterId)}`)}
            >{$t.discovery.chapter(chapterNumber(source.chapterId))}</a
          >
          {#if source.note}<small>{source.note}</small>{/if}
        </li>
      {/each}
    </ul>
  </section>

  <div class="actions">
    <a href={$link(`/timeline#chapter-${event.chapter}`)}>{$t.discovery.event.openTimeline} →</a>
    {#if data.chronology}
      <a href={$link(`/ship?eventId=${data.chronology.databaseId}`)}
        >{$t.discovery.event.openMap} →</a
      >
    {/if}
  </div>
  <footer>{$t.discovery.modified(event.modifiedAt)}</footer>
</article>

<style>
  .event-dossier {
    max-width: 900px;
    margin: auto;
    padding: 2rem var(--page-gutter) 6rem;
  }
  a {
    color: var(--accent-gold-bright);
  }
  header {
    padding: clamp(2rem, 6vw, 5rem) 0 3rem;
    border-bottom: 1px solid var(--line-default);
  }
  .chapter {
    color: var(--accent-gold-bright);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  h1 {
    margin: 0;
    font-size: clamp(2.7rem, 7vw, 5.4rem);
    font-weight: 450;
    line-height: 1.05;
  }
  .answer {
    max-width: 760px;
    color: var(--text-secondary);
    font-size: 1.05rem;
    line-height: 1.85;
  }
  .facts {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    margin: 0;
    background: var(--line-default);
  }
  .facts div {
    padding: 1.2rem;
    background: var(--surface-void);
  }
  dt {
    color: var(--text-muted);
    font-size: 0.72rem;
  }
  dd {
    margin: 0.45rem 0 0;
    line-height: 1.6;
  }
  section {
    padding: 2.5rem 0;
    border-bottom: 1px solid var(--line-default);
  }
  h2 {
    margin: 0 0 1rem;
    font-size: 1.15rem;
  }
  .chips,
  .uses {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
    padding: 0;
    list-style: none;
  }
  .chips li,
  .uses li {
    padding: 0.7rem 0.85rem;
    border: 1px solid var(--line-default);
  }
  .uses span,
  small {
    display: block;
    margin-top: 0.35rem;
    color: var(--text-muted);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    padding-top: 2.5rem;
  }
  footer {
    padding-top: 2rem;
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  @media (max-width: 700px) {
    .facts {
      grid-template-columns: 1fr;
    }
  }
</style>

<script lang="ts">
  import Seo from '$lib/components/Seo.svelte'
  import KnowledgeStatus from '$lib/components/perspective/KnowledgeStatus.svelte'
  import PerspectiveTimeline from '$lib/components/perspective/PerspectiveTimeline.svelte'
  import PlanMap from '$lib/components/map/PlanMap.svelte'
  import { displayName } from '$lib/utils/displayNames'
  import { link, locale, t } from '$lib/i18n'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  let name = $derived(displayName(data.character.canonicalName, $locale))
  let view = $derived(data.view)

  function details(entry: PageData['knowledge'][number]) {
    const parts = [$t.knowledgeDetail.since(entry.fromChapter)]
    if (entry.source) parts.push($t.knowledgeDetail.toldBy(entry.source.label))
    return parts.join(' · ')
  }

  type Lane = NonNullable<PageData['view']>['streams']['body']

  /** The lanes carry stored enum values; this is where the catalogue words them. */
  function worded(lane: Lane): Lane {
    return lane.map((point) => ({
      ...point,
      label: point.labelEnum
        ? ($t.identity.enums[point.labelEnum][point.label] ?? point.label)
        : point.label,
      detail:
        point.detail && point.detailEnum
          ? ($t.identity.enums[point.detailEnum][point.detail] ?? point.detail)
          : point.detail,
    }))
  }
</script>

<Seo
  title={$t.perspectiveDetail.seoTitle(name)}
  description={$t.perspectiveDetail.seoDescription(name)}
  noindex
/>

<div class="max-w-6xl mx-auto p-6 space-y-5">
  <header class="bw-panel p-5">
    <h1 class="font-condensed text-3xl text-[#e5c57a]">{$t.perspectiveDetail.title(name)}</h1>
    <p class="text-sm text-slate-300 mt-2">{$t.perspectiveDetail.intro}</p>

    {#if view}
      <form method="GET" class="mt-4 flex flex-wrap items-end gap-3">
        <label class="text-xs uppercase tracking-wider text-slate-400">
          {$t.perspectiveDetail.cursor}
          <select
            name="eventId"
            class="mt-1 block bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-100"
          >
            {#each data.events as event (event.id)}
              <option value={event.id} selected={event.id === view.cursor.id}>
                {$t.common.chapterShort(event.chapter)} · {event.title}
              </option>
            {/each}
          </select>
        </label>
        <button
          type="submit"
          class="border border-[#e5c57a] rounded px-3 py-2 text-sm text-[#e5c57a]"
          >{$t.perspectiveDetail.apply}</button
        >
      </form>

      <dl class="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
        <div>
          <dt class="text-xs uppercase tracking-wider text-slate-400">
            {$t.perspectives.occupiedBody}
          </dt>
          <dd>
            {#if view.identity.body}
              <a class="text-[#e5c57a]" href={$link(view.identity.body.href ?? '#')}
                >{view.identity.body.label}</a
              >
            {:else}
              {$t.common.unknown}
            {/if}
          </dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wider text-slate-400">
            {$t.perspectives.activeConsciousness}
          </dt>
          <dd>
            {#if view.identity.consciousness}
              <a class="text-[#e5c57a]" href={$link(view.identity.consciousness.href ?? '#')}
                >{view.identity.consciousness.label}</a
              >
            {:else}
              {$t.common.unknown}
            {/if}
          </dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wider text-slate-400">
            {$t.perspectiveDetail.apparentIdentity}
          </dt>
          <dd>
            {#if view.identity.apparent}
              <a class="text-[#e5c57a]" href={$link(view.identity.apparent.href ?? '#')}
                >{view.identity.apparent.label}</a
              >
            {:else}
              {$t.common.unknown}
            {/if}
            {#if view.identity.isDissonant}
              <span class="ml-2 text-xs text-rose-300">{$t.perspectiveDetail.dissonant}</span>
            {/if}
          </dd>
        </div>
      </dl>
    {/if}
  </header>

  {#if !view}
    <p class="bw-panel p-5 text-sm text-slate-400 italic">{$t.perspectiveDetail.noEvents}</p>
  {:else}
    <section class="grid lg:grid-cols-[1.2fr_1fr] gap-4">
      <article class="bw-panel p-4">
        <h2 class="text-sm uppercase tracking-widest text-slate-400 mb-3">
          {$t.perspectiveDetail.subjectiveMap}
        </h2>
        <PlanMap
          markers={view.markers}
          tier={view.tier}
          emptyLabel={$t.perspectiveDetail.noPositions}
          elsewhereLabel={$t.perspectiveDetail.markersElsewhere}
        />
        <ul class="mt-3 text-sm text-slate-300 space-y-1">
          <li>● {$t.perspectiveDetail.confirmedPosition}</li>
          <li>◐ {$t.perspectiveDetail.likelyPosition}</li>
          <li>○ {$t.perspectiveDetail.lastKnownPosition}</li>
        </ul>
      </article>

      <article class="bw-panel p-4">
        <h2 class="text-sm uppercase tracking-widest text-slate-400 mb-3">
          {$t.perspectiveDetail.activeKnowledge}
        </h2>
        {#if data.knowledge.length}
          <div class="space-y-2">
            {#each data.knowledge as entry (entry.id)}
              <KnowledgeStatus
                state={entry.state}
                label={`${entry.subject.label} — ${entry.predicate}`}
                details={details(entry)}
              />
            {/each}
          </div>
        {:else}
          <p class="text-sm text-slate-400 italic">
            {$t.perspectiveDetail.noKnowledge}
            <a class="text-[#e5c57a]" href={$link(`/knowledge/${data.character.slug}`)}
              >{$t.perspectives.openKnowledgeMap}</a
            >
          </p>
        {/if}
      </article>
    </section>

    <PerspectiveTimeline
      reality={view.streams.reality}
      body={worded(view.streams.body)}
      consciousness={worded(view.streams.consciousness)}
      knowledge={worded(view.streams.knowledge)}
      currentIndex={view.currentIndex}
    />
  {/if}
</div>

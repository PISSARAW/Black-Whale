<script lang="ts">
  import Seo from '$lib/components/Seo.svelte'
  import ContinuityList from '$lib/components/identity/ContinuityList.svelte'
  import { link, t } from '$lib/i18n'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  let record = $derived(data.record)
</script>

<Seo
  title={$t.bodyDetail.seoTitle(record.label)}
  description={$t.bodyDetail.seoDescription(record.label)}
  noindex
/>

<div class="max-w-4xl mx-auto p-6 space-y-4">
  <header class="bw-panel p-5">
    <h1 class="font-condensed text-3xl text-[#e5c57a]">{$t.bodyDetail.title(record.label)}</h1>
    <p class="text-sm text-slate-300 mt-2">{$t.bodyDetail.intro}</p>

    <dl class="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
      <div>
        <dt class="text-xs uppercase tracking-wider text-slate-400">{$t.bodyDetail.bodyType}</dt>
        <dd class="text-slate-100">
          {$t.identity.enums.bodyType[record.bodyType] ?? record.bodyType}
        </dd>
      </div>
      <div>
        <dt class="text-xs uppercase tracking-wider text-slate-400">{$t.bodyDetail.owner}</dt>
        <dd class="text-slate-100">
          {#if record.originalCharacter?.href}
            <a class="text-[#e5c57a]" href={$link(record.originalCharacter.href)}
              >{record.originalCharacter.label}</a
            >
          {:else}
            {$t.common.unknown}
          {/if}
        </dd>
      </div>
      <div>
        <dt class="text-xs uppercase tracking-wider text-slate-400">{$t.identity.firstVisible}</dt>
        <dd class="text-slate-100">{$t.common.chapterShort(record.firstVisible.chapter)}</dd>
      </div>
    </dl>
  </header>

  {#if record.occupants.length}
    <section class="bw-panel p-4">
      <h2 class="text-sm uppercase tracking-widest text-slate-400 mb-3">
        {$t.bodyDetail.occupants}
      </h2>
      <ul class="flex flex-wrap gap-2 text-sm">
        {#each record.occupants as occupant (occupant.id)}
          <li>
            <a
              class="border border-slate-700 rounded px-3 py-1 hover:border-[#e5c57a]"
              href={$link(occupant.href ?? '#')}>{occupant.label}</a
            >
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <section class="bw-panel p-4">
    <h2 class="text-sm uppercase tracking-widest text-slate-400 mb-3">
      {$t.identity.continuityTitle}
    </h2>
    <ContinuityList entries={record.entries} />
  </section>
</div>

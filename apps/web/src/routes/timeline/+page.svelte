<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Timeline — Black Whale</title>
</svelte:head>

<div class="min-h-screen bg-bw-dark p-6 text-gray-200">
  <header class="mb-12 border-b border-gray-800 pb-6 max-w-4xl mx-auto">
    <h1 class="text-4xl font-black tracking-tight text-bw-gold mb-2">Timeline</h1>
    <p class="text-lg text-gray-400">Interactive chronology of the Succession Arc.</p>
    {#if data.spoilerLimit}
      <div class="mt-4 inline-flex items-center rounded-full bg-bw-scarlet/10 px-3 py-1 text-sm font-medium text-bw-scarlet ring-1 ring-inset ring-bw-scarlet/20">
        Spoiler Limit: Chapter {data.spoilerLimit}
      </div>
    {/if}
  </header>

  <div class="relative mx-auto max-w-4xl pb-24">
    <!-- Vertical line -->
    <div class="absolute left-4 top-1 bottom-0 w-0.5 bg-gradient-to-b from-bw-gold/40 via-gray-700/40 to-transparent md:left-8"></div>

    <div class="space-y-16">
      {#each data.chapters as chapter (chapter.id)}
        <section class="relative">
          <!-- Chapter marker -->
          <div class="absolute left-2.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-bw-dark ring-2 ring-bw-gold md:left-6.5" style="transform: translateX(-50%)">
            <div class="h-1.5 w-1.5 rounded-full bg-bw-gold"></div>
          </div>

          <div class="ml-10 md:ml-16">
            <h2 class="text-2xl font-bold text-white mb-6">
              Chapter {chapter.number}{#if chapter.title} <span class="text-gray-400 font-normal ml-2">— {chapter.title}</span>{/if}
            </h2>

            <div class="space-y-4">
              {#each chapter.events as event (event.id)}
                <a href="/ship?eventId={event.id}" class="group block">
                  <div class="relative overflow-hidden rounded-xl border border-gray-800/80 bg-gray-900/40 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-bw-gold/40 hover:bg-gray-800/60 hover:shadow-xl hover:shadow-bw-gold/5">
                    <div class="absolute left-0 top-0 bottom-0 w-1 bg-gray-800 transition-colors group-hover:bg-bw-gold"></div>
                    <div class="flex flex-col sm:flex-row sm:items-baseline justify-between mb-3 gap-2">
                      <h3 class="text-lg font-semibold text-gray-100 group-hover:text-bw-gold transition-colors">{event.title}</h3>
                      <span class="text-xs font-mono text-gray-500 bg-black/40 px-2 py-1 rounded">SEQ-{event.sequence.toString().padStart(4, '0')}</span>
                    </div>
                    <p class="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">{event.summary}</p>
                  </div>
                </a>
              {/each}
              
              {#if chapter.events.length === 0}
                <div class="rounded-xl border border-gray-800/50 border-dashed p-6 text-center bg-gray-900/20">
                  <p class="text-sm text-gray-500 italic">No events recorded for this chapter yet.</p>
                </div>
              {/if}
            </div>
          </div>
        </section>
      {/each}

      {#if data.chapters.length === 0}
        <div class="text-center py-12">
          <p class="text-lg text-gray-500">No chapters found for the current spoiler limit.</p>
        </div>
      {/if}
    </div>
  </div>
</div>

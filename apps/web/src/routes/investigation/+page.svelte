<script lang="ts">
  import { onMount } from 'svelte'
  import { link, locale } from '$lib/i18n'
  import { listCases } from '$lib/investigation/catalog'
  import {
    INVESTIGATION_PORTFOLIO_KEY,
    freshPortfolio,
    parsePortfolio,
    type InvestigationPortfolio,
  } from '$lib/investigation/portfolio'

  const cases = $derived(listCases($locale))
  let portfolio = $state<InvestigationPortfolio>(freshPortfolio())

  const copy = $derived(
    $locale === 'fr'
      ? {
          eyebrow: 'Black Whale · Bureau des Hunters',
          title: 'Salle des affaires',
          intro: 'Choisissez un dossier, reprenez une enquête ou consultez une affaire résolue.',
          chapter: 'Chapitre requis',
          duration: 'Durée estimée',
          investigator: 'Enquêteur',
          difficulty: 'Difficulté',
          available: 'Disponible',
          inProgress: 'En cours',
          solved: 'Résolu',
          open: 'Ouvrir le dossier',
          resume: 'Reprendre',
        }
      : {
          eyebrow: 'Black Whale · Hunter Office',
          title: 'Case room',
          intro: 'Choose a case, resume an investigation, or review a solved file.',
          chapter: 'Required chapter',
          duration: 'Estimated time',
          investigator: 'Investigator',
          difficulty: 'Difficulty',
          available: 'Available',
          inProgress: 'In progress',
          solved: 'Solved',
          open: 'Open case',
          resume: 'Resume',
        },
  )

  onMount(() => {
    portfolio = parsePortfolio(localStorage.getItem(INVESTIGATION_PORTFOLIO_KEY))
  })

  function statusFor(caseId: string) {
    return portfolio.cases[caseId]?.status ?? 'available'
  }
</script>

<svelte:head>
  <title>{copy.title} · Black Whale</title>
  <meta name="description" content={copy.intro} />
</svelte:head>

<main
  class="min-h-screen bg-[#020617] px-4 py-10 text-slate-100 sm:px-8 lg:px-12 relative overflow-hidden"
>
  <!-- Ethereal Background glow -->
  <div
    class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-900/20 via-[#020617] to-[#020617]"
  ></div>
  <div
    class="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"
  ></div>

  <div class="relative mx-auto max-w-6xl z-10">
    <div class="mb-12 text-center md:text-left">
      <p
        class="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-900/30 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.2)]"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_8px_#7dd3fc]"></span>
        {copy.eyebrow}
      </p>
      <h1
        class="mt-6 text-5xl font-black tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] sm:text-7xl"
      >
        {copy.title}
      </h1>
      <p class="mt-4 max-w-2xl text-base leading-relaxed text-sky-100/70">{copy.intro}</p>
    </div>

    <section class="grid gap-8 md:grid-cols-2 lg:grid-cols-3" aria-label={copy.title}>
      {#each cases as investigationCase (investigationCase.slug)}
        {@const status = statusFor(investigationCase.slug)}
        <article
          class="group relative flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-sky-300/20 bg-gradient-to-b from-[#0f172a]/90 to-[#020617]/95 p-1 shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(56,189,248,0.15)]"
        >
          <!-- Magical Card Border -->
          <div
            class="absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          >
            <div
              class="absolute inset-0 bg-gradient-to-tr from-sky-400/0 via-sky-400/20 to-emerald-400/0"
            ></div>
          </div>

          <div
            class="relative z-10 flex h-full flex-col rounded-xl border border-white/5 bg-[#0a0f1c]/80 p-6 backdrop-blur-md"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p
                  class="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-400/80 drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]"
                >
                  {investigationCase.location}
                </p>
                <h2 class="mt-2 text-2xl font-black text-white">{investigationCase.title}</h2>
              </div>
              <div class="relative">
                {#if status === 'solved'}
                  <span
                    class="absolute -inset-1 animate-pulse rounded-full bg-emerald-400/20 blur-sm"
                  ></span>
                {/if}
                <span
                  class="relative flex items-center justify-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider {status ===
                  'solved'
                    ? 'border-emerald-400/50 bg-emerald-950/50 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                    : status === 'in-progress'
                      ? 'border-sky-400/50 bg-sky-950/50 text-sky-300'
                      : 'border-white/20 bg-white/5 text-white/50'}"
                >
                  {status === 'solved'
                    ? copy.solved
                    : status === 'in-progress'
                      ? copy.inProgress
                      : copy.available}
                </span>
              </div>
            </div>

            <div class="mt-6 flex-1">
              <p class="text-sm leading-relaxed text-slate-400">{investigationCase.teaser}</p>
            </div>

            <div class="mt-6 rounded-lg border border-sky-900/30 bg-sky-950/20 p-4">
              <dl class="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
                <div>
                  <dt class="text-[9px] uppercase tracking-wider text-sky-500/70">
                    {copy.investigator}
                  </dt>
                  <dd class="mt-1 font-mono text-sky-100">{investigationCase.investigator}</dd>
                </div>
                <div>
                  <dt class="text-[9px] uppercase tracking-wider text-sky-500/70">
                    {copy.chapter}
                  </dt>
                  <dd class="mt-1 font-mono text-sky-100">{investigationCase.requiredChapter}</dd>
                </div>
                <div>
                  <dt class="text-[9px] uppercase tracking-wider text-sky-500/70">
                    {copy.duration}
                  </dt>
                  <dd class="mt-1 font-mono text-sky-100">
                    ~{investigationCase.estimatedMinutes}m
                  </dd>
                </div>
                <div>
                  <dt class="text-[9px] uppercase tracking-wider text-sky-500/70">
                    {copy.difficulty}
                  </dt>
                  <dd class="mt-1 flex gap-1">
                    {#each Array(investigationCase.difficulty === 'advanced' ? 3 : investigationCase.difficulty === 'intermediate' ? 2 : 1) as _, index (index)}
                      <span class="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_5px_#fbbf24]"
                      ></span>
                    {/each}
                  </dd>
                </div>
              </dl>
            </div>

            <a
              class="group/btn relative mt-6 inline-flex min-h-12 w-full items-center justify-center overflow-hidden rounded-lg bg-sky-900/40 px-5 py-3 font-bold text-sky-100 transition-all hover:bg-sky-800/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400"
              href={$link(`/investigation/${investigationCase.slug}`)}
            >
              <div
                class="absolute inset-0 bg-gradient-to-r from-sky-400/0 via-sky-400/10 to-sky-400/0 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100"
              ></div>
              <span class="relative z-10 flex items-center gap-2">
                {status === 'in-progress' ? copy.resume : copy.open}
                <svg
                  class="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg
                >
              </span>
              <!-- Binder Ring Effect -->
              <div
                class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-sky-400/30 opacity-0 shadow-[0_0_8px_#38bdf8] transition-all duration-300 group-hover/btn:opacity-100"
              ></div>
              <div
                class="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-sky-400/30 opacity-0 shadow-[0_0_8px_#38bdf8] transition-all duration-300 group-hover/btn:opacity-100"
              ></div>
            </a>
          </div>
        </article>
      {/each}
    </section>
  </div>
</main>

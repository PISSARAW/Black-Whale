<script lang="ts">
  import { onMount } from 'svelte'
  import { locale } from '$lib/i18n'
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

<main class="min-h-screen bg-[#070b12] px-4 py-10 text-slate-100 sm:px-8 lg:px-12">
  <div class="mx-auto max-w-6xl">
    <p class="text-xs font-bold uppercase tracking-[0.28em] text-cyan-300">{copy.eyebrow}</p>
    <h1 class="mt-3 text-4xl font-black tracking-tight sm:text-6xl">{copy.title}</h1>
    <p class="mt-4 max-w-2xl text-base leading-7 text-slate-300">{copy.intro}</p>

    <section class="mt-10 grid gap-5 md:grid-cols-2" aria-label={copy.title}>
      {#each cases as investigationCase}
        {@const status = statusFor(investigationCase.slug)}
        <article
          class="flex min-h-80 flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                {investigationCase.location}
              </p>
              <h2 class="mt-2 text-3xl font-black">{investigationCase.title}</h2>
            </div>
            <span
              class="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-200"
            >
              {status === 'solved'
                ? copy.solved
                : status === 'in-progress'
                  ? copy.inProgress
                  : copy.available}
            </span>
          </div>

          <p class="mt-5 leading-7 text-slate-300">{investigationCase.teaser}</p>
          <dl class="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt class="text-slate-500">{copy.investigator}</dt>
              <dd class="mt-1 font-semibold">{investigationCase.investigator}</dd>
            </div>
            <div>
              <dt class="text-slate-500">{copy.chapter}</dt>
              <dd class="mt-1 font-semibold">{investigationCase.requiredChapter}</dd>
            </div>
            <div>
              <dt class="text-slate-500">{copy.duration}</dt>
              <dd class="mt-1 font-semibold">~{investigationCase.estimatedMinutes} min</dd>
            </div>
            <div>
              <dt class="text-slate-500">{copy.difficulty}</dt>
              <dd class="mt-1 font-semibold capitalize">{investigationCase.difficulty}</dd>
            </div>
          </dl>

          <a
            class="mt-auto inline-flex min-h-11 items-center justify-center rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
            href={`/investigation/${investigationCase.slug}`}
          >
            {status === 'in-progress' ? copy.resume : copy.open}
          </a>
        </article>
      {/each}
    </section>
  </div>
</main>
